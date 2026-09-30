import { Module, Global } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppQueueService } from './whatsapp-queue.service';
import { CommonModule } from '../common/common.module';

@Global()
@Module({
  imports: [CommonModule],
  controllers: [WhatsAppController],
  providers: [WhatsAppService, WhatsAppQueueService],
  exports: [WhatsAppService, WhatsAppQueueService],
})
export class WhatsAppModule {}
