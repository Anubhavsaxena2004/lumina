import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Request } from 'express';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly db: DatabaseService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.access_token || null;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super-secret-jwt-key-kumkum-2026',
    });
  }

  async validate(payload: any) {
    const res = await this.db.query(
      `SELECT id, name, username, role, is_active FROM users WHERE id = $1`,
      [payload.sub],
    );

    if (res.rows.length === 0 || !res.rows[0].is_active) {
      throw new UnauthorizedException('User account is invalid or deactivated');
    }

    const u = res.rows[0];
    return {
      id: u.id,
      name: u.name,
      username: u.username,
      role: u.role,
      isActive: u.is_active,
    };
  }
}
