import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class DashboardService {
  constructor(private readonly db: DatabaseService) {}

  async getOwnerMetrics() {
    // 1. Receivables & Payables across all parties
    const balanceRes = await this.db.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN net_bal > 0 THEN net_bal ELSE 0 END), 0) AS total_receivable,
        COALESCE(SUM(CASE WHEN net_bal < 0 THEN ABS(net_bal) ELSE 0 END), 0) AS total_payable
      FROM (
        SELECT p.id,
          (p.opening_balance + COALESCE(SUM(le.debit - le.credit), 0)) AS net_bal
        FROM parties p
        LEFT JOIN ledger_entries le ON le.party_id = p.id
        WHERE p.is_active = true
        GROUP BY p.id, p.opening_balance
      ) sub
    `);

    // 2. Overdue Amount and Count
    const overdueRes = await this.db.query(`
      SELECT 
        COUNT(s.id) AS overdue_count,
        COALESCE(SUM(s.total_amount - COALESCE(
          (SELECT SUM(va.amount) FROM voucher_allocations va WHERE va.sale_id = s.id), 0
        )), 0) AS overdue_amount
      FROM sales s
      WHERE s.is_deleted = false
        AND s.status <> 'PAID'
        AND s.due_date < CURRENT_DATE
    `);

    // 3. Today's Sales & Purchases
    const todayRes = await this.db.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN source = 'SALE' THEN total_amount ELSE 0 END), 0) AS today_sales,
        COALESCE(SUM(CASE WHEN source = 'PURCHASE' THEN total_amount ELSE 0 END), 0) AS today_purchases
      FROM (
        SELECT 'SALE' AS source, total_amount FROM sales WHERE DATE(entry_at) = CURRENT_DATE AND is_deleted = false
        UNION ALL
        SELECT 'PURCHASE' AS source, total_amount FROM purchases WHERE DATE(entry_at) = CURRENT_DATE AND is_deleted = false
      ) combined
    `);

    // 4. Cash and Bank Balances
    const cashRes = await this.db.query(`
      SELECT COALESCE(SUM(CASE WHEN kind = 'RECEIPT' THEN amount ELSE -amount END), 0) AS cash_balance
      FROM money_vouchers WHERE mode = 'CASH' AND is_deleted = false
    `);

    const bankRes = await this.db.query(`
      SELECT 
        COALESCE(SUM(b.opening_balance), 0) + 
        COALESCE((
          SELECT SUM(CASE WHEN kind = 'RECEIPT' THEN amount ELSE -amount END)
          FROM money_vouchers WHERE mode = 'BANK' AND is_deleted = false
        ), 0) AS total_bank_balance
      FROM bank_accounts b
      WHERE b.is_active = true
    `);

    // 5. Top 5 customers by pending dues
    const topDuesRes = await this.db.query(`
      SELECT p.id, p.name AS customer_name, p.whatsapp_number,
        SUM(s.total_amount - COALESCE(
          (SELECT SUM(va.amount) FROM voucher_allocations va WHERE va.sale_id = s.id), 0
        )) AS pending_amount
      FROM parties p
      JOIN sales s ON s.party_id = p.id AND s.is_deleted = false
      WHERE s.status <> 'PAID'
      GROUP BY p.id, p.name, p.whatsapp_number
      ORDER BY pending_amount DESC
      LIMIT 5
    `);

    // 6. Low or negative stock items
    const lowStockRes = await this.db.query(`
      SELECT i.id, i.name, i.category,
             COALESCE(SUM(sm.pieces_delta), 0) AS pieces,
             COALESCE(SUM(sm.kg_delta), 0.000) AS weight_kg
      FROM items i
      LEFT JOIN stock_movements sm ON sm.item_id = i.id
      WHERE i.is_active = true
      GROUP BY i.id, i.name, i.category
      HAVING COALESCE(SUM(sm.pieces_delta), 0) <= 2 OR COALESCE(SUM(sm.kg_delta), 0.000) <= 0.050
      ORDER BY weight_kg ASC
      LIMIT 5
    `);

    // 7. Recent 5 entries with staff name
    const recentRes = await this.db.query(`
      SELECT id, type, party_name, amount, entry_at, creator_name
      FROM (
        SELECT s.id, 'Sale' AS type, p.name AS party_name, s.total_amount AS amount, s.entry_at, u.name AS creator_name
        FROM sales s JOIN parties p ON p.id = s.party_id JOIN users u ON u.id = s.created_by WHERE s.is_deleted = false
        UNION ALL
        SELECT pr.id, 'Purchase' AS type, p.name AS party_name, pr.total_amount AS amount, pr.entry_at, u.name AS creator_name
        FROM purchases pr JOIN parties p ON p.id = pr.party_id JOIN users u ON u.id = pr.created_by WHERE pr.is_deleted = false
        UNION ALL
        SELECT mv.id, mv.kind AS type, p.name AS party_name, mv.amount, mv.entry_at, u.name AS creator_name
        FROM money_vouchers mv JOIN parties p ON p.id = mv.party_id JOIN users u ON u.id = mv.created_by WHERE mv.is_deleted = false
      ) all_entries
      ORDER BY entry_at DESC
      LIMIT 5
    `);

    return {
      totalReceivable: parseFloat(balanceRes.rows[0]?.total_receivable || 0),
      totalPayable: parseFloat(balanceRes.rows[0]?.total_payable || 0),
      overdueAmount: parseFloat(overdueRes.rows[0]?.overdue_amount || 0),
      overdueCount: parseInt(overdueRes.rows[0]?.overdue_count || 0, 10),
      todaySales: parseFloat(todayRes.rows[0]?.today_sales || 0),
      todayPurchases: parseFloat(todayRes.rows[0]?.today_purchases || 0),
      cashBalance: parseFloat(cashRes.rows[0]?.cash_balance || 0),
      bankBalance: parseFloat(bankRes.rows[0]?.total_bank_balance || 0),
      topCustomersByDues: topDuesRes.rows,
      lowStockItems: lowStockRes.rows,
      recentEntries: recentRes.rows,
    };
  }
}
