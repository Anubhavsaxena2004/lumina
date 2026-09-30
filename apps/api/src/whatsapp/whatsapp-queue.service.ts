import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { DatabaseService } from '../database/database.service';
import {
  IWhatsAppProvider,
  SendMessageOptions,
  MockWhatsAppProvider,
  CloudApiWhatsAppProvider,
} from './whatsapp.provider';

export const WHATSAPP_QUEUE_NAME = 'whatsapp-notifications';

@Injectable()
export class WhatsAppQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WhatsAppQueueService.name);
  private queue: Queue | null = null;
  private worker: Worker | null = null;
  private redisClient: IORedis | null = null;
  private provider: IWhatsAppProvider;
  private isRedisAvailable = false;

  constructor(private readonly db: DatabaseService) {
    if (process.env.WHATSAPP_PROVIDER === 'cloud') {
      this.provider = new CloudApiWhatsAppProvider(this.db);
    } else {
      this.provider = new MockWhatsAppProvider(this.db);
    }
  }

  async onModuleInit() {
    await this.initQueue();
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
    }
    if (this.queue) {
      await this.queue.close();
    }
    if (this.redisClient) {
      this.redisClient.disconnect();
    }
  }

  private async initQueue() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    try {
      this.redisClient = new IORedis(redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        retryStrategy: () => null, // Do not hang if Redis is not running
        connectTimeout: 2000,
        lazyConnect: true,
      });

      // Attempt initial ping
      await this.redisClient.connect();
      await this.redisClient.ping();
      this.isRedisAvailable = true;

      this.queue = new Queue(WHATSAPP_QUEUE_NAME, {
        connection: this.redisClient,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: true,
          removeOnFail: false, // Keep in dead-letter state for inspection
        },
      });

      this.worker = new Worker(
        WHATSAPP_QUEUE_NAME,
        async (job: Job) => {
          return this.processJob(job);
        },
        { connection: this.redisClient },
      );

      this.worker.on('failed', async (job, err) => {
        this.logger.error(
          `[BullMQ] WhatsApp job ${job?.id} failed on attempt ${job?.attemptsMade}: ${err.message}`,
        );
        if (job && job.attemptsMade >= (job.opts.attempts || 3)) {
          this.logger.warn(`[BullMQ] WhatsApp job ${job.id} dead-lettered after max retries`);
          await this.markMessageDeadLetter(job.data.messageRecordId, err.message);
        }
      });

      this.logger.log(`[BullMQ] WhatsApp Queue initialized with Redis at ${redisUrl}`);
    } catch (err: any) {
      this.isRedisAvailable = false;
      this.logger.warn(
        `Redis unavailable (${err.message}). WhatsApp queue will use direct resilient background execution.`,
      );
    }
  }

  async enqueue(options: SendMessageOptions): Promise<{ messageId: string; status: string }> {
    // 1. Persist to DB with QUEUED status
    const insertRes = await this.db.query(
      `INSERT INTO whatsapp_messages (kind, to_number, template_name, payload, related_type, related_id, status, attempts)
       VALUES ($1, $2, $3, $4, $5, $6, 'QUEUED', 0)
       RETURNING id`,
      [
        options.templateName,
        options.to,
        options.templateName,
        JSON.stringify(options.parameters),
        options.relatedType || null,
        options.relatedId || null,
      ],
    );

    const messageRecordId = insertRes.rows[0].id;

    // 2. Dispatch via BullMQ if Redis is active
    if (this.isRedisAvailable && this.queue) {
      try {
        const job = await this.queue.add(
          'send-whatsapp-message',
          { ...options, messageRecordId },
          {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
          },
        );
        return { messageId: String(job.id), status: 'QUEUED' };
      } catch (err: any) {
        this.logger.warn(`Queue dispatch failed, falling back to direct send: ${err.message}`);
      }
    }

    // 3. Fallback: Asynchronous direct dispatch without blocking entry transaction
    setImmediate(async () => {
      await this.executeDirectSend(options, messageRecordId);
    });

    return { messageId: String(messageRecordId), status: 'QUEUED' };
  }

  private async processJob(job: Job) {
    const { messageRecordId, ...options } = job.data;
    try {
      const result = await this.provider.sendMessage(options);
      await this.db.query(
        `UPDATE whatsapp_messages
         SET status = $1, provider_msg_id = $2, attempts = attempts + 1
         WHERE id = $3`,
        [result.status, result.providerMsgId, messageRecordId],
      );
      return result;
    } catch (err: any) {
      await this.db.query(
        `UPDATE whatsapp_messages
         SET attempts = attempts + 1
         WHERE id = $1`,
        [messageRecordId],
      );
      throw err; // Re-throw so BullMQ triggers exponential backoff retry
    }
  }

  private async executeDirectSend(options: SendMessageOptions, messageRecordId: string) {
    let lastError: any = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await this.provider.sendMessage(options);
        await this.db.query(
          `UPDATE whatsapp_messages
           SET status = $1, provider_msg_id = $2, attempts = $3
           WHERE id = $4`,
          [result.status, result.providerMsgId, attempt, messageRecordId],
        );
        return;
      } catch (err: any) {
        lastError = err;
        await this.db.query(
          `UPDATE whatsapp_messages SET attempts = $1 WHERE id = $2`,
          [attempt, messageRecordId],
        );
        if (attempt < 3 && process.env.NODE_ENV !== 'test') {
          // Exponential backoff delay
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    // All retries failed
    await this.markMessageDeadLetter(messageRecordId, lastError?.message || 'Unknown error');
  }

  private async markMessageDeadLetter(messageRecordId: string, errorMsg: string) {
    await this.db.query(
      `UPDATE whatsapp_messages
       SET status = 'FAILED'
       WHERE id = $1`,
      [messageRecordId],
    );
  }

  getProvider(): IWhatsAppProvider {
    return this.provider;
  }
}
