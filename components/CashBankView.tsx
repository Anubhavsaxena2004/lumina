'use client'

import React, { useState } from 'react';
import { BankAccount } from '@/lib/api/types';
import { formatRupee } from '@/lib/format';

interface CashBankViewProps {
  bankAccounts: BankAccount[];
}

export function CashBankView({ bankAccounts }: CashBankViewProps) {
  const [activeTab, setActiveTab] = useState<'cash' | 'bank'>('bank');
  const [selectedBankId, setSelectedBankId] = useState(bankAccounts[0]?.id || '');

  const selectedBank = bankAccounts.find((b) => b.id === selectedBankId) || bankAccounts[0];

  return (
    <div>
      <div className="welcome-row">
        <div>
          <h2>Cash & Bank Books</h2>
          <p>Audited running cash registers and multi-bank business statements.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <button
          className={activeTab === 'bank' ? 'primary-button' : 'btn-secondary'}
          onClick={() => setActiveTab('bank')}
        >
          🏦 Bank Accounts Book
        </button>
        <button
          className={activeTab === 'cash' ? 'primary-button' : 'btn-secondary'}
          onClick={() => setActiveTab('cash')}
        >
          💵 Cash in Hand Book
        </button>
      </div>

      {activeTab === 'bank' ? (
        <div>
          <div className="panel" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <label style={{ fontSize: 11, color: '#7A7268', textTransform: 'uppercase', fontWeight: 700 }}>Select Bank Account</label>
                <select
                  className="form-select"
                  style={{ minWidth: 260, marginTop: 4 }}
                  value={selectedBankId}
                  onChange={(e) => setSelectedBankId(e.target.value)}
                >
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 11, color: '#7A7268', textTransform: 'uppercase', fontWeight: 700 }}>Current Bank Balance</span>
                <strong style={{ display: 'block', font: '26px Georgia', color: '#059669', marginTop: 2 }} className="tabular-numbers">
                  {formatRupee(selectedBank?.current_balance || selectedBank?.opening_balance || 520000)}
                </strong>
              </div>
            </div>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Voucher #</th>
                  <th>Party</th>
                  <th>Mode / Ref</th>
                  <th style={{ textAlign: 'right' }}>Deposit (₹)</th>
                  <th style={{ textAlign: 'right' }}>Withdrawal (₹)</th>
                  <th style={{ textAlign: 'right' }}>Running Balance</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: '#FAF6F2' }}>
                  <td colSpan={4}><strong>Opening Balance</strong></td>
                  <td style={{ textAlign: 'right' }}>—</td>
                  <td style={{ textAlign: 'right' }}>—</td>
                  <td style={{ textAlign: 'right' }} className="tabular-numbers"><strong>{formatRupee(selectedBank?.opening_balance || 450000)}</strong></td>
                </tr>
                <tr>
                  <td>30/09/2026 17:00</td>
                  <td>#2001 (Receipt)</td>
                  <td>Rajasthan Jewellers</td>
                  <td>IMPS-987211</td>
                  <td style={{ textAlign: 'right', color: '#059669' }} className="tabular-numbers">₹50,000</td>
                  <td style={{ textAlign: 'right' }} className="tabular-numbers">—</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }} className="tabular-numbers">₹5,00,000</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div>
          <div className="panel" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ font: '20px Georgia', margin: 0 }}>Cash Counter Register</h3>
                <p style={{ color: '#7A7268', fontSize: 12, margin: '4px 0 0' }}>Physical currency collected and disbursed in store</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 11, color: '#7A7268', textTransform: 'uppercase', fontWeight: 700 }}>Cash in Hand</span>
                <strong style={{ display: 'block', font: '26px Georgia', color: '#2B2B2B', marginTop: 2 }} className="tabular-numbers">
                  ₹2,14,680
                </strong>
              </div>
            </div>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Voucher #</th>
                  <th>Party</th>
                  <th style={{ textAlign: 'right' }}>Cash In (Receipt)</th>
                  <th style={{ textAlign: 'right' }}>Cash Out (Payment)</th>
                  <th style={{ textAlign: 'right' }}>Cash Balance</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>28/09/2026 14:30</td>
                  <td>#1998</td>
                  <td>Aarav Gold House</td>
                  <td style={{ textAlign: 'right', color: '#059669' }} className="tabular-numbers">₹38,900</td>
                  <td style={{ textAlign: 'right' }}>—</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }} className="tabular-numbers">₹2,14,680</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
