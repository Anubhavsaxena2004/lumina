import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AuthUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class LedgerService {
  constructor(private readonly db: DatabaseService) {}

  async getPartyStatement(
    partyId: string,
    user: AuthUser,
    startDate?: string,
    endDate?: string,
  ) {
    // 1. Fetch party info
    const partyRes = await this.db.query(`SELECT * FROM parties WHERE id = $1`, [partyId]);
    if (partyRes.rows.length === 0) {
      throw new NotFoundException('Party not found');
    }
    const party = partyRes.rows[0];

    // Staff isolation check: Staff only see bill status of bills they created, no company-wide balance
    if (user.role === 'STAFF') {
      const salesBills = await this.db.query(
        `SELECT s.id, 'SALE' AS bill_type, s.bill_no, s.entry_at, s.due_date, s.total_amount, s.status,
          COALESCE((SELECT SUM(va.amount) FROM voucher_allocations va WHERE va.sale_id = s.id), 0) AS paid_amount,
          (s.total_amount - COALESCE((SELECT SUM(va.amount) FROM voucher_allocations va WHERE va.sale_id = s.id), 0)) AS outstanding_amount,
          CASE 
            WHEN s.status <> 'PAID' AND s.due_date < CURRENT_DATE THEN true 
            ELSE false 
          END AS is_overdue,
          CASE 
            WHEN s.status <> 'PAID' AND s.due_date < CURRENT_DATE THEN (CURRENT_DATE - s.due_date)
            ELSE 0 
          END AS days_overdue
         FROM sales s
         WHERE s.party_id = $1 AND s.created_by = $2 AND s.is_deleted = false
         ORDER BY s.entry_at DESC`,
        [partyId, user.id],
      );

      const purchaseBills = await this.db.query(
        `SELECT p.id, 'PURCHASE' AS bill_type, p.bill_no, p.entry_at, p.due_date, p.total_amount, p.status,
          COALESCE((SELECT SUM(va.amount) FROM voucher_allocations va WHERE va.purchase_id = p.id), 0) AS paid_amount,
          (p.total_amount - COALESCE((SELECT SUM(va.amount) FROM voucher_allocations va WHERE va.purchase_id = p.id), 0)) AS outstanding_amount,
          CASE 
            WHEN p.status <> 'PAID' AND p.due_date IS NOT NULL AND p.due_date < CURRENT_DATE THEN true 
            ELSE false 
          END AS is_overdue,
          CASE 
            WHEN p.status <> 'PAID' AND p.due_date IS NOT NULL AND p.due_date < CURRENT_DATE THEN (CURRENT_DATE - p.due_date)
            ELSE 0 
          END AS days_overdue
         FROM purchases p
         WHERE p.party_id = $1 AND p.created_by = $2 AND p.is_deleted = false
         ORDER BY p.entry_at DESC`,
        [partyId, user.id],
      );

      return {
        party: {
          id: party.id,
          name: party.name,
          type: party.type,
          whatsapp_number: party.whatsapp_number,
        },
        restricted: true,
        bills: [...salesBills.rows, ...purchaseBills.rows],
      };
    }

    // Owner view: Full statement with opening balance and running balance
    let periodOpeningBalance = parseFloat(party.opening_balance || '0');

    // If startDate is specified, factor in prior ledger movements before startDate
    if (startDate) {
      const priorRes = await this.db.query(
        `SELECT COALESCE(SUM(debit - credit), 0) AS prior_diff
         FROM ledger_entries
         WHERE party_id = $1 AND entry_at < $2`,
        [partyId, startDate],
      );
      periodOpeningBalance += parseFloat(priorRes.rows[0].prior_diff || '0');
    }

    const conditions: string[] = ['party_id = $1'];
    const params: any[] = [partyId];
    let idx = 2;

    if (startDate) {
      conditions.push(`entry_at >= $${idx++}`);
      params.push(startDate);
    }
    if (endDate) {
      conditions.push(`entry_at <= $${idx++}`);
      params.push(endDate);
    }

    const rowsRes = await this.db.query(
      `SELECT id, entry_at, source_type, source_id, debit, credit
       FROM ledger_entries
       WHERE ${conditions.join(' AND ')}
       ORDER BY entry_at ASC, id ASC`,
      params,
    );

    let runningBalance = periodOpeningBalance;
    let totalDebit = 0;
    let totalCredit = 0;

    const statementRows = rowsRes.rows.map((row) => {
      const debit = parseFloat(row.debit);
      const credit = parseFloat(row.credit);
      totalDebit += debit;
      totalCredit += credit;
      runningBalance += debit - credit;
      return {
        id: row.id,
        entry_at: row.entry_at,
        source_type: row.source_type,
        source_id: row.source_id,
        debit,
        credit,
        running_balance: Math.round(runningBalance * 100) / 100,
      };
    });

    return {
      party: {
        id: party.id,
        name: party.name,
        type: party.type,
        whatsapp_number: party.whatsapp_number,
        address: party.address,
      },
      restricted: false,
      opening_balance: Math.round(periodOpeningBalance * 100) / 100,
      closing_balance: Math.round(runningBalance * 100) / 100,
      total_debit: Math.round(totalDebit * 100) / 100,
      total_credit: Math.round(totalCredit * 100) / 100,
      rows: statementRows,
    };
  }

  async getCombinedCustomerDues() {
    const query = `
      SELECT p.id AS party_id, p.name AS customer_name, p.whatsapp_number,
        COUNT(s.id) AS total_bills,
        COUNT(CASE WHEN s.status <> 'PAID' AND s.due_date < CURRENT_DATE THEN 1 END) AS overdue_bills_count,
        COALESCE(SUM(s.total_amount - COALESCE(
          (SELECT SUM(va.amount) FROM voucher_allocations va WHERE va.sale_id = s.id), 0
        )), 0) AS total_outstanding,
        COALESCE(
          (SELECT JSON_AGG(JSON_BUILD_OBJECT(
            'id', s_inner.id,
            'bill_no', s_inner.bill_no,
            'entry_at', s_inner.entry_at,
            'due_date', s_inner.due_date,
            'total_amount', s_inner.total_amount,
            'status', s_inner.status,
            'allocated_amount', COALESCE((SELECT SUM(va.amount) FROM voucher_allocations va WHERE va.sale_id = s_inner.id), 0),
            'outstanding_amount', (s_inner.total_amount - COALESCE((SELECT SUM(va.amount) FROM voucher_allocations va WHERE va.sale_id = s_inner.id), 0)),
            'is_overdue', CASE WHEN s_inner.due_date < CURRENT_DATE THEN true ELSE false END,
            'days_overdue', CASE WHEN s_inner.due_date < CURRENT_DATE THEN (CURRENT_DATE - s_inner.due_date) ELSE 0 END,
            'created_by', s_inner.created_by,
            'creator_name', u.name
          ))
          FROM sales s_inner
          JOIN users u ON u.id = s_inner.created_by
          WHERE s_inner.party_id = p.id AND s_inner.is_deleted = false AND s_inner.status <> 'PAID'),
          '[]'::json
        ) AS pending_bills
      FROM parties p
      JOIN sales s ON s.party_id = p.id AND s.is_deleted = false
      WHERE s.status <> 'PAID'
      GROUP BY p.id, p.name, p.whatsapp_number
      HAVING SUM(s.total_amount - COALESCE(
        (SELECT SUM(va.amount) FROM voucher_allocations va WHERE va.sale_id = s.id), 0
      )) > 0
      ORDER BY total_outstanding DESC
    `;

    const res = await this.db.query(query);

    let totalReceivables = 0;
    let totalOverdueBills = 0;
    const customers = res.rows.map((row) => {
      const outstanding = parseFloat(row.total_outstanding);
      totalReceivables += outstanding;
      totalOverdueBills += parseInt(row.overdue_bills_count, 10);
      return {
        ...row,
        total_bills: parseInt(row.total_bills, 10),
        overdue_bills_count: parseInt(row.overdue_bills_count, 10),
        total_outstanding: Math.round(outstanding * 100) / 100,
      };
    });

    return {
      summary: {
        total_receivables: Math.round(totalReceivables * 100) / 100,
        total_customers: customers.length,
        total_overdue_bills: totalOverdueBills,
      },
      customers,
    };
  }

  async getCashBook(startDate?: string, endDate?: string) {
    let openingBalance = 0;
    if (startDate) {
      const priorRes = await this.db.query(
        `SELECT COALESCE(SUM(CASE WHEN kind = 'RECEIPT' THEN amount ELSE -amount END), 0) AS prior_diff
         FROM money_vouchers
         WHERE mode = 'CASH' AND is_deleted = false AND entry_at < $1`,
        [startDate],
      );
      openingBalance = parseFloat(priorRes.rows[0].prior_diff || '0');
    }

    const conditions: string[] = ["mv.mode = 'CASH'", 'mv.is_deleted = false'];
    const params: any[] = [];
    let idx = 1;

    if (startDate) {
      conditions.push(`mv.entry_at >= $${idx++}`);
      params.push(startDate);
    }
    if (endDate) {
      conditions.push(`mv.entry_at <= $${idx++}`);
      params.push(endDate);
    }

    const query = `
      SELECT mv.id, mv.voucher_no, mv.entry_at, mv.kind, mv.amount, mv.reference_no,
             p.name AS party_name, u.name AS creator_name
      FROM money_vouchers mv
      JOIN parties p ON p.id = mv.party_id
      JOIN users u ON u.id = mv.created_by
      WHERE ${conditions.join(' AND ')}
      ORDER BY mv.entry_at ASC, mv.id ASC
    `;

    const res = await this.db.query(query, params);
    let running = openingBalance;
    let totalReceipts = 0;
    let totalPayments = 0;

    const entries = res.rows.map((r) => {
      const amt = parseFloat(r.amount);
      if (r.kind === 'RECEIPT') {
        running += amt;
        totalReceipts += amt;
      } else {
        running -= amt;
        totalPayments += amt;
      }
      return {
        ...r,
        amount: amt,
        running_balance: Math.round(running * 100) / 100,
      };
    });

    return {
      opening_balance: Math.round(openingBalance * 100) / 100,
      closing_balance: Math.round(running * 100) / 100,
      total_receipts: Math.round(totalReceipts * 100) / 100,
      total_payments: Math.round(totalPayments * 100) / 100,
      entries,
    };
  }

  async getBankBook(bankAccountId?: string, startDate?: string, endDate?: string) {
    let openingBalance = 0;
    let bankInfo: any = null;

    if (bankAccountId) {
      const bRes = await this.db.query(`SELECT id, name, opening_balance FROM bank_accounts WHERE id = $1`, [bankAccountId]);
      if (bRes.rows.length === 0) throw new NotFoundException('Bank account not found');
      bankInfo = bRes.rows[0];
      openingBalance = parseFloat(bankInfo.opening_balance || '0');

      if (startDate) {
        const priorRes = await this.db.query(
          `SELECT COALESCE(SUM(CASE WHEN kind = 'RECEIPT' THEN amount ELSE -amount END), 0) AS prior_diff
           FROM money_vouchers
           WHERE mode = 'BANK' AND bank_account_id = $1 AND is_deleted = false AND entry_at < $2`,
          [bankAccountId, startDate],
        );
        openingBalance += parseFloat(priorRes.rows[0].prior_diff || '0');
      }
    } else {
      const totalBRes = await this.db.query(`SELECT COALESCE(SUM(opening_balance), 0) AS total_opening FROM bank_accounts WHERE is_active = true`);
      openingBalance = parseFloat(totalBRes.rows[0].total_opening || '0');

      if (startDate) {
        const priorRes = await this.db.query(
          `SELECT COALESCE(SUM(CASE WHEN kind = 'RECEIPT' THEN amount ELSE -amount END), 0) AS prior_diff
           FROM money_vouchers
           WHERE mode = 'BANK' AND is_deleted = false AND entry_at < $1`,
          [startDate],
        );
        openingBalance += parseFloat(priorRes.rows[0].prior_diff || '0');
      }
    }

    const conditions: string[] = ["mv.mode = 'BANK'", 'mv.is_deleted = false'];
    const params: any[] = [];
    let idx = 1;

    if (bankAccountId) {
      conditions.push(`mv.bank_account_id = $${idx++}`);
      params.push(bankAccountId);
    }
    if (startDate) {
      conditions.push(`mv.entry_at >= $${idx++}`);
      params.push(startDate);
    }
    if (endDate) {
      conditions.push(`mv.entry_at <= $${idx++}`);
      params.push(endDate);
    }

    const query = `
      SELECT mv.id, mv.voucher_no, mv.entry_at, mv.kind, mv.amount, mv.reference_no,
             b.id AS bank_account_id, b.name AS bank_name,
             p.name AS party_name, u.name AS creator_name
      FROM money_vouchers mv
      JOIN parties p ON p.id = mv.party_id
      JOIN bank_accounts b ON b.id = mv.bank_account_id
      JOIN users u ON u.id = mv.created_by
      WHERE ${conditions.join(' AND ')}
      ORDER BY mv.entry_at ASC, mv.id ASC
    `;

    const res = await this.db.query(query, params);
    let running = openingBalance;
    let totalReceipts = 0;
    let totalPayments = 0;

    const entries = res.rows.map((r) => {
      const amt = parseFloat(r.amount);
      if (r.kind === 'RECEIPT') {
        running += amt;
        totalReceipts += amt;
      } else {
        running -= amt;
        totalPayments += amt;
      }
      return {
        ...r,
        amount: amt,
        running_balance: Math.round(running * 100) / 100,
      };
    });

    return {
      bank_account: bankInfo ? { id: bankInfo.id, name: bankInfo.name } : null,
      opening_balance: Math.round(openingBalance * 100) / 100,
      closing_balance: Math.round(running * 100) / 100,
      total_receipts: Math.round(totalReceipts * 100) / 100,
      total_payments: Math.round(totalPayments * 100) / 100,
      entries,
    };
  }
}
