'use client'

import React, { useState } from 'react';
import { Sale } from '@/lib/api/types';
import { formatRupee, formatDate } from '@/lib/format';
import { deleteSale } from '@/lib/api/services';

interface AllEntriesViewProps {
  entries: Sale[];
  onRefresh: () => void;
  onOpenSaleModal: () => void;
}

export function AllEntriesView({ entries, onRefresh, onOpenSaleModal }: AllEntriesViewProps) {
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Sale | null>(null);
  const [viewTarget, setViewTarget] = useState<Sale | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = entries.filter((e) => {
    if (search && !e.party_name?.toLowerCase().includes(search.toLowerCase()) && !e.creator_name?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSale(deleteTarget.id);
      setDeleteTarget(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error deleting entry');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="welcome-row">
        <div>
          <h2>Master Entries Directory</h2>
          <p>Every sale, purchase, and voucher recorded by all staff. Edit and soft-delete capabilities.</p>
        </div>
        <button className="primary-button" onClick={onOpenSaleModal}>
          ＋ Record New Entry
        </button>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Filter by party or staff name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span style={{ fontSize: 12, color: '#7A7268', marginLeft: 'auto' }}>
          Showing {filtered.length} entries
        </span>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Bill #</th>
              <th>Recorded Time</th>
              <th>Party</th>
              <th>Created By</th>
              <th>Due Date</th>
              <th style={{ textAlign: 'right' }}>Total Amount</th>
              <th style={{ textAlign: 'center' }}>Status</th>
              <th style={{ textAlign: 'right' }}>Owner Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id}>
                <td data-label="Bill #"><strong>#{item.bill_no}</strong></td>
                <td data-label="Recorded Time" style={{ color: '#7A7268' }}>{formatDate(item.entry_at)}</td>
                <td data-label="Party"><strong>{item.party_name}</strong></td>
                <td data-label="Created By"><span style={{ background: '#FAF0F2', padding: '2px 8px', borderRadius: 4, fontSize: 11, color: '#9B1C31' }}>{item.creator_name}</span></td>
                <td data-label="Due Date">{item.due_date}</td>
                <td data-label="Total" style={{ textAlign: 'right' }} className="tabular-numbers"><strong>{formatRupee(item.total_amount)}</strong></td>
                <td data-label="Status" style={{ textAlign: 'center' }}>
                  <span className={`status status-${item.status.toLowerCase()}`}>{item.status}</span>
                </td>
                <td data-label="Actions" style={{ textAlign: 'right' }}>
                  <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                    <button className="btn-secondary" onClick={() => setViewTarget(item)}>View</button>
                    <button className="btn-secondary btn-delete" onClick={() => setDeleteTarget(item)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal with Ledger & Stock Reversal Explanation */}
      {deleteTarget && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3 style={{ color: '#DC2626' }}>Confirm Entry Deletion & Reversal</h3>
              <button className="close-btn" onClick={() => setDeleteTarget(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, lineHeight: 1.5, color: '#2B2B2B' }}>
                Are you sure you want to delete Invoice <strong>#{deleteTarget.bill_no}</strong> for <strong>{deleteTarget.party_name}</strong> ({formatRupee(deleteTarget.total_amount)})?
              </p>
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: 14, fontSize: 12, color: '#991B1B' }}>
                <strong>Ledger & Stock Safeguard:</strong>
                <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                  <li>Appends a reversing credit row to customer ledger for {formatRupee(deleteTarget.total_amount)}.</li>
                  <li>Restores physical pieces and weight back into stock register.</li>
                  <li>Writes immutable snapshot into <code>audit_log</code> with before and after state.</li>
                </ul>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="primary-button" style={{ background: '#DC2626' }} onClick={confirmDelete} disabled={deleting}>
                {deleting ? 'Reversing...' : 'Confirm Soft Delete & Reversal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {viewTarget && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3>Invoice #{viewTarget.bill_no} Details</h3>
              <button className="close-btn" onClick={() => setViewTarget(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                <div><span style={{ color: '#7A7268' }}>Customer:</span> <strong>{viewTarget.party_name}</strong></div>
                <div><span style={{ color: '#7A7268' }}>Recorded:</span> <strong>{formatDate(viewTarget.entry_at)}</strong></div>
                <div><span style={{ color: '#7A7268' }}>Created By:</span> <strong>{viewTarget.creator_name}</strong></div>
                <div><span style={{ color: '#7A7268' }}>Due Date:</span> <strong>{viewTarget.due_date}</strong></div>
                <div><span style={{ color: '#7A7268' }}>Status:</span> <strong>{viewTarget.status}</strong></div>
                <div><span style={{ color: '#7A7268' }}>Total Amount:</span> <strong>{formatRupee(viewTarget.total_amount)}</strong></div>
              </div>
              {viewTarget.lines && viewTarget.lines.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <h4 style={{ fontSize: 13, marginBottom: 8 }}>Billed Items</h4>
                  <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#FAF6F2' }}>
                        <th style={{ padding: 6, textAlign: 'left' }}>Item</th>
                        <th style={{ padding: 6, textAlign: 'right' }}>Pcs</th>
                        <th style={{ padding: 6, textAlign: 'right' }}>Weight</th>
                        <th style={{ padding: 6, textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewTarget.lines.map((l, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--line)' }}>
                          <td style={{ padding: 6 }}>{l.item_name || 'Item'}</td>
                          <td style={{ padding: 6, textAlign: 'right' }}>{l.pieces}</td>
                          <td style={{ padding: 6, textAlign: 'right' }}>{l.weight_kg} Kg</td>
                          <td style={{ padding: 6, textAlign: 'right' }}>{formatRupee(l.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setViewTarget(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
