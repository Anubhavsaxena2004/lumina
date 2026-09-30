import {
  Controller,
  Post,
  Get,
  Param,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { BillRendererService } from './bill-renderer.service';
import { SalesService } from '../sales/sales.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { Roles, CurrentUser } from '../common/decorators';
import { AuthUser } from '../common/decorators/current-user.decorator';

@ApiTags('Bill Generation & Media Delivery')
@Controller('sales')
export class BillingController {
  constructor(
    private readonly billRenderer: BillRendererService,
    private readonly salesService: SalesService,
    private readonly whatsAppService: WhatsAppService,
  ) {}

  @Get(':id/bill/preview')
  @Roles('OWNER', 'STAFF')
  @ApiOperation({ summary: 'Preview generated bill JPG invoice image' })
  async previewBill(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    const sale = await this.salesService.findOne(id, user);
    const jpgBuffer = await this.billRenderer.renderBillToJpg(sale);

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', `inline; filename="invoice_${sale.bill_no}.jpg"`);
    res.send(jpgBuffer);
  }

  @Post(':id/bill')
  @Roles('OWNER', 'STAFF')
  @ApiOperation({ summary: 'One-click bill: Render JPG invoice and send to party WhatsApp' })
  async sendBill(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    const sale = await this.salesService.findOne(id, user);
    const { filePath, fileName } = await this.billRenderer.saveAndRecordBill(sale);

    let whatsAppResult = { status: 'SKIPPED_NO_PHONE', providerMsgId: '' };
    if (sale.party_phone) {
      whatsAppResult = await this.whatsAppService.send({
        to: sale.party_phone,
        templateName: 'bill_delivery',
        parameters: {
          customer_name: sale.party_name,
          bill_no: sale.bill_no,
          amount: `₹${parseFloat(sale.total_amount).toLocaleString('en-IN')}`,
          due_date: sale.due_date,
        },
        relatedType: 'SALE',
        relatedId: sale.id,
      });
    }

    return {
      success: true,
      bill_no: sale.bill_no,
      filePath,
      fileName,
      whatsapp: whatsAppResult,
    };
  }
}
