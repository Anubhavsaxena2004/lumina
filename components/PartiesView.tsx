'use client'

import React, { useState } from 'react';
import { Party } from '@/lib/api/types';
import { formatRupee, formatDate } from '@/lib/format';
import { createParty } from '@/lib/api/services';

interface PartiesViewProps {
  parties: Party[];
  onRefresh: () => void;
}

export function PartiesView({ parties, onRefresh }: PartiesViewProps) {
  const [selectedParty, setSelectedParty] = useState<Party | null>(parties[0] || null);
  const [search, setSearch] = useState('');
  const [showAddParty, setShowAddParty] = useState(false);
  const [activeTab, setActiveTab] = useState<'ledger' | 'bills'>('ledger');

  // New party form
  const [name, setName] = useState('');
  const [type, setType] = useState<'CUSTOMER' | 'SUPPLIER' | 'BOTH'>('CUSTOMER');
  const [phone, setPhone] = useState('+91');
  const [address, setAddress] = useState('');
  const [openingBalance, setOpeningBalance] = useState(0);

  const filtered = parties.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.whatsapp_number && p.whatsapp_number.includes(search)),
  );

  const handleCreateParty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createParty({
        name,
        type,
        whatsapp_number: phone,
        address,
        opening_balance: openingBalance,
      });
      setShowAddParty(false);
      setName('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error creating party');
    }
  };

  return (
    <div>
      <div className="welcome-row">
        <div>
          <h2>Parties & Ledger Directory</h2>
          <p>Customer, supplier, and artisan accounts with live running balances and WhatsApp contact.</p>
        </div>
        <button className="primary-button" onClick={() => setShowAddParty(true)}>
          ＋ Add New Party
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, marginTop: 20 }}>
        {/* Parties List Column */}
        <div>
          <input
            type="text"
            className="search-input"
            style={{ width: '100%', marginBottom: 12 }}
            placeholder="Search party or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div style={{ background: '#FFF', border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
            {filtered.map((p) => {
              const isSelected = selectedParty?.id === p.id;
              const isDebtor = (p.current_balance || p.opening_balance) > 0;

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedParty(p)}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid var(--line)',
                    cursor: 'pointer',
                    background: isSelected ? '#FAF0F2' : 'transparent',
                    borderLeft: isSelected ? '4px solid #9B1C31' : '4px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: 13, color: isSelected ? '#9B1C31' : '#2B2B2B' }}>{p.name}</strong>
                    <span style={{ fontSize: 10, color: '#7A7268', textTransform: 'uppercase' }}>{p.type}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: '#7A7268' }}>{p.whatsapp_number || 'No WhatsApp'}</span>
                    <strong style={{ fontSize: 12, color: isDebtor ? '#9B1C31' : '#059669' }} className="tabular-numbers">
                      {formatRupee(p.current_balance || p.opening_balance)}
                    </strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Party Details & Statement Column */}
        {selectedParty ? (
          <div>
            {/* Party Header Card */}
            <div className="panel" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <h3 style={{ font: '24px Georgia', margin: 0 }}>{selectedParty.name}</h3>
                    <span className="status status-open">{selectedParty.type}</span>
                  </div>
                  <p style={{ color: '#7A7268', fontSize: 12, margin: '6px 0 0' }}>
                    📱 {selectedParty.whatsapp_number || 'N/A'} · 📍 {selectedParty.address || 'No address stored'}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 10, textTransform: 'uppercase', color: '#7A7268', fontWeight: 700 }}>Current Running Balance</span>
                  <div style={{ font: '26px Georgia', color: '#9B1C31', marginTop: 2 }} className="tabular-numbers">
                    {formatRupee(selectedParty.current_balance || selectedParty.opening_balance)}
                  </div>
                  <small style={{ color: '#7A7268' }}>
                    {(selectedParty.current_balance || selectedParty.opening_balance) >= 0 ? 'Customer owes business' : 'Business owes party'}
                  </small>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div style={{ display: 'flex', gap: 16, marginTop: 24, borderBottom: '1px solid var(--line)' }}>
                <button
                  onClick={() => setActiveTab('ledger')}
                  style={{
                    border: 0,
                    background: 'transparent',
                    padding: '8px 12px',
                    fontWeight: 700,
                    fontSize: 13,
                    borderBottom: activeTab === 'ledger' ? '2px solid #9B1C31' : 'none',
                    color: activeTab === 'ledger' ? '#9B1C31' : '#7A7268',
                  }}
                >
                  Party Ledger Statement
                </button>
                <button
                  onClick={() => setActiveTab('bills')}
                  style={{
                    border: 0,
                    background: 'transparent',
                    padding: '8px 12px',
                    fontWeight: 700,
                    fontSize: 13,
                    borderBottom: activeTab === 'bills' ? '2px solid #9B1C31' : 'none',
                    color: activeTab === 'bills' ? '#9B1C31' : '#7A7268',
                  }}
                >
                  Open / Overdue Invoices
                </button>
              </div>
            </div>

            {/* Tab 1: Ledger Statement */}
            {activeTab === 'ledger' && (
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Voucher / Source</th>
                      <th style={{ textAlign: 'right' }}>Debit (₹)</th>
                      <th style={{ textAlign: 'right' }}>Credit (₹)</th>
                      <th style={{ textAlign: 'right' }}>Running Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ background: '#FAF6F2' }}>
                      <td colSpan={2}><strong>Opening Balance</strong></td>
                      <td style={{ textAlign: 'right' }} className="tabular-numbers">—</td>
                      <td style={{ textAlign: 'right' }} className="tabular-numbers">—</td>
                      <td style={{ textAlign: 'right' }} className="tabular-numbers"><strong>{formatRupee(selectedParty.opening_balance)}</strong></td>
                    </tr>
                    <tr>
                      <td>30/09/2026</td>
                      <td>Sale Invoice #1048</td>
                      <td style={{ textAlign: 'right', color: '#9B1C31' }} className="tabular-numbers">₹1,86,500</td>
                      <td style={{ textAlign: 'right' }} className="tabular-numbers">—</td>
                      <td style={{ textAlign: 'right' }} className="tabular-numbers">₹3,11,500</td>
                    </tr>
                    <tr>
                      <td>30/09/2026</td>
                      <td>Bank Receipt #2001 (HDFC)</td>
                      <td style={{ textAlign: 'right' }} className="tabular-numbers">—</td>
                      <td style={{ textAlign: 'right', color: '#059669' }} className="tabular-numbers">₹50,000</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }} className="tabular-numbers">₹2,61,500</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 2: Open Invoices */}
            {activeTab === 'bills' && (
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Bill #</th>
                      <th>Billed Date</th>
                      <th>Due Date</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                      <th style={{ textAlign: 'right' }}>Outstanding</th>
                      <th style={{ textAlign: 'center' }}>WhatsApp Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>#1048</strong></td>
                      <td>30/09/2026</td>
                      <td style={{ color: '#059669' }}>05/10/2026</td>
                      <td style={{ textAlign: 'right' }} className="tabular-numbers">₹1,86,500</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }} className="tabular-numbers">₹1,36,500</td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="primary-button" style={{ fontSize: 11, padding: '0 10px', minHeight: 32, background: '#25D366' }}>
                          📱 Send Bill
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 48, color: '#7A7268' }}>Select a party to inspect ledger.</div>
        )}
      </div>

      {/* Add Party Modal */}
      {showAddParty && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: 500 }}>
            <form onSubmit={handleCreateParty}>
              <div className="modal-header">
                <h3>Add New Business Party</h3>
                <button type="button" className="close-btn" onClick={() => setShowAddParty(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Business Name / Party</label>
                  <input className="form-input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Royal Gems Jaipur" />
                </div>
                <div className="form-group">
                  <label>Party Role Type</label>
                  <select className="form-select" value={type} onChange={(e) => setType(e.target.value as any)}>
                    <option value="CUSTOMER">Customer (Debtor)</option>
                    <option value="SUPPLIER">Supplier (Creditor)</option>
                    <option value="BOTH">Both Customer & Supplier</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>WhatsApp Number (E.164 with country code)</label>
                  <input className="form-input" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+919829000000" />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input className="form-input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Market / City" />
                </div>
                <div className="form-group">
                  <label>Opening Balance (₹)</label>
                  <input type="number" className="form-input tabular-numbers" value={openingBalance} onChange={(e) => setOpeningBalance(parseFloat(e.target.value) || 0)} placeholder="0.00" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAddParty(false)}>Cancel</button>
                <button type="submit" className="primary-button">Save Party</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
