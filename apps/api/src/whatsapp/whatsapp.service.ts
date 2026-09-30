import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  IWhatsAppProvider,
  MockWhatsAppProvider,
  CloudApiWhatsAppProvider,
  SendMessageOptions,
} from './whatsapp.provider';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private provider: IWhatsAppProvider;

  constructor(private readonly db: DatabaseService) {
    if (process.env.WHATSAPP_PROVIDER === 'cloud') {
      this.provider = new CloudApiWhatsAppProvider(this.db);
    } else {
      this.provider = new MockWhatsAppProvider(this.db);
    }
  }

  async send(options: SendMessageOptions) {
    try {
      return await this.provider.sendMessage(options);
    } catch (err) {
      this.logger.error(`Error sending WhatsApp notification: ${err.message}`);
      // Never throw; a failed notification must never roll back business transactions
      return { providerMsgId: '', status: 'FAILED' };
    }
  }

  async notifyOwnerOnEntry(entryData: {
    type: string;
    partyName: string;
    amountOrKg: string;
    staffName: string;
  }) {
    // Look up owner WhatsApp number from reminder_settings
    const settings = await this.db.query(
      `SELECT owner_whatsapp FROM reminder_settings WHERE id = 1`,
    );
    const ownerPhone = settings.rows[0]?.owner_whatsapp || '+919690000000';

    return this.send({
      to: ownerPhone,
      templateName: 'owner_entry_alert',
      parameters: {
        entry_type: entryData.type,
        party_name: entryData.partyName,
        value: entryData.amountOrKg,
        staff_name: entryData.staffName,
        timestamp: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
      },
    });
  }

  async handleWebhookStatus(providerMsgId: string, status: string) {
    await this.db.query(
      `UPDATE whatsapp_messages 
       SET status = $1 
       WHERE provider_msg_id = $2`,
      [status.toUpperCase(), providerMsgId],
    );
  }
}
