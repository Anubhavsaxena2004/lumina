'use client'

import React from 'react';
import { DashboardStats } from '@/lib/api/types';
import { formatRupee, formatDate } from '@/lib/format';

interface OwnerDashboardProps {
  stats: DashboardStats;
  onNavigate: (tab: string) => void;
  onOpenSaleModal: () => void;
}

export function OwnerDashboard({ stats, onNavigate, onOpenSaleModal }: OwnerDashboardProps) {
  return (
    <div>
      <div className="welcome-row">
        <div>
          <h2>Owner Management Dashboard</h2>
          <p>Real-time accounting, inventory balances, and overdue dues across all staff.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={() => onNavigate('Reminders')}>
            ⏰ Reminder Settings
          </button>
          <button className="primary-button" onClick={onOpenSaleModal}>
            ＋ New Entry
          </button>
        </div>
      </div>

      {/* 8 Metric Stat Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <article className="stat-card">
          <span>Total Receivable (Debtors)</span>
          <strong className="tabular-numbers" style={{ color: '#9B1C31' }}>{formatRupee(stats.totalReceivable)}</strong>
          <small style={{ color: '#7A7268' }}>Customers owe business</small>
        </article>

        <article className="stat-card gold">
          <span>Total Payable (Creditors)</span>
          <strong className="tabular-numbers" style={{ color: '#B8893B' }}>{formatRupee(stats.totalPayable)}</strong>
          <small style={{ color: '#7A7268' }}>Owed to bullion/suppliers</small>
        </article>

        <article className="stat-card" style={{ borderTopColor: '#DC2626' }}>
          <span>Overdue Payments</span>
          <strong className="tabular-numbers" style={{ color: '#DC2626' }}>{formatRupee(stats.overdueAmount)}</strong>
          <small style={{ color: '#DC2626' }}>{stats.overdueCount} bills past due date</small>
        </article>

        <article className="stat-card blue">
          <span>Bank & Cash Balances</span>
          <strong className="tabular-numbers">{formatRupee(stats.bankBalance + stats.cashBalance)}</strong>
          <small style={{ color: '#5A83A1' }}>Bank: {formatRupee(stats.bankBalance)} · Cash: {formatRupee(stats.cashBalance)}</small>
        </article>
      </div>

      {/* Secondary Metrics Row */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginTop: 12 }}>
        <article className="stat-card green">
          <span>Today's Sales Revenue</span>
          <strong className="tabular-numbers" style={{ color: '#059669' }}>{formatRupee(stats.todaySales)}</strong>
          <small style={{ color: '#059669' }}>Server stamped today</small>
        </article>

        <article className="stat-card gold">
          <span>Today's Purchases</span>
          <strong className="tabular-numbers">{formatRupee(stats.todayPurchases)}</strong>
          <small style={{ color: '#7A7268' }}>Fresh stock booked</small>
        </article>
      </div>

      {/* Bottom Content Panels */}
      <div className="content-grid">
        {/* Top Customers by Pending Dues */}
        <article className="panel">
          <div className="panel-heading">
            <div>
              <h3>Top Customers by Pending Dues</h3>
              <p>Parties with the largest unpaid balances</p>
            </div>
            <button className="text-button" onClick={() => onNavigate('Parties')}>
              View all parties →
            </button>
          </div>

          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {stats.topCustomersByDues && stats.topCustomersByDues.length > 0 ? (
              stats.topCustomersByDues.map((c, i) => (
                <div key={c.id || i} style={{ borderBottom: '1px solid var(--line)', paddingBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{c.customer_name}</span>
                    <strong style={{ fontSize: 13, color: '#9B1C31' }} className="tabular-numbers">
                      {formatRupee(c.pending_amount)}
                    </strong>
                  </div>
                  <div style={{ width: '100%', height: 6, background: '#F5EFEB', borderRadius: 4, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, (c.pending_amount / (stats.totalReceivable || 1)) * 100)}%`,
                        height: '100%',
                        background: '#9B1C31',
                        borderRadius: 4,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: '#7A7268', fontSize: 12 }}>No outstanding customer dues recorded.</p>
            )}
          </div>
        </article>

        {/* Low Stock Alerts & Recent Entries */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Low Stock Panel */}
          <article className="panel">
            <div className="panel-heading">
              <div>
                <h3>Low Stock Warning</h3>
                <p>Items below safe inventory threshold</p>
              </div>
              <button className="text-button" onClick={() => onNavigate('Stock')}>
                Stock register →
              </button>
            </div>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stats.lowStockItems && stats.lowStockItems.length > 0 ? (
                stats.lowStockItems.map((item, idx) => (
                  <div key={item.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                    <div>
                      <strong style={{ fontSize: 12 }}>{item.name}</strong>
                      <span style={{ display: 'block', fontSize: 10, color: '#7A7268' }}>{item.category}</span>
                    </div>
                    <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '3px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 }} className="tabular-numbers">
                      {item.pieces} pcs / {parseFloat(String(item.weight_kg)).toFixed(3)} Kg
                    </span>
                  </div>
                ))
              ) : (
                <p style={{ color: '#7A7268', fontSize: 12 }}>All item stock levels adequate.</p>
              )}
            </div>
          </article>

          {/* Recent Entries */}
          <article className="panel">
            <div className="panel-heading">
              <div>
                <h3>Recent Activity Across Staff</h3>
                <p>Audited transactions submitted by team</p>
              </div>
              <button className="text-button" onClick={() => onNavigate('Entries')}>
                All entries →
              </button>
            </div>
            <div className="entries-list" style={{ marginTop: 10 }}>
              {stats.recentEntries && stats.recentEntries.map((e, idx) => (
                <div className="entry-row" key={e.id || idx} style={{ minHeight: 48 }}>
                  <div className="entry-name">
                    <strong>{e.party_name}</strong>
                    <span>{e.type} · by {e.creator_name}</span>
                  </div>
                  <strong className="entry-amount tabular-numbers">{formatRupee(e.amount)}</strong>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
