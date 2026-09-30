import {
  Controller,
  Post,
  Get,
  Param,
  Res,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import * as fs from 'fs';
import { BillRendererService } from './bill-renderer.service';
import { SalesService } from '../sales/sales.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { Roles, CurrentUser, Public } from '../common/decorators';
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
  @ApiOperation({ summary: 'Preview generated bill JPG invoice image without sending' })
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
  @ApiOperation({ summary: 'One-click bill: Render JPG invoice, upload and send to party WhatsApp' })
  async sendBill(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    const sale = await this.salesService.findOne(id, user);

    if (!sale.party_phone || !sale.party_phone.trim()) {
      throw new BadRequestException('Customer does not have a registered WhatsApp phone number');
    }

    const { filePath, fileName } = await this.billRenderer.saveAndRecordBill(sale);
    const { url: mediaSignedUrl } = this.billRenderer.generateSignedUrl(sale.id, 60);

    const whatsAppResult = await this.whatsAppService.send({
      to: sale.party_phone,
      templateName: 'bill_delivery',
      parameters: {
        customer_name: sale.party_name,
        bill_no: String(sale.bill_no),
        total_amount: `₹${parseFloat(sale.total_amount).toLocaleString('en-IN')}`,
        due_date: sale.due_date,
      },
      mediaUrl: mediaSignedUrl,
      relatedType: 'SALE',
      relatedId: sale.id,
    });

    return {
      success: true,
      bill_no: sale.bill_no,
      filePath,
      fileName,
      mediaUrl: mediaSignedUrl,
      whatsapp: whatsAppResult,
    };
  }

  @Get(':id/bill/signed-url')
  @Roles('OWNER', 'STAFF')
  @ApiOperation({ summary: 'Generate signed, short-lived URL for bill JPG access' })
  async getSignedUrl(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    const sale = await this.salesService.findOne(id, user);
    const signedInfo = this.billRenderer.generateSignedUrl(sale.id, 30);
    return {
      sale_id: sale.id,
      bill_no: sale.bill_no,
      ...signedInfo,
    };
  }

  @Public()
  @Get('bill/media/:token')
  @ApiOperation({ summary: 'Stream bill JPG image using a verified, short-lived signed token' })
  async streamBillMedia(
    @Param('token') token: string,
    @Res() res: Response,
  ) {
    const verification = this.billRenderer.verifySignedUrlToken(token);
    if (!verification.valid || !verification.saleId) {
      throw new UnauthorizedException(verification.error || 'Invalid or expired media token');
    }

    const filePath = this.billRenderer.getBillFilePath(verification.saleId);
    if (!filePath || !fs.existsSync(filePath)) {
      throw new NotFoundException('Bill media file not found');
    }

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'private, max-age=1800');
    fs.createReadStream(filePath).pipe(res);
  }
}
