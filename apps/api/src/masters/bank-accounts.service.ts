import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface CreateBankAccountDto {
  name: string;
  opening_balance?: number;
}

@Injectable()
export class BankAccountsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll() {
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
      WHERE b.is_active = true
      ORDER BY b.name ASC
    `;
    const res = await this.db.query(query);
    return res.rows;
  }

  async create(dto: CreateBankAccountDto) {
    const res = await this.db.query(
      `INSERT INTO bank_accounts (name, opening_balance) VALUES ($1, $2) RETURNING *`,
      [dto.name.trim(), dto.opening_balance || 0],
    );
    return res.rows[0];
  }
}
