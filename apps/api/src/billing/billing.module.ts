import { Module } from '@nestjs/common';
import { BillRendererService } from './bill-renderer.service';
import { BillingController } from './billing.controller';
import { SalesModule } from '../sales/sales.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [SalesModule, WhatsAppModule],
  controllers: [BillingController],
  providers: [BillRendererService],
  exports: [BillRendererService],
})
export class BillingModule {}
