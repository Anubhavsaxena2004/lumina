import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface CreateBankAccountDto {
  name: string;
  opening_balance?: number;
}

export interface UpdateBankAccountDto {
  name?: string;
  opening_balance?: number;
  is_active?: boolean;
}

@Injectable()
export class BankAccountsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(search?: string, limit = 50, offset = 0) {
    let query = `
      SELECT b.id, b.name, b.opening_balance, b.is_active,
        COALESCE(
          b.opening_balance + (
            SELECT COALESCE(SUM(CASE WHEN mv.kind = 'RECEIPT' THEN mv.amount ELSE -mv.amount END), 0)
            FROM money_vouchers mv
            WHERE mv.bank_account_id = b.id AND mv.is_deleted = false
          ),
          b.opening_balance
        ) AS current_balance
      FROM bank_accounts b
      WHERE b.is_active = true
    `;
    const params: any[] = [];
    let idx = 1;

    if (search) {
      query += ` AND b.name ILIKE $${idx++}`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY b.name ASC LIMIT $${idx++} OFFSET $${idx}`;
    params.push(limit, offset);

    const res = await this.db.query(query, params);
    return res.rows;
  }

  async findOne(id: string) {
    const query = `
      SELECT b.id, b.name, b.opening_balance, b.is_active,
        COALESCE(
          b.opening_balance + (
            SELECT COALESCE(SUM(CASE WHEN mv.kind = 'RECEIPT' THEN mv.amount ELSE -mv.amount END), 0)
            FROM money_vouchers mv
            WHERE mv.bank_account_id = b.id AND mv.is_deleted = false
          ),
          b.opening_balance
        ) AS current_balance
      FROM bank_accounts b
      WHERE b.id = $1
    `;
    const res = await this.db.query(query, [id]);
    if (res.rows.length === 0) {
      throw new NotFoundException('Bank account not found');
    }
    return res.rows[0];
  }

  async create(dto: CreateBankAccountDto) {
    const res = await this.db.query(
      `INSERT INTO bank_accounts (name, opening_balance) VALUES ($1, $2) RETURNING *`,
      [dto.name.trim(), dto.opening_balance || 0],
    );
    return res.rows[0];
  }

  async update(id: string, dto: UpdateBankAccountDto) {
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (dto.name !== undefined) {
      updates.push(`name = $${idx++}`);
      values.push(dto.name.trim());
    }

    if (dto.opening_balance !== undefined) {
      updates.push(`opening_balance = $${idx++}`);
      values.push(dto.opening_balance);
    }

    if (dto.is_active !== undefined) {
      updates.push(`is_active = $${idx++}`);
      values.push(dto.is_active);
    }

    if (updates.length === 0) {
      throw new BadRequestException('No fields provided to update');
    }

    values.push(id);
    const query = `UPDATE bank_accounts SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
    const res = await this.db.query(query, values);
    if (res.rows.length === 0) {
      throw new NotFoundException('Bank account not found');
    }
    return res.rows[0];
  }
}
