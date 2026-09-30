import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface SendMessageOptions {
  to: string;
  templateName: string;
  parameters: Record<string, any>;
  mediaUrl?: string;
  caption?: string;
  relatedType?: string;
  relatedId?: string;
}

export interface IWhatsAppProvider {
  sendMessage(options: SendMessageOptions): Promise<{ providerMsgId: string; status: string }>;
  sendMediaMessage?(
    to: string,
    mediaUrl: string,
    caption?: string,
    relatedType?: string,
    relatedId?: string,
  ): Promise<{ providerMsgId: string; status: string }>;
  healthCheck?(): Promise<boolean>;
}

@Injectable()
export class MockWhatsAppProvider implements IWhatsAppProvider {
  private readonly logger = new Logger(MockWhatsAppProvider.name);

  constructor(private readonly db: DatabaseService) {}

  async sendMessage(options: SendMessageOptions) {
    this.logger.log(
      `[MOCK WHATSAPP] Sending to ${options.to} using template '${options.templateName}'`,
    );
    this.logger.log(`[MOCK WHATSAPP] Payload: ${JSON.stringify(options.parameters)}`);
    if (options.mediaUrl) {
      this.logger.log(`[MOCK WHATSAPP] Media: ${options.mediaUrl}`);
    }

    const mockId = `mock_msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Persist or update record in whatsapp_messages
    await this.db.query(
      `INSERT INTO whatsapp_messages (kind, to_number, template_name, payload, related_type, related_id, status, provider_msg_id, attempts)
       VALUES ($1, $2, $3, $4, $5, $6, 'DELIVERED', $7, 1)`,
      [
        options.templateName,
        options.to,
        options.templateName,
        JSON.stringify(options.parameters),
        options.relatedType || null,
        options.relatedId || null,
        mockId,
      ],
    );

    return { providerMsgId: mockId, status: 'DELIVERED' };
  }

  async sendMediaMessage(
    to: string,
    mediaUrl: string,
    caption?: string,
    relatedType?: string,
    relatedId?: string,
  ) {
    return this.sendMessage({
      to,
      templateName: 'bill_delivery',
      parameters: { caption: caption || '' },
      mediaUrl,
      caption,
      relatedType,
      relatedId,
    });
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}

@Injectable()
export class CloudApiWhatsAppProvider implements IWhatsAppProvider {
  private readonly logger = new Logger(CloudApiWhatsAppProvider.name);

  constructor(private readonly db: DatabaseService) {}

  async sendMessage(options: SendMessageOptions) {
    const token = process.env.WHATSAPP_API_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneId) {
      this.logger.warn(
        'WhatsApp API credentials not configured; falling back to Mock behavior',
      );
      const mockProvider = new MockWhatsAppProvider(this.db);
      return mockProvider.sendMessage(options);
    }

    const url = `https://graph.facebook.com/v21.0/${phoneId}/messages`;

    // Construct Meta WhatsApp template body
    const body: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: options.to.replace(/\+/g, '').trim(),
      type: 'template',
      template: {
        name: options.templateName,
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: Object.entries(options.parameters).map(([key, val]) => ({
              type: 'text',
              text: String(val),
            })),
          },
        ],
      },
    };

    if (options.mediaUrl) {
      body.template.components.unshift({
        type: 'header',
        parameters: [
          {
            type: 'image',
            image: { link: options.mediaUrl },
          },
        ],
      });
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data?.error?.message || `WhatsApp API error HTTP ${response.status}`,
        );
      }

      const msgId = data?.messages?.[0]?.id || `wamid_${Date.now()}`;

      await this.db.query(
        `INSERT INTO whatsapp_messages (kind, to_number, template_name, payload, related_type, related_id, status, provider_msg_id, attempts)
         VALUES ($1, $2, $3, $4, $5, $6, 'SENT', $7, 1)`,
        [
          options.templateName,
          options.to,
          options.templateName,
          JSON.stringify(options.parameters),
          options.relatedType || null,
          options.relatedId || null,
          msgId,
        ],
      );

      return { providerMsgId: msgId, status: 'SENT' };
    } catch (err: any) {
      this.logger.error(
        `Failed to send WhatsApp message via Cloud API to ${options.to}: ${err.message}`,
      );
      await this.db.query(
        `INSERT INTO whatsapp_messages (kind, to_number, template_name, payload, related_type, related_id, status, attempts)
         VALUES ($1, $2, $3, $4, $5, $6, 'FAILED', 1)`,
        [
          options.templateName,
          options.to,
          options.templateName,
          JSON.stringify(options.parameters),
          options.relatedType || null,
          options.relatedId || null,
        ],
      );
      throw err;
    }
  }

  async sendMediaMessage(
    to: string,
    mediaUrl: string,
    caption?: string,
    relatedType?: string,
    relatedId?: string,
  ) {
    return this.sendMessage({
      to,
      templateName: 'bill_delivery',
      parameters: { caption: caption || '' },
      mediaUrl,
      caption,
      relatedType,
      relatedId,
    });
  }

  async healthCheck(): Promise<boolean> {
    return Boolean(process.env.WHATSAPP_API_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
  }
}
