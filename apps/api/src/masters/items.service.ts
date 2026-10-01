import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface CreateItemDto {
  name: string;
  category?: string;
  opening_pieces?: number;
  opening_weight_kg?: number;
}

export interface UpdateItemDto {
  name?: string;
  category?: string;
  is_active?: boolean;
}

@Injectable()
export class ItemsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(search?: string, limit = 50, offset = 0) {
    let query = `
      SELECT i.id, i.name, i.category, i.is_active,
             COALESCE(SUM(sm.pieces_delta), 0) AS stock_pieces,
             COALESCE(SUM(sm.kg_delta), 0.000) AS stock_kg
      FROM items i
      LEFT JOIN stock_movements sm ON sm.item_id = i.id
      WHERE i.is_active = true
    `;
    const params: any[] = [];
    let idx = 1;

    if (search) {
      query += ` AND i.name ILIKE $${idx++}`;
      params.push(`%${search}%`);
    }

    query += ` GROUP BY i.id, i.name, i.category, i.is_active ORDER BY i.name ASC LIMIT $${idx++} OFFSET $${idx}`;
    params.push(limit, offset);

    const res = await this.db.query(query, params);
    return res.rows;
  }

  async findOne(id: string) {
    const res = await this.db.query(
      `SELECT i.id, i.name, i.category, i.is_active,
              COALESCE(SUM(sm.pieces_delta), 0) AS stock_pieces,
              COALESCE(SUM(sm.kg_delta), 0.000) AS stock_kg
       FROM items i
       LEFT JOIN stock_movements sm ON sm.item_id = i.id
       WHERE i.id = $1
       GROUP BY i.id, i.name, i.category, i.is_active`,
      [id],
    );
    if (res.rows.length === 0) {
      throw new NotFoundException('Item not found');
    }
    return res.rows[0];
  }

  async create(dto: CreateItemDto) {
    try {
      const res = await this.db.query(
        `INSERT INTO items (name, category) VALUES ($1, $2) RETURNING *`,
        [dto.name.trim(), dto.category ? dto.category.trim() : null],
      );
      const item = res.rows[0];

      const pieces = Number(dto.opening_pieces) || 0;
      const weightKg = Number(dto.opening_weight_kg) || 0;

      if (pieces > 0 || weightKg > 0) {
        await this.db.query(
          `INSERT INTO stock_movements (item_id, source_type, source_id, pieces_delta, kg_delta)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            item.id,
            'OPENING_STOCK',
            item.id,
            pieces,
            weightKg,
          ],
        );
      }

      return {
        ...item,
        stock_pieces: pieces,
        stock_kg: Math.round(weightKg * 1000) / 1000,
      };
    } catch (err: any) {
      if (err.code === '23505') {
        throw new ConflictException(`Item with name '${dto.name}' already exists.`);
      }
      throw err;
    }
  }

  async update(id: string, dto: UpdateItemDto) {
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (dto.name !== undefined) {
      updates.push(`name = $${idx++}`);
      values.push(dto.name.trim());
    }
    if (dto.category !== undefined) {
      updates.push(`category = $${idx++}`);
      values.push(dto.category ? dto.category.trim() : null);
    }
    if (dto.is_active !== undefined) {
      updates.push(`is_active = $${idx++}`);
      values.push(dto.is_active);
    }

    values.push(id);
    const res = await this.db.query(
      `UPDATE items SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values,
    );
    if (res.rows.length === 0) {
      throw new NotFoundException('Item not found');
    }
    return res.rows[0];
  }
}
