import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DatabaseService } from '../database/database.service';
import Redis from 'ioredis';
import { Public } from '../common/decorators';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private redisClient: Redis;

  constructor(private readonly databaseService: DatabaseService) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.redisClient = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
    });
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check endpoint verifying PostgreSQL and Redis connectivity' })
  @ApiResponse({ status: 200, description: 'All core services (database, redis) are operational' })
  @ApiResponse({ status: 503, description: 'One or more core services are degraded' })
  async check() {
    let dbStatus = 'disconnected';
    let redisStatus = 'disconnected';
    const errors: Record<string, string> = {};

    // 1. Verify PostgreSQL Database connectivity
    try {
      await this.databaseService.query('SELECT 1 as ok');
      dbStatus = 'connected';
    } catch (err: any) {
      dbStatus = 'error';
      errors.database = err.message || 'PostgreSQL connection failed';
    }

    // 2. Verify Redis connectivity
    try {
      if (this.redisClient.status !== 'ready' && this.redisClient.status !== 'connecting') {
        await this.redisClient.connect().catch(() => {});
      }
      const pong = await this.redisClient.ping();
      if (pong === 'PONG') {
        redisStatus = 'connected';
      }
    } catch (err: any) {
      redisStatus = 'error';
      errors.redis = err.message || 'Redis ping failed';
    }

    const isHealthy = dbStatus === 'connected' && redisStatus === 'connected';

    const response = {
      status: isHealthy ? 'ok' : 'degraded',
      service: 'kumkum-payal-api',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      redis: redisStatus,
      ...(Object.keys(errors).length > 0 ? { errors } : {}),
    };

    if (!isHealthy) {
      // Return 503 when either DB or Redis is down, but still return JSON status
      throw new HttpException(response, HttpStatus.SERVICE_UNAVAILABLE);
    }

    return response;
  }
}
