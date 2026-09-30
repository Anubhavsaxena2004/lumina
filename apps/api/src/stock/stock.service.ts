import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class StockService {
  constructor(private readonly db: DatabaseService) {}

  async getStockRegister() {
    const query = `
      SELECT i.id, i.name, i.category,
             COALESCE(SUM(sm.pieces_delta), 0) AS current_pieces,
             COALESCE(SUM(sm.kg_delta), 0.000) AS current_kg,
             MAX(sm.entry_at) AS last_movement_at
      FROM items i
      LEFT JOIN stock_movements sm ON sm.item_id = i.id
      WHERE i.is_active = true
      GROUP BY i.id, i.name, i.category
      ORDER BY i.name ASC
    `;
    const res = await this.db.query(query);
    return res.rows;
  }

  async getItemMovements(itemId: string, limit = 50) {
    const itemRes = await this.db.query(`SELECT id, name, category FROM items WHERE id = $1`, [itemId]);
    if (itemRes.rows.length === 0) throw new NotFoundException('Item not found');

    const query = `
      SELECT sm.id, sm.entry_at, sm.source_type, sm.source_id,
             sm.pieces_delta, sm.kg_delta
      FROM stock_movements sm
      WHERE sm.item_id = $1
      ORDER BY sm.entry_at DESC, sm.id DESC
      LIMIT $2
    `;
    const res = await this.db.query(query, [itemId, limit]);
    return {
      item: itemRes.rows[0],
      movements: res.rows,
    };
  }
}
