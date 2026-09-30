import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateSaleDto, UpdateSaleDto } from './sales.dto';
import { AuthUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class SalesService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(user: AuthUser, partyId?: string, limit = 50, offset = 0) {
    const conditions: string[] = ['s.is_deleted = false'];
    const params: any[] = [];
    let idx = 1;

    // Staff isolation rule: staff only view own entries
    if (user.role === 'STAFF') {
      conditions.push(`s.created_by = $${idx++}`);
      params.push(user.id);
    }

    if (partyId) {
      conditions.push(`s.party_id = $${idx++}`);
      params.push(partyId);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit, offset);

    const query = `
      SELECT s.*, p.name AS party_name, p.whatsapp_number AS party_phone, u.name AS creator_name,
        COALESCE(
          (SELECT SUM(va.amount) FROM voucher_allocations va WHERE va.sale_id = s.id),
          0
        ) AS allocated_amount,
        (s.total_amount - COALESCE(
          (SELECT SUM(va.amount) FROM voucher_allocations va WHERE va.sale_id = s.id),
          0
        )) AS outstanding_amount
      FROM sales s
      JOIN parties p ON p.id = s.party_id
      JOIN users u ON u.id = s.created_by
      ${where}
      ORDER BY s.entry_at DESC
      LIMIT $${idx++} OFFSET $${idx}
    `;

    const res = await this.db.query(query, params);
    return res.rows;
  }

  async findOne(id: string, user: AuthUser) {
    const saleRes = await this.db.query(
      `SELECT s.*, p.name AS party_name, p.whatsapp_number AS party_phone, u.name AS creator_name,
        COALESCE(
          (SELECT SUM(va.amount) FROM voucher_allocations va WHERE va.sale_id = s.id),
          0
        ) AS allocated_amount,
        (s.total_amount - COALESCE(
          (SELECT SUM(va.amount) FROM voucher_allocations va WHERE va.sale_id = s.id),
          0
        )) AS outstanding_amount
       FROM sales s
       JOIN parties p ON p.id = s.party_id
       JOIN users u ON u.id = s.created_by
       WHERE s.id = $1 AND s.is_deleted = false`,
      [id],
    );

    if (saleRes.rows.length === 0) {
      throw new NotFoundException('Sale not found');
    }

    const sale = saleRes.rows[0];
    if (user.role === 'STAFF' && sale.created_by !== user.id) {
      throw new ForbiddenException('You can only view your own entries');
    }

    const linesRes = await this.db.query(
      `SELECT sl.*, i.name AS item_name 
       FROM sale_lines sl
       JOIN items i ON i.id = sl.item_id
       WHERE sl.sale_id = $1`,
      [id],
    );

    sale.lines = linesRes.rows;
    return sale;
  }

  async create(dto: CreateSaleDto, user: AuthUser) {
    if (!dto.lines || dto.lines.length === 0) {
      throw new BadRequestException('At least one item line is required');
    }

    return await this.db.withTransaction(async (client) => {
      let totalAmount = 0;

      // Validate lines
      for (const line of dto.lines) {
        if (line.pieces <= 0 && line.weight_kg <= 0) {
          throw new BadRequestException('Pieces or weight (Kg) must be greater than zero for each line');
        }
        const calcAmount = line.amount !== undefined ? line.amount : (line.weight_kg > 0 ? line.weight_kg * line.rate : line.pieces * line.rate);
        totalAmount += calcAmount;
      }

      // 1. Insert Sales Header
      const saleInsert = await client.query(
        `INSERT INTO sales (party_id, due_date, total_amount, notes, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [dto.party_id, dto.due_date, totalAmount, dto.notes || null, user.id],
      );
      const sale = saleInsert.rows[0];

      // 2. Insert Sale Lines & 3. Stock Movements (negative delta)
      for (const line of dto.lines) {
        const lineAmount = line.amount !== undefined ? line.amount : (line.weight_kg > 0 ? line.weight_kg * line.rate : line.pieces * line.rate);
        await client.query(
          `INSERT INTO sale_lines (sale_id, item_id, pieces, weight_kg, rate, amount)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [sale.id, line.item_id, line.pieces || 0, line.weight_kg || 0, line.rate, lineAmount],
        );

        // Stock movement: Sale reduces stock
        await client.query(
          `INSERT INTO stock_movements (item_id, source_type, source_id, pieces_delta, kg_delta)
           VALUES ($1, 'SALE', $2, $3, $4)`,
          [line.item_id, sale.id, -(line.pieces || 0), -(line.weight_kg || 0)],
        );
      }

      // 4. Ledger Entry: Sale increases customer debit (they owe more)
      await client.query(
        `INSERT INTO ledger_entries (party_id, source_type, source_id, debit, credit)
         VALUES ($1, 'SALE', $2, $3, 0)`,
        [sale.party_id, sale.id, totalAmount],
      );

      return sale;
    });
  }

  async softDelete(id: string, user: AuthUser) {
    if (user.role !== 'OWNER') {
      throw new ForbiddenException('Only the owner can delete entries');
    }

    return await this.db.withTransaction(async (client) => {
      const saleRes = await client.query(`SELECT * FROM sales WHERE id = $1 AND is_deleted = false`, [id]);
      if (saleRes.rows.length === 0) {
        throw new NotFoundException('Sale not found');
      }
      const sale = saleRes.rows[0];

      // Reversing Ledger Entry: Credit customer to offset previous debit
      await client.query(
        `INSERT INTO ledger_entries (party_id, source_type, source_id, debit, credit)
         VALUES ($1, 'SALE_REVERSAL', $2, 0, $3)`,
        [sale.party_id, sale.id, sale.total_amount],
      );

      // Reversing Stock Movements: Add back stock
      const lines = await client.query(`SELECT * FROM sale_lines WHERE sale_id = $1`, [id]);
      for (const line of lines.rows) {
        await client.query(
          `INSERT INTO stock_movements (item_id, source_type, source_id, pieces_delta, kg_delta)
           VALUES ($1, 'SALE_REVERSAL', $2, $3, $4)`,
          [line.item_id, sale.id, line.pieces, line.weight_kg],
        );
      }

      // Mark as deleted
      await client.query(
        `UPDATE sales SET is_deleted = true, deleted_at = now(), deleted_by = $1 WHERE id = $2`,
        [user.id, id],
      );

      // Write to immutable audit_log
      await client.query(
        `INSERT INTO audit_log (actor_id, action, table_name, record_id, before_data, after_data)
         VALUES ($1, 'SOFT_DELETE', 'sales', $2, $3, $4)`,
        [user.id, id, JSON.stringify(sale), JSON.stringify({ is_deleted: true, deleted_by: user.id })],
      );

      return { success: true, message: 'Sale deleted and reversing ledger/stock entries created' };
    });
  }
}
