import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

export interface UpdateReminderSettingsDto {
  repeat_days?: number;
  send_time?: string;
  owner_whatsapp?: string;
  is_active?: boolean;
}

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly whatsAppService: WhatsAppService,
  ) {}

  async getSettings() {
    const res = await this.db.query(`SELECT * FROM reminder_settings WHERE id = 1`);
    if (res.rows.length === 0) {
      return { id: 1, repeat_days: 3, send_time: '10:00', owner_whatsapp: '+919690000000', is_active: true };
    }
    return res.rows[0];
  }

  async updateSettings(dto: UpdateReminderSettingsDto) {
    const updates: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (dto.repeat_days !== undefined) {
      updates.push(`repeat_days = $${idx++}`);
      params.push(dto.repeat_days);
    }
    if (dto.send_time !== undefined) {
      updates.push(`send_time = $${idx++}`);
      params.push(dto.send_time);
    }
    if (dto.owner_whatsapp !== undefined) {
      updates.push(`owner_whatsapp = $${idx++}`);
      params.push(dto.owner_whatsapp);
    }
    if (dto.is_active !== undefined) {
      updates.push(`is_active = $${idx++}`);
      params.push(dto.is_active);
    }

    if (updates.length > 0) {
      const query = `UPDATE reminder_settings SET ${updates.join(', ')} WHERE id = 1 RETURNING *`;
      const res = await this.db.query(query, params);
      return res.rows[0];
    }
    return this.getSettings();
  }

  async getStaffOverdueBills(staffId: string) {
    const query = `
      SELECT s.id, s.bill_no, s.entry_at, s.due_date, s.total_amount, s.status,
             p.name AS party_name, p.whatsapp_number,
             (CURRENT_DATE - s.due_date) AS days_overdue,
             (s.total_amount - COALESCE(
               (SELECT SUM(va.amount) FROM voucher_allocations va WHERE va.sale_id = s.id), 0
             )) AS outstanding_amount
      FROM sales s
      JOIN parties p ON p.id = s.party_id
      WHERE s.created_by = $1
        AND s.is_deleted = false
        AND s.status <> 'PAID'
        AND s.due_date < CURRENT_DATE
      ORDER BY s.due_date ASC
    `;
    const res = await this.db.query(query, [staffId]);
    return res.rows;
  }

  /**
   * Daily Overdue Engine
   * 1. Scans unpaid bills past due date
   * 2. Checks last reminder timestamp against repeat_days
   * 3. Sends customer WhatsApp notification per bill
   * 4. Sends ONE consolidated daily summary to the owner
   */
  async runDailyReminderJob(targetDate: Date = new Date()) {
    const settings = await this.getSettings();
    if (!settings.is_active) {
      this.logger.log('Payment reminders are disabled in settings.');
      return { skipped: true, reason: 'Reminders disabled' };
    }

    const repeatDays = settings.repeat_days || 3;
    const todayStr = targetDate.toISOString().split('T')[0];

    // Find all overdue sales
    const query = `
      SELECT s.id, s.bill_no, s.due_date, s.total_amount, s.party_id,
             p.name AS customer_name, p.whatsapp_number,
             (s.total_amount - COALESCE(
               (SELECT SUM(va.amount) FROM voucher_allocations va WHERE va.sale_id = s.id), 0
             )) AS outstanding_amount,
             (
               SELECT sent_at 
               FROM reminder_log 
               WHERE sale_id = s.id AND kind = 'CUSTOMER_BILL'
               ORDER BY sent_at DESC 
               LIMIT 1
             ) AS last_reminder_at
      FROM sales s
      JOIN parties p ON p.id = s.party_id
      WHERE s.is_deleted = false
        AND s.status <> 'PAID'
        AND s.due_date < $1
    `;

    const res = await this.db.query(query, [todayStr]);
    const overdueBills = res.rows;

    let customerMessagesSent = 0;
    const customerDuesMap: Record<string, { name: string; count: number; total: number }> = {};
    let grandTotalOverdue = 0;

    for (const bill of overdueBills) {
      const outstanding = parseFloat(bill.outstanding_amount);
      if (outstanding <= 0) continue;

      // Group for owner summary
      if (!customerDuesMap[bill.party_id]) {
        customerDuesMap[bill.party_id] = { name: bill.customer_name, count: 0, total: 0 };
      }
      customerDuesMap[bill.party_id].count++;
      customerDuesMap[bill.party_id].total += outstanding;
      grandTotalOverdue += outstanding;

      // Check repeat days
      let shouldSendCustomer = true;
      if (bill.last_reminder_at) {
        const lastSent = new Date(bill.last_reminder_at);
        const daysDiff = (targetDate.getTime() - lastSent.getTime()) / (1000 * 3600 * 24);
        if (daysDiff < repeatDays) {
          shouldSendCustomer = false;
        }
      }

      if (shouldSendCustomer) {
        if (!bill.whatsapp_number) {
          this.logger.warn(`Skipping customer reminder for bill #${bill.bill_no}: No WhatsApp number for ${bill.customer_name}`);
          continue;
        }

        await this.whatsAppService.send({
          to: bill.whatsapp_number,
          templateName: 'customer_payment_reminder',
          parameters: {
            customer_name: bill.customer_name,
            bill_no: bill.bill_no,
            amount: `₹${outstanding.toLocaleString('en-IN')}`,
            due_date: new Date(bill.due_date).toLocaleDateString('en-GB'),
          },
          relatedType: 'SALE',
          relatedId: bill.id,
        });

        await this.db.query(
          `INSERT INTO reminder_log (sale_id, party_id, kind, status) VALUES ($1, $2, 'CUSTOMER_BILL', 'SENT')`,
          [bill.id, bill.party_id],
        );
        customerMessagesSent++;
      }
    }

    // Send exactly ONE combined summary to the owner
    const customersCount = Object.keys(customerDuesMap).length;
    if (customersCount > 0 && settings.owner_whatsapp) {
      await this.whatsAppService.send({
        to: settings.owner_whatsapp,
        templateName: 'owner_dues_summary',
        parameters: {
          overdue_bills_count: overdueBills.length,
          grand_total: `₹${grandTotalOverdue.toLocaleString('en-IN')}`,
          customers_count: customersCount,
          date: new Date().toLocaleDateString('en-GB'),
        },
      });

      await this.db.query(
        `INSERT INTO reminder_log (kind, status) VALUES ('OWNER_SUMMARY', 'SENT')`,
      );
    }

    return {
      success: true,
      overdueBillsFound: overdueBills.length,
      customerMessagesSent,
      customersCount,
      grandTotalOverdue,
    };
  }
}
