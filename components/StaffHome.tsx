'use client'

import React from 'react';
import { formatRupee, formatDate } from '@/lib/format';

interface StaffHomeProps {
  staffName: string;
  onOpenModal: (modal: 'sale' | 'purchase' | 'polish' | 'meena' | 'receipt' | 'payment') => void;
  entries: any[];
}

export function StaffHome({ staffName, onOpenModal, entries }: StaffHomeProps) {
  const statusClass: Record<string, string> = {
    Open: 'status-open',
    OPEN: 'status-open',
    Partial: 'status-partial',
    PARTIAL: 'status-partial',
    Paid: 'status-paid',
    PAID: 'status-paid',
    Overdue: 'status-overdue',
    OVERDUE: 'status-overdue',
  };

  return (
    <div className="staff-home-section">
      <div className="welcome-banner" style={{ marginBottom: 28 }}>
        <p className="eyebrow" style={{ color: '#9B1C31', fontWeight: 700 }}>Fast Transaction Entry</p>
        <h2 style={{ font: '26px Georgia', margin: '4px 0 6px' }}>Namaste, {staffName}</h2>
        <p style={{ color: '#7A7268', fontSize: 13 }}>Select an entry type below to record an instant transaction.</p>
      </div>

      {/* 6 Large Action Buttons */}
      <div className="staff-action-grid">
        <div className="staff-action-card" onClick={() => onOpenModal('sale')}>
          <div className="staff-card-icon" style={{ background: '#FBE9EC', color: '#9B1C31' }}>↗</div>
          <strong>New Sale</strong>
          <span>Billed in pieces & Kg</span>
        </div>

        <div className="staff-action-card" onClick={() => onOpenModal('purchase')}>
          <div className="staff-card-icon" style={{ background: '#FFF7ED', color: '#B8893B' }}>↙</div>
          <strong>New Purchase</strong>
          <span>Stock from suppliers</span>
        </div>

        <div className="staff-action-card" onClick={() => onOpenModal('polish')}>
          <div className="staff-card-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>✦</div>
          <strong>Polish Job Work</strong>
          <span>Issue or receive in Kg</span>
        </div>

        <div className="staff-action-card" onClick={() => onOpenModal('meena')}>
          <div className="staff-card-icon" style={{ background: '#FAF5FF', color: '#9333EA' }}>❖</div>
          <strong>Meena Job Work</strong>
          <span>Enamel artisan weight</span>
        </div>

        <div className="staff-action-card" onClick={() => onOpenModal('receipt')}>
          <div className="staff-card-icon" style={{ background: '#ECFDF5', color: '#059669' }}>₹</div>
          <strong>Receipt</strong>
          <span>Cash / Bank collection</span>
        </div>

        <div className="staff-action-card" onClick={() => onOpenModal('payment')}>
          <div className="staff-card-icon" style={{ background: '#FFF1F2', color: '#E11D48' }}>⇄</div>
          <strong>Payment</strong>
          <span>Settlement to party</span>
        </div>
      </div>

      {/* Recent 5 entries made by this staff member */}
      <div className="panel" style={{ marginTop: 32 }}>
        <div className="panel-heading">
          <div>
            <h3 style={{ font: '20px Georgia' }}>Your Recent Entries</h3>
            <p style={{ color: '#7A7268', fontSize: 12 }}>Last entries created by your account</p>
          </div>
          <span style={{ fontSize: 11, color: '#7A7268' }}>Staff Isolated View</span>
        </div>

        <div className="entries-list">
          {entries && entries.length > 0 ? (
            entries.slice(0, 5).map((entry, idx) => (
              <div className="entry-row" key={entry.id || idx}>
                <div className="entry-icon">
                  {entry.type === 'Sale' || entry.bill_no ? '↗' : entry.type === 'Purchase' ? '↙' : '₹'}
                </div>
                <div className="entry-name">
                  <strong>{entry.party_name || entry.party || 'Customer'}</strong>
                  <span>
                    {entry.type || 'Entry'} · {formatDate(entry.entry_at || entry.date || new Date().toISOString())}
                  </span>
                </div>
                <strong className="entry-amount tabular-numbers">
                  {formatRupee(entry.total_amount || entry.amount || 0)}
                </strong>
                <span className={`status ${statusClass[entry.status] || 'status-open'}`} style={{ marginLeft: 12 }}>
                  {entry.status || 'OPEN'}
                </span>
              </div>
            ))
          ) : (
            <p style={{ padding: '24px 0', color: '#7A7268', textAlign: 'center', fontSize: 13 }}>
              No entries recorded yet. Tap any button above to make your first entry.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
