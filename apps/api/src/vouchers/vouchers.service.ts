import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateVoucherDto } from './vouchers.dto';
import { AuthUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class VouchersService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(user: AuthUser, limit = 50, offset = 0) {
    const conditions: string[] = ['mv.is_deleted = false'];
    const params: any[] = [];
    let idx = 1;

    if (user.role === 'STAFF') {
      conditions.push(`mv.created_by = $${idx++}`);
      params.push(user.id);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit, offset);

    const query = `
      SELECT mv.*, p.name AS party_name, b.name AS bank_name, u.name AS creator_name
      FROM money_vouchers mv
      JOIN parties p ON p.id = mv.party_id
      LEFT JOIN bank_accounts b ON b.id = mv.bank_account_id
      JOIN users u ON u.id = mv.created_by
      ${where}
      ORDER BY mv.entry_at DESC
      LIMIT $${idx++} OFFSET $${idx}
    `;

    const res = await this.db.query(query, params);
    return res.rows;
  }

  async create(dto: CreateVoucherDto, user: AuthUser) {
    if (dto.mode === 'BANK' && !dto.bank_account_id) {
      throw new BadRequestException('A bank account is required when payment mode is BANK');
    }

    return await this.db.withTransaction(async (client) => {
      // 1. Insert Money Voucher
      const voucherRes = await client.query(
        `INSERT INTO money_vouchers (kind, party_id, mode, bank_account_id, amount, reference_no, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          dto.kind,
          dto.party_id,
          dto.mode,
          dto.bank_account_id || null,
          dto.amount,
          dto.reference_no || null,
          user.id,
        ],
      );
      const voucher = voucherRes.rows[0];

      // 2. Ledger Entry
      // RECEIPT reduces customer balance -> CREDIT party ledger
      // PAYMENT reduces supplier balance -> DEBIT party ledger
      const isReceipt = dto.kind === 'RECEIPT';
      const debit = isReceipt ? 0 : dto.amount;
      const credit = isReceipt ? dto.amount : 0;

      await client.query(
        `INSERT INTO ledger_entries (party_id, source_type, source_id, debit, credit)
         VALUES ($1, 'VOUCHER', $2, $3, $4)`,
        [voucher.party_id, voucher.id, debit, credit],
      );

      // 3. Process Allocations
      if (dto.allocations && dto.allocations.length > 0) {
        let totalAllocated = 0;
        for (const alloc of dto.allocations) {
          totalAllocated += alloc.amount;

          if (alloc.sale_id) {
            // Check sale outstanding
            const saleRes = await client.query(
              `SELECT s.id, s.total_amount,
                COALESCE((SELECT SUM(va.amount) FROM voucher_allocations va WHERE va.sale_id = s.id), 0) AS already_allocated
               FROM sales s WHERE s.id = $1`,
              [alloc.sale_id],
            );
            if (saleRes.rows.length === 0) throw new NotFoundException('Allocated sale not found');
            const sale = saleRes.rows[0];
            const outstanding = sale.total_amount - parseFloat(sale.already_allocated);

            if (alloc.amount > outstanding + 0.01) {
              throw new BadRequestException(`Allocation ₹${alloc.amount} exceeds sale outstanding ₹${outstanding}`);
            }

            await client.query(
              `INSERT INTO voucher_allocations (voucher_id, sale_id, amount) VALUES ($1, $2, $3)`,
              [voucher.id, alloc.sale_id, alloc.amount],
            );

            // Update sale status
            const newTotalAlloc = parseFloat(sale.already_allocated) + alloc.amount;
            const newStatus = newTotalAlloc >= sale.total_amount ? 'PAID' : 'PARTIAL';
            await client.query(`UPDATE sales SET status = $1 WHERE id = $2`, [newStatus, alloc.sale_id]);
          } else if (alloc.purchase_id) {
            await client.query(
              `INSERT INTO voucher_allocations (voucher_id, purchase_id, amount) VALUES ($1, $2, $3)`,
              [voucher.id, alloc.purchase_id, alloc.amount],
            );
          }
        }

        if (totalAllocated > dto.amount + 0.01) {
          throw new BadRequestException('Total bill allocations cannot exceed the voucher amount');
        }
      }

      return voucher;
    });
  }

  async softDelete(id: string, user: AuthUser) {
    if (user.role !== 'OWNER') {
      throw new ForbiddenException('Only the owner can delete vouchers');
    }

    return await this.db.withTransaction(async (client) => {
      const vRes = await client.query(
        `SELECT * FROM money_vouchers WHERE id = $1 AND is_deleted = false`,
        [id],
      );
      if (vRes.rows.length === 0) throw new NotFoundException('Voucher not found');
      const voucher = vRes.rows[0];

      // Reversing ledger row: swap debit & credit
      const isReceipt = voucher.kind === 'RECEIPT';
      const debit = isReceipt ? voucher.amount : 0;
      const credit = isReceipt ? 0 : voucher.amount;

      await client.query(
        `INSERT INTO ledger_entries (party_id, source_type, source_id, debit, credit)
         VALUES ($1, 'VOUCHER_REVERSAL', $2, $3, $4)`,
        [voucher.party_id, voucher.id, debit, credit],
      );

      // Recompute bill statuses for linked sales
      const allocs = await client.query(
        `SELECT sale_id FROM voucher_allocations WHERE voucher_id = $1 AND sale_id IS NOT NULL`,
        [id],
      );

      // Delete allocations
      await client.query(`DELETE FROM voucher_allocations WHERE voucher_id = $1`, [id]);

      for (const a of allocs.rows) {
        const sRes = await client.query(
          `SELECT s.total_amount,
            COALESCE((SELECT SUM(amount) FROM voucher_allocations WHERE sale_id = s.id), 0) AS allocated
           FROM sales s WHERE s.id = $1`,
          [a.sale_id],
        );
        if (sRes.rows.length > 0) {
          const allocTotal = parseFloat(sRes.rows[0].allocated);
          const totalAmt = parseFloat(sRes.rows[0].total_amount);
          const status = allocTotal <= 0 ? 'OPEN' : allocTotal < totalAmt ? 'PARTIAL' : 'PAID';
          await client.query(`UPDATE sales SET status = $1 WHERE id = $2`, [status, a.sale_id]);
        }
      }

      // Mark voucher deleted
      await client.query(
        `UPDATE money_vouchers SET is_deleted = true, deleted_at = now(), deleted_by = $1 WHERE id = $2`,
        [user.id, id],
      );

      // Audit log
      await client.query(
        `INSERT INTO audit_log (actor_id, action, table_name, record_id, before_data, after_data)
         VALUES ($1, 'SOFT_DELETE', 'money_vouchers', $2, $3, $4)`,
        [user.id, id, JSON.stringify(voucher), JSON.stringify({ is_deleted: true, deleted_by: user.id })],
      );

      return { success: true, message: 'Voucher reversed and sales status restored' };
    });
  }
}
