import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { DatabaseService } from '../database/database.service';

describe('HealthController', () => {
  let controller: HealthController;
  let mockDbService: Partial<DatabaseService>;

  beforeEach(async () => {
    mockDbService = {
      query: jest.fn().mockResolvedValue({ rows: [{ ok: 1 }] } as any),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: DatabaseService,
          useValue: mockDbService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    // Mock the redis client ping
    (controller as any).redisClient = {
      status: 'ready',
      ping: jest.fn().mockResolvedValue('PONG'),
      connect: jest.fn().mockResolvedValue(undefined),
    };
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return ok when both DB and Redis are healthy', async () => {
    const result = await controller.check();
    expect(result.status).toBe('ok');
    expect(result.database).toBe('connected');
    expect(result.redis).toBe('connected');
  });

  it('should throw 503 when database fails', async () => {
    (mockDbService.query as jest.Mock).mockRejectedValueOnce(new Error('DB connection refused'));

    await expect(controller.check()).rejects.toThrow();
  });
});
