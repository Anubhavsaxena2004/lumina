import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AuthUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class LedgerService {
  constructor(private readonly db: DatabaseService) {}

  async getPartyStatement(partyId: string, user: AuthUser, startDate?: string, endDate?: string) {
    // 1. Fetch party info
    const partyRes = await this.db.query(`SELECT * FROM parties WHERE id = $1`, [partyId]);
    if (partyRes.rows.length === 0) throw new NotFoundException('Party not found');
    const party = partyRes.rows[0];

    // Staff isolation check
    if (user.role === 'STAFF') {
      // Staff only sees status of bills they created for this party
      const bills = await this.db.query(
        `SELECT s.id, s.bill_no, s.entry_at, s.due_date, s.total_amount, s.status,
          COALESCE((SELECT SUM(va.amount) FROM voucher_allocations va WHERE va.sale_id = s.id), 0) AS paid_amount,
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
      return {
        party: { id: party.id, name: party.name, type: party.type },
        restricted: true,
        bills: bills.rows,
      };
    }

    // Owner view: Full statement with opening balance and running balance
    const openingBalance = parseFloat(party.opening_balance);

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

    let runningBalance = openingBalance;
    const statementRows = rowsRes.rows.map((row) => {
      const debit = parseFloat(row.debit);
      const credit = parseFloat(row.credit);
      runningBalance += debit - credit;
      return {
        id: row.id,
        entry_at: row.entry_at,
        source_type: row.source_type,
        source_id: row.source_id,
        debit,
        credit,
        running_balance: runningBalance,
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
      opening_balance: openingBalance,
      closing_balance: runningBalance,
      rows: statementRows,
    };
  }

  async getCombinedCustomerDues() {
    const query = `
      SELECT p.id AS party_id, p.name AS customer_name, p.whatsapp_number,
        COUNT(s.id) AS total_bills,
        COUNT(CASE WHEN s.status <> 'PAID' AND s.due_date < CURRENT_DATE THEN 1 END) AS overdue_bills_count,
        SUM(s.total_amount - COALESCE(
          (SELECT SUM(va.amount) FROM voucher_allocations va WHERE va.sale_id = s.id), 0
        )) AS total_outstanding
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
    return res.rows;
  }

  async getCashBook() {
    const query = `
      SELECT mv.id, mv.voucher_no, mv.entry_at, mv.kind, mv.amount, mv.reference_no,
             p.name AS party_name, u.name AS creator_name
      FROM money_vouchers mv
      JOIN parties p ON p.id = mv.party_id
      JOIN users u ON u.id = mv.created_by
      WHERE mv.mode = 'CASH' AND mv.is_deleted = false
      ORDER BY mv.entry_at ASC
    `;
    const res = await this.db.query(query);
    let running = 0;
    const entries = res.rows.map((r) => {
      const amt = parseFloat(r.amount);
      if (r.kind === 'RECEIPT') running += amt;
      else running -= amt;
      return { ...r, running_balance: running };
    });
    return { balance: running, entries };
  }

  async getBankBook(bankAccountId?: string) {
    let query = `
      SELECT mv.id, mv.voucher_no, mv.entry_at, mv.kind, mv.amount, mv.reference_no,
             b.name AS bank_name, p.name AS party_name, u.name AS creator_name
      FROM money_vouchers mv
      JOIN parties p ON p.id = mv.party_id
      JOIN bank_accounts b ON b.id = mv.bank_account_id
      JOIN users u ON u.id = mv.created_by
      WHERE mv.mode = 'BANK' AND mv.is_deleted = false
    `;
    const params: any[] = [];
    if (bankAccountId) {
      query += ` AND mv.bank_account_id = $1`;
      params.push(bankAccountId);
    }
    query += ` ORDER BY mv.entry_at ASC`;

    const res = await this.db.query(query, params);
    let running = 0;
    const entries = res.rows.map((r) => {
      const amt = parseFloat(r.amount);
      if (r.kind === 'RECEIPT') running += amt;
      else running -= amt;
      return { ...r, running_balance: running };
    });
    return { balance: running, entries };
  }
}
