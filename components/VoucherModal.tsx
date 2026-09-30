'use client'

import React, { useState, useEffect } from 'react';
import { Party, BankAccount, Sale } from '@/lib/api/types';
import { createVoucher, listSales } from '@/lib/api/services';
import { formatRupee } from '@/lib/format';

interface VoucherModalProps {
  isOpen: boolean;
  kind: 'RECEIPT' | 'PAYMENT';
  onClose: () => void;
  parties: Party[];
  bankAccounts: BankAccount[];
  onVoucherCreated: () => void;
}

export function VoucherModal({ isOpen, kind, onClose, parties, bankAccounts, onVoucherCreated }: VoucherModalProps) {
  const [partyId, setPartyId] = useState(parties[0]?.id || '');
  const [amount, setAmount] = useState(25000);
  const [mode, setMode] = useState<'CASH' | 'BANK'>('BANK');
  const [bankAccountId, setBankAccountId] = useState(bankAccounts[0]?.id || '');
  const [referenceNo, setReferenceNo] = useState('');
  const [openBills, setOpenBills] = useState<Sale[]>([]);
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  // Fetch open bills for the selected party
  useEffect(() => {
    if (partyId && kind === 'RECEIPT') {
      listSales(partyId).then((sales) => {
        const unpaid = sales.filter((s) => s.status !== 'PAID');
        setOpenBills(unpaid);
        // Auto prefill allocation for first unpaid bill
        if (unpaid.length > 0) {
          const first = unpaid[0];
          const out = first.outstanding_amount || first.total_amount;
          setAllocations({ [first.id]: Math.min(amount, out) });
        } else {
          setAllocations({});
        }
      });
    } else {
      setOpenBills([]);
      setAllocations({});
    }
  }, [partyId, kind, amount]);

  if (!isOpen) return null;

  const handleToggleBill = (saleId: string, outstanding: number) => {
    const updated = { ...allocations };
    if (updated[saleId]) {
      delete updated[saleId];
    } else {
      const currentSum = Object.values(updated).reduce((a, b) => a + b, 0);
      const remaining = Math.max(0, amount - currentSum);
      updated[saleId] = Math.min(remaining, outstanding);
    }
    setAllocations(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const allocList = Object.entries(allocations).map(([saleId, allocAmt]) => ({
      sale_id: saleId,
      amount: allocAmt,
    }));

    try {
      await createVoucher({
        kind,
        party_id: partyId,
        mode,
        bank_account_id: mode === 'BANK' ? bankAccountId : undefined,
        amount,
        reference_no: referenceNo,
        allocations: allocList,
      });
      onVoucherCreated();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error recording voucher');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <h3>Record {kind === 'RECEIPT' ? 'Receipt (Inflow)' : 'Payment (Outflow)'}</h3>
            <button type="button" className="close-btn" onClick={onClose}>✕</button>
          </div>

          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Party</label>
                <select className="form-select" value={partyId} onChange={(e) => setPartyId(e.target.value)} required>
                  {parties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  className="form-input tabular-numbers"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Payment Mode</label>
                <select className="form-select" value={mode} onChange={(e) => setMode(e.target.value as any)}>
                  <option value="CASH">Cash in Hand</option>
                  <option value="BANK">Bank Transfer / UPI / Cheque</option>
                </select>
              </div>

              {mode === 'BANK' && (
                <div className="form-group">
                  <label>Bank Account</label>
                  <select className="form-select" value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)} required>
                    {bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Reference No. / UTR / Cheque</label>
                <input className="form-input" placeholder="e.g. UTR123847..." value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} />
              </div>
            </div>

            {/* Bill Allocation Table for Receipts */}
            {kind === 'RECEIPT' && openBills.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#2B2B2B', display: 'block', marginBottom: 6 }}>
                  Allocate Receipt Across Unpaid Invoices
                </label>
                <div style={{ border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
                  <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#FAF6F2', borderBottom: '1px solid var(--line)' }}>
                      <tr>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Settle</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Bill #</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Due Date</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Outstanding</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Allocated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {openBills.map((bill) => {
                        const out = bill.outstanding_amount || bill.total_amount;
                        const isAlloc = !!allocations[bill.id];
                        return (
                          <tr key={bill.id} style={{ borderBottom: '1px solid var(--line)' }}>
                            <td style={{ padding: '8px 12px' }}>
                              <input
                                type="checkbox"
                                checked={isAlloc}
                                onChange={() => handleToggleBill(bill.id, out)}
                              />
                            </td>
                            <td style={{ padding: '8px 12px', fontWeight: 600 }}>#{bill.bill_no}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', color: '#7A7268' }}>{bill.due_date}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right' }} className="tabular-numbers">
                              {formatRupee(out)}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#059669' }} className="tabular-numbers">
                              {isAlloc ? formatRupee(allocations[bill.id]) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={{ background: '#FAF6F2', borderRadius: 8, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 11, color: kind === 'RECEIPT' ? '#059669' : '#DC2626', textTransform: 'uppercase', fontWeight: 700 }}>
                  Ledger Impact
                </span>
                <p style={{ margin: 0, fontSize: 12, color: '#7A7268' }}>
                  {kind === 'RECEIPT' ? 'Reduces party balance (Credit)' : 'Reduces business payable (Debit)'}
                </p>
              </div>
              <strong style={{ font: '22px Georgia', color: '#2B2B2B' }} className="tabular-numbers">
                {formatRupee(amount)}
              </strong>
            </div>

            <p style={{ fontSize: 11, color: '#7A7268', margin: 0 }}>Date and time are recorded automatically.</p>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-button" disabled={loading} style={{ background: kind === 'RECEIPT' ? '#059669' : '#DC2626' }}>
              {loading ? 'Processing...' : `Save ${kind} Voucher`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
