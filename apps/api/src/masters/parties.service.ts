import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface CreatePartyDto {
  name: string;
  type: 'CUSTOMER' | 'SUPPLIER' | 'BOTH';
  whatsapp_number?: string;
  address?: string;
  opening_balance?: number;
}

export interface UpdatePartyDto {
  name?: string;
  type?: 'CUSTOMER' | 'SUPPLIER' | 'BOTH';
  whatsapp_number?: string;
  address?: string;
  opening_balance?: number;
  is_active?: boolean;
}

@Injectable()
export class PartiesService {
  constructor(private readonly db: DatabaseService) {}

  private validateWhatsApp(phone?: string) {
    if (!phone) return;
    // E.164 international format validation (+ followed by 7-15 digits)
    const e164Regex = /^\+[1-9]\d{6,14}$/;
    if (!e164Regex.test(phone.trim())) {
      throw new BadRequestException(
        'WhatsApp number must be in E.164 international format (e.g. +919829012345)',
      );
    }
  }

  async findAll(search?: string, type?: string, limit = 50, offset = 0) {
    const conditions: string[] = ['is_active = true'];
    const params: any[] = [];
    let idx = 1;

    if (search) {
      conditions.push(`(name ILIKE $${idx} OR whatsapp_number ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    if (type) {
      conditions.push(`(type = $${idx} OR type = 'BOTH')`);
      params.push(type);
      idx++;
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `
      SELECT id, name, type, whatsapp_number, address, opening_balance, is_active, created_at
      FROM parties
      ${whereClause}
      ORDER BY name ASC
      LIMIT $${idx} OFFSET $${idx + 1}
    `;
    params.push(limit, offset);

    const res = await this.db.query(query, params);
    return res.rows;
  }

  async findOne(id: string) {
    const res = await this.db.query(
      `SELECT p.*,
        COALESCE(
          p.opening_balance + (
            SELECT COALESCE(SUM(debit - credit), 0)
            FROM ledger_entries
            WHERE party_id = p.id
          ),
          p.opening_balance
        ) AS current_balance
       FROM parties p
       WHERE p.id = $1`,
      [id],
    );

    if (res.rows.length === 0) {
      throw new NotFoundException('Party not found');
    }
    return res.rows[0];
  }

  async create(dto: CreatePartyDto, userId: string) {
    this.validateWhatsApp(dto.whatsapp_number);

    const res = await this.db.query(
      `INSERT INTO parties (name, type, whatsapp_number, address, opening_balance, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        dto.name.trim(),
        dto.type,
        dto.whatsapp_number ? dto.whatsapp_number.trim() : null,
        dto.address || null,
        dto.opening_balance || 0,
        userId,
      ],
    );
    return res.rows[0];
  }

  async update(id: string, dto: UpdatePartyDto) {
    this.validateWhatsApp(dto.whatsapp_number);

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (dto.name !== undefined) {
      updates.push(`name = $${idx++}`);
      values.push(dto.name.trim());
    }
    if (dto.type !== undefined) {
      updates.push(`type = $${idx++}`);
      values.push(dto.type);
    }
    if (dto.whatsapp_number !== undefined) {
      updates.push(`whatsapp_number = $${idx++}`);
      values.push(dto.whatsapp_number ? dto.whatsapp_number.trim() : null);
    }
    if (dto.address !== undefined) {
      updates.push(`address = $${idx++}`);
      values.push(dto.address);
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
    const res = await this.db.query(
      `UPDATE parties SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values,
    );

    if (res.rows.length === 0) {
      throw new NotFoundException('Party not found');
    }
    return res.rows[0];
  }
}
