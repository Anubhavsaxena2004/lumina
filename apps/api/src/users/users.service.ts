import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { DatabaseService } from '../database/database.service';

export interface CreateStaffDto {
  name: string;
  username: string;
  password?: string;
  mobileNumber?: string;
}

export interface UpdateStaffDto {
  name?: string;
  mobileNumber?: string;
  isActive?: boolean;
}

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  async findAllStaff() {
    const res = await this.db.query(
      `SELECT id, name, username, role, is_active, last_login_at, created_at
       FROM users 
       WHERE role = 'STAFF'
       ORDER BY created_at DESC`,
    );
    return res.rows;
  }

  async findStaffById(id: string) {
    const res = await this.db.query(
      `SELECT id, name, username, role, is_active, last_login_at, created_at
       FROM users 
       WHERE id = $1 AND role = 'STAFF'`,
      [id],
    );
    if (res.rows.length === 0) {
      throw new NotFoundException('Staff member not found');
    }
    return res.rows[0];
  }

  async createStaff(dto: CreateStaffDto, ownerId: string) {
    const defaultPassword = dto.password || 'password123';
    const passwordHash = await argon2.hash(defaultPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    try {
      const res = await this.db.query(
        `INSERT INTO users (name, username, password_hash, role, is_active, created_by)
         VALUES ($1, $2, $3, 'STAFF', true, $4)
         RETURNING id, name, username, role, is_active, created_at`,
        [dto.name.trim(), dto.username.trim().toLowerCase(), passwordHash, ownerId],
      );
      return res.rows[0];
    } catch (err: any) {
      if (err.code === '23505') {
        throw new ConflictException(`Username '${dto.username}' is already taken.`);
      }
      throw err;
    }
  }

  async updateStaff(id: string, dto: UpdateStaffDto) {
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (dto.name !== undefined) {
      updates.push(`name = $${idx++}`);
      values.push(dto.name.trim());
    }

    if (dto.isActive !== undefined) {
      updates.push(`is_active = $${idx++}`);
      values.push(dto.isActive);
    }

    if (updates.length === 0) {
      throw new BadRequestException('No fields provided to update');
    }

    values.push(id);
    const query = `
      UPDATE users 
      SET ${updates.join(', ')} 
      WHERE id = $${idx} AND role = 'STAFF'
      RETURNING id, name, username, role, is_active, last_login_at, created_at
    `;

    const res = await this.db.query(query, values);
    if (res.rows.length === 0) {
      throw new NotFoundException('Staff member not found');
    }

    return res.rows[0];
  }

  async deactivateStaff(id: string) {
    const res = await this.db.query(
      `UPDATE users 
       SET is_active = false 
       WHERE id = $1 AND role = 'STAFF'
       RETURNING id, name, username, role, is_active, last_login_at`,
      [id],
    );
    if (res.rows.length === 0) {
      throw new NotFoundException('Staff member not found');
    }
    return res.rows[0];
  }

  async reactivateStaff(id: string) {
    const res = await this.db.query(
      `UPDATE users 
       SET is_active = true 
       WHERE id = $1 AND role = 'STAFF'
       RETURNING id, name, username, role, is_active, last_login_at`,
      [id],
    );
    if (res.rows.length === 0) {
      throw new NotFoundException('Staff member not found');
    }
    return res.rows[0];
  }

  async resetPassword(id: string, newPass?: string) {
    const password = newPass || 'password123';
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const res = await this.db.query(
      `UPDATE users 
       SET password_hash = $1 
       WHERE id = $2 AND role = 'STAFF'
       RETURNING id, username`,
      [passwordHash, id],
    );

    if (res.rows.length === 0) {
      throw new NotFoundException('Staff member not found');
    }

    return { success: true, message: `Password reset successfully for user ${res.rows[0].username}` };
  }
}
