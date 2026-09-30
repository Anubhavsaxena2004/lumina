import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AuthUser } from '../common/decorators/current-user.decorator';

export interface PurchaseLineDto {
  item_id: string;
  pieces: number;
  weight_kg: number;
  rate: number;
  amount?: number;
}

export interface CreatePurchaseDto {
  party_id: string;
  due_date?: string;
  notes?: string;
  lines: PurchaseLineDto[];
}

@Injectable()
export class PurchasesService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(user: AuthUser, limit = 50, offset = 0) {
    const conditions: string[] = ['p.is_deleted = false'];
    const params: any[] = [];
    let idx = 1;

    if (user.role === 'STAFF') {
      conditions.push(`p.created_by = $${idx++}`);
      params.push(user.id);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit, offset);

    const query = `
      SELECT p.*, pt.name AS party_name, pt.whatsapp_number AS party_phone, u.name AS creator_name
      FROM purchases p
      JOIN parties pt ON pt.id = p.party_id
      JOIN users u ON u.id = p.created_by
      ${where}
      ORDER BY p.entry_at DESC
      LIMIT $${idx++} OFFSET $${idx}
    `;

    const res = await this.db.query(query, params);
    return res.rows;
  }

  async create(dto: CreatePurchaseDto, user: AuthUser) {
    if (!dto.lines || dto.lines.length === 0) {
      throw new BadRequestException('At least one purchase line is required');
    }

    return await this.db.withTransaction(async (client) => {
      let totalAmount = 0;
      for (const line of dto.lines) {
        if (line.pieces <= 0 && line.weight_kg <= 0) {
          throw new BadRequestException('Pieces or weight (Kg) must be greater than zero for each line');
        }
        const calcAmount = line.amount !== undefined ? line.amount : (line.weight_kg > 0 ? line.weight_kg * line.rate : line.pieces * line.rate);
        totalAmount += calcAmount;
      }

      // 1. Insert Purchase Header
      const purchaseInsert = await client.query(
        `INSERT INTO purchases (party_id, due_date, total_amount, notes, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [dto.party_id, dto.due_date || null, totalAmount, dto.notes || null, user.id],
      );
      const purchase = purchaseInsert.rows[0];

      // 2. Insert Purchase Lines & 3. Stock Movements (positive delta)
      for (const line of dto.lines) {
        const lineAmount = line.amount !== undefined ? line.amount : (line.weight_kg > 0 ? line.weight_kg * line.rate : line.pieces * line.rate);
        await client.query(
          `INSERT INTO purchase_lines (purchase_id, item_id, pieces, weight_kg, rate, amount)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [purchase.id, line.item_id, line.pieces || 0, line.weight_kg || 0, line.rate, lineAmount],
        );

        // Stock movement: Purchase adds stock
        await client.query(
          `INSERT INTO stock_movements (item_id, source_type, source_id, pieces_delta, kg_delta)
           VALUES ($1, 'PURCHASE', $2, $3, $4)`,
          [line.item_id, purchase.id, line.pieces || 0, line.weight_kg || 0],
        );
      }

      // 4. Ledger Entry: Purchase increases supplier credit (business owes more)
      await client.query(
        `INSERT INTO ledger_entries (party_id, source_type, source_id, debit, credit)
         VALUES ($1, 'PURCHASE', $2, 0, $3)`,
        [purchase.party_id, purchase.id, totalAmount],
      );

      return purchase;
    });
  }
}
