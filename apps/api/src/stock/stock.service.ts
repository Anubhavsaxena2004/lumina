import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class StockService {
  constructor(private readonly db: DatabaseService) {}

  async getStockRegister(search?: string, category?: string) {
    const conditions: string[] = ['i.is_active = true'];
    const params: any[] = [];
    let idx = 1;

    if (search) {
      conditions.push(`i.name ILIKE $${idx++}`);
      params.push(`%${search}%`);
    }

    if (category) {
      conditions.push(`i.category = $${idx++}`);
      params.push(category);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const query = `
      SELECT i.id, i.name, i.category,
             COALESCE(SUM(sm.pieces_delta), 0)::integer AS current_pieces,
             ROUND(COALESCE(SUM(sm.kg_delta), 0.000)::numeric, 3) AS current_kg,
             MAX(sm.entry_at) AS last_movement_at
      FROM items i
      LEFT JOIN stock_movements sm ON sm.item_id = i.id
      ${where}
      GROUP BY i.id, i.name, i.category
      ORDER BY i.name ASC
    `;

    const res = await this.db.query(query, params);

    let totalPieces = 0;
    let totalKg = 0;
    const items = res.rows.map((row) => {
      const pieces = parseInt(row.current_pieces, 10);
      const kg = parseFloat(row.current_kg);
      totalPieces += pieces;
      totalKg += kg;
      return {
        ...row,
        current_pieces: pieces,
        current_kg: Math.round(kg * 1000) / 1000,
      };
    });

    return {
      summary: {
        total_items: items.length,
        total_pieces: totalPieces,
        total_kg: Math.round(totalKg * 1000) / 1000,
      },
      items,
    };
  }

  async getItemMovements(
    itemId: string,
    limit = 50,
    offset = 0,
    startDate?: string,
    endDate?: string,
  ) {
    const itemRes = await this.db.query(
      `SELECT id, name, category, is_active FROM items WHERE id = $1`,
      [itemId],
    );
    if (itemRes.rows.length === 0) {
      throw new NotFoundException('Item not found');
    }

    const conditions: string[] = ['sm.item_id = $1'];
    const params: any[] = [itemId];
    let idx = 2;

    if (startDate) {
      conditions.push(`sm.entry_at >= $${idx++}`);
      params.push(startDate);
    }
    if (endDate) {
      conditions.push(`sm.entry_at <= $${idx++}`);
      params.push(endDate);
    }

    params.push(limit, offset);

    const query = `
      SELECT sm.id, sm.entry_at, sm.source_type, sm.source_id,
             sm.pieces_delta, sm.kg_delta
      FROM stock_movements sm
      WHERE ${conditions.join(' AND ')}
      ORDER BY sm.entry_at DESC, sm.id DESC
      LIMIT $${idx++} OFFSET $${idx}
    `;

    const res = await this.db.query(query, params);

    // Current totals for the item
    const balanceRes = await this.db.query(
      `SELECT COALESCE(SUM(pieces_delta), 0)::integer AS total_pieces,
              ROUND(COALESCE(SUM(kg_delta), 0.000)::numeric, 3) AS total_kg
       FROM stock_movements WHERE item_id = $1`,
      [itemId],
    );

    return {
      item: itemRes.rows[0],
      current_balance: {
        pieces: parseInt(balanceRes.rows[0]?.total_pieces || '0', 10),
        kg: parseFloat(balanceRes.rows[0]?.total_kg || '0'),
      },
      movements: res.rows.map((r) => ({
        ...r,
        pieces_delta: parseInt(r.pieces_delta, 10),
        kg_delta: parseFloat(r.kg_delta),
      })),
    };
  }

  async getAllMovements(
    sourceType?: string,
    startDate?: string,
    endDate?: string,
    limit = 50,
    offset = 0,
  ) {
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (sourceType) {
      conditions.push(`sm.source_type = $${idx++}`);
      params.push(sourceType);
    }
    if (startDate) {
      conditions.push(`sm.entry_at >= $${idx++}`);
      params.push(startDate);
    }
    if (endDate) {
      conditions.push(`sm.entry_at <= $${idx++}`);
      params.push(endDate);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit, offset);

    const query = `
      SELECT sm.id, sm.item_id, sm.entry_at, sm.source_type, sm.source_id,
             sm.pieces_delta, sm.kg_delta,
             i.name AS item_name, i.category AS item_category
      FROM stock_movements sm
      JOIN items i ON i.id = sm.item_id
      ${where}
      ORDER BY sm.entry_at DESC, sm.id DESC
      LIMIT $${idx++} OFFSET $${idx}
    `;

    const res = await this.db.query(query, params);
    return res.rows.map((r) => ({
      ...r,
      pieces_delta: parseInt(r.pieces_delta, 10),
      kg_delta: parseFloat(r.kg_delta),
    }));
  }

  async adjustStock(dto: {
    item_id: string;
    pieces_delta: number;
    kg_delta: number;
    reason?: string;
  }) {
    const itemRes = await this.db.query(
      `SELECT id, name, category, is_active FROM items WHERE id = $1`,
      [dto.item_id],
    );
    if (itemRes.rows.length === 0) {
      throw new NotFoundException('Item not found');
    }

    const piecesDelta = parseInt(String(dto.pieces_delta), 10) || 0;
    const kgDelta = Math.round((parseFloat(String(dto.kg_delta)) || 0) * 1000) / 1000;

    const res = await this.db.query(
      `INSERT INTO stock_movements (item_id, source_type, source_id, pieces_delta, kg_delta)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        dto.item_id,
        'STOCK_ADJUSTMENT',
        dto.reason?.trim() || 'Manual Stock Adjustment',
        piecesDelta,
        kgDelta,
      ],
    );

    return {
      success: true,
      movement: res.rows[0],
      item: itemRes.rows[0],
    };
  }
}

