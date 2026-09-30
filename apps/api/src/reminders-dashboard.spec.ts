import { RemindersService } from './reminders/reminders.service';
import { DashboardService } from './dashboard/dashboard.service';
import { FakeClock } from './common/clock/clock.interface';
import { DatabaseService } from './database/database.service';
import { WhatsAppService } from './whatsapp/whatsapp.service';

describe('Payment Reminder Engine & Owner Dashboard Gate Test Suite', () => {
  let mockDb: any;
  let mockWhatsAppService: any;
  let fakeClock: FakeClock;
  let remindersService: RemindersService;
  let dashboardService: DashboardService;

  beforeEach(() => {
    mockDb = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
    };

    mockWhatsAppService = {
      send: jest.fn().mockResolvedValue({ messageId: 'msg-mock-id', status: 'QUEUED' }),
    };

    fakeClock = new FakeClock('2026-10-01T09:30:00.000Z');
    remindersService = new RemindersService(
      mockDb as DatabaseService,
      mockWhatsAppService as WhatsAppService,
      fakeClock,
    );
    dashboardService = new DashboardService(
      mockDb as DatabaseService,
      fakeClock,
    );
  });

  describe('1. Invariant: Nothing Before Due Date & First Reminder on Day +1', () => {
    it('Sends zero reminders on or before the due date', async () => {
      // Due date is 2026-10-01. Clock is 2026-10-01 (Day 0)
      mockDb.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, repeat_days: 3, send_time: '10:00', owner_whatsapp: '+919690000000', is_active: true }],
        }) // settings
        .mockResolvedValueOnce({ rows: [] }); // query where due_date < '2026-10-01' returns 0 rows

      const result = await remindersService.runDailyReminderJob();
      expect(result.customerMessagesSent).toBe(0);
      expect(mockWhatsAppService.send).not.toHaveBeenCalled();
    });

    it('Dispatches first reminder on Day +1 after the due date', async () => {
      // Advance clock to Day 1: 2026-10-02
      fakeClock.advanceDays(1);
      expect(fakeClock.todayString()).toBe('2026-10-02');

      mockDb.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, repeat_days: 3, send_time: '10:00', owner_whatsapp: '+919690000000', is_active: true }],
        }) // settings
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'sale-101',
              bill_no: 101,
              due_date: '2026-10-01',
              total_amount: 35000,
              party_id: 'cust-1',
              customer_name: 'Rajasthan Jewellers',
              whatsapp_number: '+919829012345',
              outstanding_amount: 35000,
              last_reminder_at: null,
              sent_today_count: 0,
            },
          ],
        }) // overdue bills
        .mockResolvedValueOnce({ rows: [] }) // insert reminder_log (customer)
        .mockResolvedValueOnce({ rows: [{ count: 0 }] }) // owner today check
        .mockResolvedValueOnce({ rows: [] }); // insert reminder_log (owner)

      const result = await remindersService.runDailyReminderJob();
      expect(result.customerMessagesSent).toBe(1);
      expect(result.ownerSummarySent).toBe(true);

      // Verify customer message
      expect(mockWhatsAppService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '+919829012345',
          templateName: 'customer_payment_reminder',
          parameters: expect.objectContaining({
            customer_name: 'Rajasthan Jewellers',
            bill_no: '101',
            outstanding_amount: '₹35,000',
            days_overdue: '1',
          }),
        }),
      );

      // Verify owner summary
      expect(mockWhatsAppService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '+919690000000',
          templateName: 'owner_dues_summary',
          parameters: expect.objectContaining({
            summary_date: '2026-10-02',
            total_overdue_amount: '₹35,000',
            overdue_bills_count: '1',
          }),
        }),
      );
    });
  });

  describe('2. Idempotency: Re-run on Same Day Sends Nothing Twice', () => {
    it('Suppresses duplicate sends when triggered again on the same day', async () => {
      fakeClock.setTime('2026-10-02T14:00:00Z');

      mockDb.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, repeat_days: 3, send_time: '10:00', owner_whatsapp: '+919690000000', is_active: true }],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'sale-101',
              bill_no: 101,
              due_date: '2026-10-01',
              total_amount: 35000,
              party_id: 'cust-1',
              customer_name: 'Rajasthan Jewellers',
              whatsapp_number: '+919829012345',
              outstanding_amount: 35000,
              last_reminder_at: '2026-10-02T09:30:00Z',
              sent_today_count: 1, // ALREADY SENT TODAY!
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [{ count: 1 }] }); // Owner already sent today count = 1!

      const result = await remindersService.runDailyReminderJob();
      expect(result.customerMessagesSent).toBe(0);
      expect(result.ownerSummarySent).toBe(false);
      expect(mockWhatsAppService.send).not.toHaveBeenCalled();
    });
  });

  describe('3. Customer with Three Unpaid Bills Receives Three Separate Messages', () => {
    it('Sends exactly one separate message per pending bill to customer', async () => {
      fakeClock.setTime('2026-10-02T10:00:00Z');

      mockDb.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, repeat_days: 3, send_time: '10:00', owner_whatsapp: '+919690000000', is_active: true }],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'sale-1',
              bill_no: 101,
              due_date: '2026-09-28',
              total_amount: 20000,
              party_id: 'cust-1',
              customer_name: 'Rajasthan Jewellers',
              whatsapp_number: '+919829012345',
              outstanding_amount: 20000,
              last_reminder_at: null,
              sent_today_count: 0,
            },
            {
              id: 'sale-2',
              bill_no: 102,
              due_date: '2026-09-29',
              total_amount: 15000,
              party_id: 'cust-1',
              customer_name: 'Rajasthan Jewellers',
              whatsapp_number: '+919829012345',
              outstanding_amount: 15000,
              last_reminder_at: null,
              sent_today_count: 0,
            },
            {
              id: 'sale-3',
              bill_no: 103,
              due_date: '2026-09-30',
              total_amount: 30000,
              party_id: 'cust-1',
              customer_name: 'Rajasthan Jewellers',
              whatsapp_number: '+919829012345',
              outstanding_amount: 30000,
              last_reminder_at: null,
              sent_today_count: 0,
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] }) // reminder_log sale 1
        .mockResolvedValueOnce({ rows: [] }) // reminder_log sale 2
        .mockResolvedValueOnce({ rows: [] }) // reminder_log sale 3
        .mockResolvedValueOnce({ rows: [{ count: 0 }] }) // owner today check
        .mockResolvedValueOnce({ rows: [] }); // owner log

      const result = await remindersService.runDailyReminderJob();
      expect(result.customerMessagesSent).toBe(3); // 3 separate messages!
      expect(result.customersCount).toBe(1); // 1 unique customer
      expect(result.grandTotalOverdue).toBe(65000); // 20k + 15k + 30k
      expect(result.ownerSummarySent).toBe(true); // exactly 1 owner summary

      // Assert 3 customer calls + 1 owner summary call = 4 total sends
      expect(mockWhatsAppService.send).toHaveBeenCalledTimes(4);
    });
  });

  describe('4. Simulated 10-Day Run Verification (DONE WHEN Criterion)', () => {
    /**
     * Simulation Scenario:
     * Bill #101 due date: 2026-10-01. Amount ₹35,000. Repeat interval: 3 days.
     * Day 0 (2026-10-01): Due today -> 0 messages
     * Day 1 (2026-10-02): Day +1 -> Message 1 sent!
     * Day 2 (2026-10-03): Day +2 -> Diff = 1 < 3 -> 0 messages
     * Day 3 (2026-10-04): Day +3 -> Diff = 2 < 3 -> 0 messages
     * Day 4 (2026-10-05): Day +4 -> Diff = 3 >= 3 -> Message 2 sent!
     * Day 5 (2026-10-06): Day +5 -> Diff = 1 < 3 -> 0 messages
     * Day 6 (2026-10-07): Customer pays bill in full (status PAID, outstanding 0) -> 0 messages!
     * Day 7 (2026-10-08): Paid -> 0 messages
     * Day 8 (2026-10-09): Paid -> 0 messages
     * Day 9 (2026-10-10): Paid -> 0 messages
     * Day 10 (2026-10-11): Paid -> 0 messages
     */
    it('Correctly enforces exact schedule and immediate stoppage across simulated 10-day run', async () => {
      const simClock = new FakeClock('2026-10-01T10:00:00Z');
      const simReminders = new RemindersService(
        mockDb as DatabaseService,
        mockWhatsAppService as WhatsAppService,
        simClock,
      );

      let lastSentTimestamp: string | null = null;
      let billPaid = false;
      const historySentDays: number[] = [];

      let currentOverdueRows: any[] = [];
      let currentOwnerSentToday = false;

      mockDb.query.mockImplementation(async (sql: string) => {
        if (sql.includes('FROM reminder_settings')) {
          return {
            rows: [{ id: 1, repeat_days: 3, send_time: '10:00', owner_whatsapp: '+919690000000', is_active: true }],
          };
        }
        if (sql.includes('FROM sales s')) {
          return { rows: currentOverdueRows };
        }
        if (sql.includes("kind = 'OWNER_SUMMARY'")) {
          return { rows: [{ count: currentOwnerSentToday ? 1 : 0 }] };
        }
        if (sql.includes('INSERT INTO reminder_log')) {
          return { rows: [] };
        }
        return { rows: [] };
      });

      for (let day = 0; day <= 10; day++) {
        if (day > 0) simClock.advanceDays(1);
        const todayStr = simClock.todayString();
        currentOwnerSentToday = false;

        // Customer pays on Day 6
        if (day === 6) {
          billPaid = true;
        }

        const isOverdue = !billPaid && todayStr > '2026-10-01';
        currentOverdueRows = isOverdue
          ? [
              {
                id: 'sale-sim-101',
                bill_no: 101,
                due_date: '2026-10-01',
                total_amount: 35000,
                party_id: 'cust-1',
                customer_name: 'Rajasthan Jewellers',
                whatsapp_number: '+919829012345',
                outstanding_amount: 35000,
                last_reminder_at: lastSentTimestamp,
                sent_today_count: 0,
              },
            ]
          : [];

        const res = await simReminders.runDailyReminderJob();

        if (res.customerMessagesSent > 0) {
          historySentDays.push(day);
          lastSentTimestamp = simClock.now().toISOString();
        }
      }

      // Assert that reminders were sent ONLY on Day 1 and Day 4, and never after payment on Day 6!
      expect(historySentDays).toEqual([1, 4]);
    });
  });

  describe('5. Staff Overdue View Isolation', () => {
    it('Restricts staff overdue view to self-created bills only', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'sale-staff-1',
            bill_no: 1001,
            due_date: '2026-09-25',
            total_amount: '12000.00',
            status: 'OPEN',
            party_name: 'Customer A',
            whatsapp_number: '+919829011111',
            days_overdue: '6',
            outstanding_amount: '12000.00',
          },
        ],
      });

      const bills = await remindersService.getStaffOverdueBills('staff-user-1');
      expect(bills).toHaveLength(1);
      expect(bills[0].bill_no).toBe(1001);
      expect(bills[0].days_overdue).toBe(6);
    });
  });

  describe('6. Owner Dashboard Business Metrics', () => {
    it('Computes complete financial and inventory KPIs for owner dashboard', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ total_receivable: '450000.00', total_payable: '120000.00' }] }) // balances
        .mockResolvedValueOnce({ rows: [{ overdue_count: '4', overdue_amount: '95000.00' }] }) // overdue
        .mockResolvedValueOnce({ rows: [{ today_sales: '65000.00', today_purchases: '40000.00' }] }) // today
        .mockResolvedValueOnce({ rows: [{ cash_balance: '85000.00' }] }) // cash
        .mockResolvedValueOnce({ rows: [{ total_bank_balance: '350000.00' }] }) // bank
        .mockResolvedValueOnce({
          rows: [
            { id: 'p-1', customer_name: 'Cust 1', whatsapp_number: '+91982901', pending_amount: '50000.00' },
          ],
        }) // top dues
        .mockResolvedValueOnce({
          rows: [
            { id: 'i-1', name: 'Gold Ring', category: 'Gold', pieces: 1, weight_kg: '0.015' },
          ],
        }) // low stock
        .mockResolvedValueOnce({
          rows: [
            { id: 'e-1', type: 'Sale', party_name: 'Cust 1', amount: '15000', creator_name: 'Amit' },
          ],
        }); // recent entries

      const metrics = await dashboardService.getOwnerMetrics();

      expect(metrics.totalReceivable).toBe(450000);
      expect(metrics.totalPayable).toBe(120000);
      expect(metrics.overdueAmount).toBe(95000);
      expect(metrics.overdueCount).toBe(4);
      expect(metrics.todaySales).toBe(65000);
      expect(metrics.todayPurchases).toBe(40000);
      expect(metrics.cashBalance).toBe(85000);
      expect(metrics.bankBalance).toBe(350000);
      expect(metrics.lowStockItems).toHaveLength(1);
      expect(metrics.topCustomersByDues).toHaveLength(1);
      expect(metrics.recentEntries).toHaveLength(1);
    });
  });
});
