import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AuthUser } from '../common/decorators/current-user.decorator';

export interface CreateJobWorkDto {
  work_type: 'POLISH' | 'MEENA';
  party_id: string;
  item_id: string;
  direction: 'ISSUE' | 'RECEIVE';
  weight_kg: number;
  charge_amount?: number;
  notes?: string;
}

@Injectable()
export class JobWorkService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(user: AuthUser, limit = 50, offset = 0) {
    const conditions: string[] = ['jw.is_deleted = false'];
    const params: any[] = [];
    let idx = 1;

    if (user.role === 'STAFF') {
      conditions.push(`jw.created_by = $${idx++}`);
      params.push(user.id);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit, offset);

    const query = `
      SELECT jw.*, p.name AS party_name, i.name AS item_name, u.name AS creator_name
      FROM job_work_entries jw
      JOIN parties p ON p.id = jw.party_id
      JOIN items i ON i.id = jw.item_id
      JOIN users u ON u.id = jw.created_by
      ${where}
      ORDER BY jw.entry_at DESC
      LIMIT $${idx++} OFFSET $${idx}
    `;

    const res = await this.db.query(query, params);
    return res.rows;
  }

  async getBalances() {
    const query = `
      SELECT p.id AS party_id, p.name AS party_name,
             i.id AS item_id, i.name AS item_name,
             jw.work_type,
             COALESCE(SUM(CASE WHEN jw.direction = 'ISSUE' THEN jw.weight_kg ELSE -jw.weight_kg END), 0) AS net_weight_with_worker
      FROM job_work_entries jw
      JOIN parties p ON p.id = jw.party_id
      JOIN items i ON i.id = jw.item_id
      WHERE jw.is_deleted = false
      GROUP BY p.id, p.name, i.id, i.name, jw.work_type
      HAVING COALESCE(SUM(CASE WHEN jw.direction = 'ISSUE' THEN jw.weight_kg ELSE -jw.weight_kg END), 0) <> 0
      ORDER BY p.name ASC
    `;
    const res = await this.db.query(query);
    return res.rows;
  }

  async create(dto: CreateJobWorkDto, user: AuthUser) {
    if (dto.weight_kg <= 0) {
      throw new BadRequestException('Weight in Kg must be strictly greater than zero');
    }

    return await this.db.withTransaction(async (client) => {
      const charge = dto.charge_amount || 0;

      // 1. Insert Job Work Entry
      const jwRes = await client.query(
        `INSERT INTO job_work_entries (work_type, party_id, item_id, direction, weight_kg, charge_amount, notes, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          dto.work_type,
          dto.party_id,
          dto.item_id,
          dto.direction,
          dto.weight_kg,
          charge,
          dto.notes || null,
          user.id,
        ],
      );
      const jw = jwRes.rows[0];

      // 2. Stock Movement
      const kgDelta = dto.direction === 'ISSUE' ? -dto.weight_kg : dto.weight_kg;
      await client.query(
        `INSERT INTO stock_movements (item_id, source_type, source_id, pieces_delta, kg_delta)
         VALUES ($1, 'JOB_WORK', $2, 0, $3)`,
        [dto.item_id, jw.id, kgDelta],
      );

      // 3. Ledger Entry if charge amount present (RECEIVE from karigar with labor charge increases supplier credit)
      if (charge > 0) {
        await client.query(
          `INSERT INTO ledger_entries (party_id, source_type, source_id, debit, credit)
           VALUES ($1, 'JOB_WORK_CHARGE', $2, 0, $3)`,
          [dto.party_id, jw.id, charge],
        );
      }

      return jw;
    });
  }
}
