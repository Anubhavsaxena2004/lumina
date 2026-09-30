'use client'

import React, { useState } from 'react';
import { Sale } from '@/lib/api/types';
import { formatRupee, formatDate } from '@/lib/format';

interface MyEntriesViewProps {
  entries: Sale[];
  onOpenSaleModal: () => void;
}

export function MyEntriesView({ entries, onOpenSaleModal }: MyEntriesViewProps) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const statusClass: Record<string, string> = {
    OPEN: 'status-open',
    PARTIAL: 'status-partial',
    PAID: 'status-paid',
    OVERDUE: 'status-overdue',
  };

  const filtered = entries.filter((e) => {
    if (statusFilter !== 'ALL' && e.status !== statusFilter) return false;
    if (search && !e.party_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="welcome-row">
        <div>
          <h2>My Entries</h2>
          <p>Review all transactions created by your staff login. Edit and delete are restricted to Owner.</p>
        </div>
        <button className="primary-button" onClick={onOpenSaleModal}>
          ＋ New Entry
        </button>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Search by party name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="form-select"
          style={{ width: 160 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="PARTIAL">Partial</option>
          <option value="PAID">Paid</option>
          <option value="OVERDUE">Overdue</option>
        </select>
      </div>

      {/* Table & Mobile Cards */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Bill #</th>
              <th>Date & Time</th>
              <th>Customer / Party</th>
              <th>Due Date</th>
              <th style={{ textAlign: 'right' }}>Total Amount</th>
              <th style={{ textAlign: 'right' }}>Outstanding</th>
              <th style={{ textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((item) => {
                const isOverdue = item.status !== 'PAID' && new Date(item.due_date) < new Date();
                const daysOverdue = isOverdue
                  ? Math.floor((new Date().getTime() - new Date(item.due_date).getTime()) / (1000 * 3600 * 24))
                  : 0;

                return (
                  <tr key={item.id}>
                    <td data-label="Bill #">
                      <strong>#{item.bill_no}</strong>
                    </td>
                    <td data-label="Recorded Time" style={{ color: '#7A7268' }}>
                      {formatDate(item.entry_at)}
                    </td>
                    <td data-label="Party">
                      <strong>{item.party_name}</strong>
                    </td>
                    <td data-label="Due Date">
                      {item.due_date}
                    </td>
                    <td data-label="Total Amount" style={{ textAlign: 'right' }} className="tabular-numbers">
                      {formatRupee(item.total_amount)}
                    </td>
                    <td data-label="Outstanding" style={{ textAlign: 'right', fontWeight: 600 }} className="tabular-numbers">
                      {formatRupee(item.outstanding_amount || item.total_amount)}
                    </td>
                    <td data-label="Status" style={{ textAlign: 'center' }}>
                      {isOverdue ? (
                        <span className="status status-overdue">
                          Overdue ({daysOverdue}d)
                        </span>
                      ) : (
                        <span className={`status ${statusClass[item.status] || 'status-open'}`}>
                          {item.status}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px 0', color: '#7A7268' }}>
                  No entries found matching filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="auto-note">
        Staff Isolation Policy active: you can view only records stamped with your credentials.
      </p>
    </div>
  );
}
