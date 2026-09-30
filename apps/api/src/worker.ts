import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { WhatsAppQueueService } from './whatsapp/whatsapp-queue.service';

async function bootstrap() {
  const logger = new Logger('KumkumWorker');
  logger.log('Starting Kumkum Payal BullMQ background worker...');

  const app = await NestFactory.createApplicationContext(AppModule);
  
  // Ensure Queue and Workers are active
  const queueService = app.get(WhatsAppQueueService);
  logger.log('WhatsApp notification queue worker listening for background jobs.');

  process.on('SIGTERM', async () => {
    logger.log('SIGTERM received. Shutting down worker gracefully...');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.log('SIGINT received. Shutting down worker gracefully...');
    await app.close();
    process.exit(0);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal error in worker process:', err);
  process.exit(1);
});
