import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { DatabaseService } from '../database/database.service';

export interface TokenPayload {
  sub: string;
  username: string;
  name: string;
  role: 'OWNER' | 'STAFF';
}

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const result = await this.db.query(
      `SELECT id, name, username, password_hash, role, is_active FROM users WHERE username = $1`,
      [username.trim().toLowerCase()],
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const user = result.rows[0];

    if (!user.is_active) {
      throw new UnauthorizedException('This account has been deactivated');
    }

    // Verify argon2 hash or plaintext fallback for testing
    let isMatch = false;
    try {
      if (user.password_hash.startsWith('$argon2')) {
        isMatch = await argon2.verify(user.password_hash, pass);
      } else {
        isMatch = user.password_hash === pass;
      }
    } catch {
      isMatch = user.password_hash === pass;
    }

    if (!isMatch) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // Update last_login_at
    await this.db.query(
      `UPDATE users SET last_login_at = now() WHERE id = $1`,
      [user.id],
    );

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      isActive: user.is_active,
    };
  }

  async login(user: any) {
    const payload: TokenPayload = {
      sub: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_EXPIRATION_TIME || '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key-kumkum-2026',
      expiresIn: process.env.JWT_REFRESH_EXPIRATION_TIME || '7d',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
    };
  }

  async refreshToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key-kumkum-2026',
      });

      const userRes = await this.db.query(
        `SELECT id, name, username, role, is_active FROM users WHERE id = $1`,
        [decoded.sub],
      );

      if (userRes.rows.length === 0 || !userRes.rows[0].is_active) {
        throw new UnauthorizedException('User no longer active');
      }

      const user = userRes.rows[0];
      return this.login({
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        isActive: user.is_active,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async hashPassword(password: string): Promise<string> {
    return await argon2.hash(password);
  }
}
