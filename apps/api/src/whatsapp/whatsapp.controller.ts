import { Controller, Get, Post, Body, Query, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { WhatsAppService } from './whatsapp.service';
import { Public } from '../common/decorators';

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly whatsAppService: WhatsAppService) {}

  @Public()
  @Get('webhook')
  @ApiOperation({ summary: 'Meta WhatsApp webhook verification challenge' })
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'kumkum-verify-token';
    if (mode === 'subscribe' && token === verifyToken) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Meta WhatsApp delivery receipt webhook receiver' })
  async handleWebhook(@Body() body: any) {
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const statusObj = changes?.value?.statuses?.[0];

    if (statusObj) {
      const msgId = statusObj.id;
      const status = statusObj.status; // sent, delivered, read, failed
      await this.whatsAppService.handleWebhookStatus(msgId, status);
    }

    return { status: 'EVENT_RECEIVED' };
  }
}
