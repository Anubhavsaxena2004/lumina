import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { VouchersService } from './vouchers/vouchers.service';
import { LedgerService } from './ledger/ledger.service';
import { StockService } from './stock/stock.service';
import { AuditService } from './audit/audit.service';
import { BankAccountsService } from './masters/bank-accounts.service';
import { DatabaseService } from './database/database.service';
import { DomainEventEmitter } from './common/events/domain-event.emitter';

describe('Vouchers, Ledger, Stock Register & Audit Gate Test Suite', () => {
  let mockDb: any;
  let mockClient: any;
  let mockEventEmitter: any;
  let vouchersService: VouchersService;
  let ledgerService: LedgerService;
  let stockService: StockService;
  let auditService: AuditService;
  let bankAccountsService: BankAccountsService;

  const staffUser = {
    id: 'staff-2222-2222-2222-222222222222',
    name: 'Amit Verma (Staff)',
    username: 'amit',
    role: 'STAFF' as const,
    isActive: true,
  };

  const ownerUser = {
    id: 'owner-1111-1111-1111-111111111111',
    name: 'Mihir Sharma (Owner)',
    username: 'mihir',
    role: 'OWNER' as const,
    isActive: true,
  };

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
    };

    mockDb = {
      query: jest.fn(),
      withTransaction: jest.fn(async (callback) => {
        return await callback(mockClient);
      }),
    };

    mockEventEmitter = {
      emitEntrySaved: jest.fn(),
    };

    vouchersService = new VouchersService(mockDb as DatabaseService, mockEventEmitter as DomainEventEmitter);
    ledgerService = new LedgerService(mockDb as DatabaseService);
    stockService = new StockService(mockDb as DatabaseService);
    auditService = new AuditService(mockDb as DatabaseService);
    bankAccountsService = new BankAccountsService(mockDb as DatabaseService);
  });

  describe('1. Money Vouchers Validation & Allocation Rules', () => {
    it('Requires a bank account when payment mode is BANK', async () => {
      const dto: any = {
        kind: 'RECEIPT',
        party_id: 'cust-1',
        mode: 'BANK',
        amount: 5000,
      };

      await expect(vouchersService.create(dto, staffUser)).rejects.toThrow(BadRequestException);
    });

    it('Rejects bank account when payment mode is CASH', async () => {
      const dto: any = {
        kind: 'RECEIPT',
        party_id: 'cust-1',
        mode: 'CASH',
        bank_account_id: 'bank-1',
        amount: 5000,
      };

      await expect(vouchersService.create(dto, staffUser)).rejects.toThrow(BadRequestException);
    });

    it('Rejects over-allocation exceeding the bill outstanding amount', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: 'cust-1', name: 'Cust A', is_active: true }] }); // party check

      // Sale has total ₹10,000, already allocated ₹8,000, remaining ₹2,000
      mockClient.query
        .mockResolvedValueOnce({
          rows: [{ id: 'voucher-1', party_id: 'cust-1', amount: 5000 }],
        }) // voucher insert
        .mockResolvedValueOnce({ rows: [] }) // ledger insert
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'sale-1',
              bill_no: 1001,
              party_id: 'cust-1',
              total_amount: 10000,
              already_allocated: 8000,
            },
          ],
        }); // sale query

      const dto: any = {
        kind: 'RECEIPT',
        party_id: 'cust-1',
        mode: 'CASH',
        amount: 5000,
        allocations: [{ sale_id: 'sale-1', amount: 3000 }], // 3000 > 2000 remaining!
      };

      await expect(vouchersService.create(dto, staffUser)).rejects.toThrow(
        /exceeds sale #1001 outstanding/,
      );
    });

    it('Rejects allocation to a bill that belongs to a different party', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: 'cust-1', name: 'Cust A', is_active: true }] }); // party check

      mockClient.query
        .mockResolvedValueOnce({
          rows: [{ id: 'voucher-1', party_id: 'cust-1', amount: 5000 }],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'sale-different-party',
              bill_no: 1002,
              party_id: 'cust-2', // Different party!
              total_amount: 10000,
              already_allocated: 0,
            },
          ],
        });

      const dto: any = {
        kind: 'RECEIPT',
        party_id: 'cust-1',
        mode: 'CASH',
        amount: 5000,
        allocations: [{ sale_id: 'sale-different-party', amount: 5000 }],
      };

      await expect(vouchersService.create(dto, staffUser)).rejects.toThrow(
        /does not belong to the voucher party/,
      );
    });
  });

  describe('2. Sale Followed by Full Receipt & Partial Receipt', () => {
    it('Sale followed by full receipt updates status to PAID and credits customer ledger', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: 'cust-1', name: 'Cust A', is_active: true }] });

      mockClient.query
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'voucher-full',
              party_id: 'cust-1',
              amount: 10000,
              kind: 'RECEIPT',
              mode: 'CASH',
              entry_at: '2026-10-01T10:00:00Z',
            },
          ],
        }) // voucher insert
        .mockResolvedValueOnce({ rows: [] }) // ledger insert (credit ₹10000)
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'sale-101',
              bill_no: 101,
              party_id: 'cust-1',
              total_amount: 10000,
              already_allocated: 0,
            },
          ],
        }) // sale fetch
        .mockResolvedValueOnce({ rows: [] }) // voucher allocation insert
        .mockResolvedValueOnce({ rows: [] }); // update sale status

      const dto: any = {
        kind: 'RECEIPT',
        party_id: 'cust-1',
        mode: 'CASH',
        amount: 10000,
        allocations: [{ sale_id: 'sale-101', amount: 10000 }],
      };

      const result = await vouchersService.create(dto, staffUser);
      expect(result.id).toBe('voucher-full');

      // Verify ledger credit entry
      const ledgerCall = mockClient.query.mock.calls[1];
      expect(ledgerCall[0]).toContain('INSERT INTO ledger_entries');
      expect(ledgerCall[1]).toEqual(['cust-1', 'voucher-full', 0, 10000]); // debit 0, credit 10000

      // Verify sale status updated to PAID
      const statusUpdateCall = mockClient.query.mock.calls.find(
        (c: any[]) => typeof c[0] === 'string' && c[0].includes('UPDATE sales SET status = $1'),
      );
      expect(statusUpdateCall).toBeDefined();
      expect(statusUpdateCall[1]).toEqual(['PAID', 'sale-101']);
    });

    it('Sale followed by partial receipt updates status to PARTIAL', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: 'cust-1', name: 'Cust A', is_active: true }] });

      mockClient.query
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'voucher-partial',
              party_id: 'cust-1',
              amount: 4000,
              kind: 'RECEIPT',
              mode: 'CASH',
              entry_at: '2026-10-01T10:00:00Z',
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'sale-101',
              bill_no: 101,
              party_id: 'cust-1',
              total_amount: 10000,
              already_allocated: 0,
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const dto: any = {
        kind: 'RECEIPT',
        party_id: 'cust-1',
        mode: 'CASH',
        amount: 4000,
        allocations: [{ sale_id: 'sale-101', amount: 4000 }],
      };

      await vouchersService.create(dto, staffUser);

      // Verify sale status updated to PARTIAL
      const statusUpdateCall = mockClient.query.mock.calls.find(
        (c: any[]) => typeof c[0] === 'string' && c[0].includes('UPDATE sales SET status = $1'),
      );
      expect(statusUpdateCall).toBeDefined();
      expect(statusUpdateCall[1]).toEqual(['PARTIAL', 'sale-101']);
    });
  });

  describe('3. Bank Receipt & Bank Balance Movement', () => {
    it('Bank receipt updates party ledger and moves bank account balance', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: 'bank-hdfc', name: 'HDFC Bank', is_active: true }] })
        .mockResolvedValueOnce({ rows: [{ id: 'cust-1', name: 'Cust A', is_active: true }] });

      mockClient.query
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'voucher-bank',
              party_id: 'cust-1',
              mode: 'BANK',
              bank_account_id: 'bank-hdfc',
              amount: 25000,
              kind: 'RECEIPT',
              entry_at: '2026-10-01T12:00:00Z',
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] }); // ledger insert

      const dto: any = {
        kind: 'RECEIPT',
        party_id: 'cust-1',
        mode: 'BANK',
        bank_account_id: 'bank-hdfc',
        amount: 25000,
      };

      const voucher = await vouchersService.create(dto, staffUser);
      expect(voucher.mode).toBe('BANK');

      // Verify party ledger credited
      expect(mockClient.query.mock.calls[1][1]).toEqual(['cust-1', 'voucher-bank', 0, 25000]);

      // Verify BankAccountsService reflects computed current balance
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'bank-hdfc',
            name: 'HDFC Bank',
            opening_balance: 100000,
            current_balance: 125000, // 100,000 + 25,000 receipt
          },
        ],
      });

      const bank = await bankAccountsService.findOne('bank-hdfc');
      expect(bank.current_balance).toBe(125000);
    });
  });

  describe('4. Owner Deleting & Editing Vouchers with Reversing Rows', () => {
    it('Staff is forbidden from deleting or editing a voucher', async () => {
      await expect(vouchersService.softDelete('voucher-1', staffUser)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(vouchersService.update('voucher-1', {}, staffUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('Deleting a voucher inserts reversing ledger row and restores bill to OPEN status', async () => {
      mockClient.query
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'voucher-to-delete',
              party_id: 'cust-1',
              amount: 10000,
              kind: 'RECEIPT',
              is_deleted: false,
            },
          ],
        }) // fetch voucher
        .mockResolvedValueOnce({ rows: [] }) // insert VOUCHER_REVERSAL
        .mockResolvedValueOnce({ rows: [{ sale_id: 'sale-101', purchase_id: null }] }) // fetch allocations
        .mockResolvedValueOnce({ rows: [] }) // delete allocations
        .mockResolvedValueOnce({ rows: [{ total_amount: 10000, allocated: 0 }] }) // recompute: 0 allocated now!
        .mockResolvedValueOnce({ rows: [] }) // update sale status to OPEN
        .mockResolvedValueOnce({ rows: [] }) // mark voucher is_deleted = true
        .mockResolvedValueOnce({ rows: [] }); // insert audit_log

      const res = await vouchersService.softDelete('voucher-to-delete', ownerUser);
      expect(res.success).toBe(true);

      // Verify reversing row inserted: for RECEIPT of 10000, reversal has debit 10000, credit 0
      const reversalCall = mockClient.query.mock.calls[1];
      expect(reversalCall[0]).toContain('INSERT INTO ledger_entries');
      expect(reversalCall[1]).toEqual(['cust-1', 'voucher-to-delete', 10000, 0]);

      // Verify sale status restored to OPEN
      const restoreCall = mockClient.query.mock.calls.find(
        (c: any[]) => typeof c[0] === 'string' && c[0].includes('UPDATE sales SET status = $1'),
      );
      expect(restoreCall).toBeDefined();
      expect(restoreCall[1]).toEqual(['OPEN', 'sale-101']);
    });
  });

  describe('5. Staff Isolation in Ledger Views', () => {
    it('Staff gets only own created bills status and no company-wide balance', async () => {
      mockDb.query
        .mockResolvedValueOnce({
          rows: [{ id: 'cust-1', name: 'Rajasthan Jewellers', type: 'CUSTOMER', opening_balance: 50000 }],
        }) // party fetch
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'sale-staff-1',
              bill_type: 'SALE',
              bill_no: 1001,
              total_amount: 15000,
              status: 'OPEN',
              paid_amount: 0,
              is_overdue: false,
            },
          ],
        }) // staff sales
        .mockResolvedValueOnce({ rows: [] }); // staff purchases

      const statement = await ledgerService.getPartyStatement('cust-1', staffUser);
      expect(statement.restricted).toBe(true);
      expect((statement as any).opening_balance).toBeUndefined();
      expect((statement as any).closing_balance).toBeUndefined();
      expect(statement.bills).toHaveLength(1);
      expect(statement.bills[0].bill_no).toBe(1001);
    });
  });

  describe('6. Hand-Calculated Sample Dataset Verification', () => {
    /**
     * Hand-calculated scenario:
     * Party: Shree Balaji Ornaments (CUSTOMER)
     * Opening Balance: ₹50,000.00
     * Entries:
     * 1. Sale #101: Debit ₹35,000.00, Credit ₹0.00 -> Balance ₹85,000.00
     * 2. Cash Receipt #201: Debit ₹0.00, Credit ₹20,000.00 -> Balance ₹65,000.00
     * 3. Bank Receipt #202: Debit ₹0.00, Credit ₹15,000.00 -> Balance ₹50,000.00 (Sale #101 fully paid)
     * 4. Sale #102: Debit ₹42,500.00, Credit ₹0.00 -> Balance ₹92,500.00
     * 5. Polish Job Work Charge: Debit ₹0.00, Credit ₹2,500.00 -> Balance ₹90,000.00
     * 6. Payment #203: Debit ₹2,500.00, Credit ₹0.00 -> Balance ₹92,500.00
     * 7. Bank Receipt #204: Debit ₹0.00, Credit ₹12,500.00 -> Balance ₹80,000.00
     *
     * Expected Exact Totals:
     * Opening Balance: 50,000.00
     * Total Debit: 35,000 + 42,500 + 2,500 = 80,000.00
     * Total Credit: 20,000 + 15,000 + 2,500 + 12,500 = 50,000.00
     * Closing Balance: 50,000.00 + (80,000.00 - 50,000.00) = 80,000.00
     */
    it('Matches exact hand-calculated ledger totals and running balances', async () => {
      mockDb.query
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'party-balaji',
              name: 'Shree Balaji Ornaments',
              type: 'CUSTOMER',
              opening_balance: '50000.00',
              whatsapp_number: '+919829012345',
            },
          ],
        }) // party query
        .mockResolvedValueOnce({
          rows: [
            { id: 1, entry_at: '2026-10-02T10:00:00Z', source_type: 'SALE', source_id: 's-1', debit: '35000.00', credit: '0.00' },
            { id: 2, entry_at: '2026-10-03T11:00:00Z', source_type: 'VOUCHER', source_id: 'v-1', debit: '0.00', credit: '20000.00' },
            { id: 3, entry_at: '2026-10-04T12:00:00Z', source_type: 'VOUCHER', source_id: 'v-2', debit: '0.00', credit: '15000.00' },
            { id: 4, entry_at: '2026-10-05T10:30:00Z', source_type: 'SALE', source_id: 's-2', debit: '42500.00', credit: '0.00' },
            { id: 5, entry_at: '2026-10-06T14:00:00Z', source_type: 'JOB_WORK_CHARGE', source_id: 'jw-1', debit: '0.00', credit: '2500.00' },
            { id: 6, entry_at: '2026-10-07T15:00:00Z', source_type: 'VOUCHER', source_id: 'v-3', debit: '2500.00', credit: '0.00' },
            { id: 7, entry_at: '2026-10-08T16:00:00Z', source_type: 'VOUCHER', source_id: 'v-4', debit: '0.00', credit: '12500.00' },
          ],
        }); // ledger entries query

      const statement = await ledgerService.getPartyStatement('party-balaji', ownerUser);

      expect(statement.restricted).toBe(false);
      expect(statement.opening_balance).toBe(50000.00);
      expect(statement.total_debit).toBe(80000.00);
      expect(statement.total_credit).toBe(50000.00);
      expect(statement.closing_balance).toBe(80000.00);

      // Verify running balance at each row step
      const expectedRunningBalances = [85000.00, 65000.00, 50000.00, 92500.00, 90000.00, 92500.00, 80000.00];
      const actualRunningBalances = statement.rows.map((r: any) => r.running_balance);
      expect(actualRunningBalances).toEqual(expectedRunningBalances);
    });
  });

  describe('7. Stock Register & Movement History', () => {
    it('Calculates stock register balances and retrieves item movement history', async () => {
      mockDb.query
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'item-silver-payal',
              name: 'Silver Payal 92.5',
              category: 'Silver Ornaments',
              current_pieces: 30,
              current_kg: 6.250,
              last_movement_at: '2026-10-05T12:00:00Z',
            },
          ],
        });

      const register = await stockService.getStockRegister();
      expect(register.summary.total_items).toBe(1);
      expect(register.summary.total_pieces).toBe(30);
      expect(register.summary.total_kg).toBe(6.25);
      expect(register.items[0].name).toBe('Silver Payal 92.5');

      // Test item movement history
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: 'item-silver-payal', name: 'Silver Payal 92.5' }] })
        .mockResolvedValueOnce({
          rows: [
            { id: 1, source_type: 'PURCHASE_IN', pieces_delta: 50, kg_delta: 10.5 },
            { id: 2, source_type: 'SALE_OUT', pieces_delta: -20, kg_delta: -4.25 },
          ],
        })
        .mockResolvedValueOnce({ rows: [{ total_pieces: 30, total_kg: 6.25 }] });

      const itemHistory = await stockService.getItemMovements('item-silver-payal');
      expect(itemHistory.current_balance.pieces).toBe(30);
      expect(itemHistory.current_balance.kg).toBe(6.25);
      expect(itemHistory.movements).toHaveLength(2);
    });
  });

  describe('8. Audit Log Multi-Filter API Gate', () => {
    it('Filters audit logs by actor, table name, and record ID', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ total: 1 }] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 1,
              actor_id: ownerUser.id,
              actor_name: ownerUser.name,
              table_name: 'money_vouchers',
              record_id: 'voucher-1',
              action: 'UPDATE',
            },
          ],
        });

      const result = await auditService.findAll(ownerUser.id, 'money_vouchers', 'voucher-1');
      expect(result.total).toBe(1);
      expect(result.logs[0].table_name).toBe('money_vouchers');
      expect(result.logs[0].action).toBe('UPDATE');
    });
  });
});
