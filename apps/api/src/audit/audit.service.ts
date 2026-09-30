import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AuditService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(actorId?: string, tableName?: string, limit = 50, offset = 0) {
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (actorId) {
      conditions.push(`al.actor_id = $${idx++}`);
      params.push(actorId);
    }

    if (tableName) {
      conditions.push(`al.table_name = $${idx++}`);
      params.push(tableName);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit, offset);

    const query = `
      SELECT al.*, u.name AS actor_name, u.username AS actor_username
      FROM audit_log al
      JOIN users u ON u.id = al.actor_id
      ${where}
      ORDER BY al.at DESC
      LIMIT $${idx++} OFFSET $${idx}
    `;

    const res = await this.db.query(query, params);
    return res.rows;
  }
}
