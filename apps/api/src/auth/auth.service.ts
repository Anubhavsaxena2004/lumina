import {
  Injectable,
  UnauthorizedException,
  HttpException,
  HttpStatus,
  Logger,
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

interface AttemptRecord {
  count: number;
  blockedUntil: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private loginAttempts = new Map<string, AttemptRecord>();
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  private checkRateLimit(key: string) {
    const now = Date.now();
    const record = this.loginAttempts.get(key);
    if (record && record.blockedUntil > now) {
      const waitSeconds = Math.ceil((record.blockedUntil - now) / 1000);
      throw new HttpException(
        `Too many failed login attempts. Please try again in ${waitSeconds} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private registerFailedAttempt(key: string) {
    const now = Date.now();
    const record = this.loginAttempts.get(key) || { count: 0, blockedUntil: 0 };
    record.count += 1;
    if (record.count >= this.MAX_ATTEMPTS) {
      record.blockedUntil = now + this.LOCKOUT_MS;
      this.logger.warn(`Rate limit triggered for ${key}. Locked out for 5 minutes.`);
    }
    this.loginAttempts.set(key, record);
  }

  private resetRateLimit(key: string) {
    this.loginAttempts.delete(key);
  }

  async validateUser(username: string, pass: string, clientIp: string = 'unknown'): Promise<any> {
    const rateLimitKey = `${clientIp}:${username.trim().toLowerCase()}`;
    this.checkRateLimit(rateLimitKey);

    const result = await this.db.query(
      `SELECT id, name, username, password_hash, role, is_active FROM users WHERE username = $1`,
      [username.trim().toLowerCase()],
    );

    if (result.rows.length === 0) {
      this.registerFailedAttempt(rateLimitKey);
      throw new UnauthorizedException('Invalid username or password');
    }

    const user = result.rows[0];

    if (!user.is_active) {
      throw new UnauthorizedException('This account has been deactivated. Please contact the owner.');
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
      this.registerFailedAttempt(rateLimitKey);
      throw new UnauthorizedException('Invalid username or password');
    }

    // Reset rate limit on successful authentication
    this.resetRateLimit(rateLimitKey);

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
        throw new UnauthorizedException('User account is invalid or deactivated');
      }

      const user = userRes.rows[0];
      // Token rotation: Return brand new access and refresh token pair
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
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
  }
}
