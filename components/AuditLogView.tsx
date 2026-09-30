'use client'

import React, { useState } from 'react';
import { AuditLogRow } from '@/lib/api/types';
import { formatDate } from '@/lib/format';

interface AuditLogViewProps {
  logs: AuditLogRow[];
}

export function AuditLogView({ logs }: AuditLogViewProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div>
      <div className="welcome-row">
        <div>
          <h2>Append-Only Security Audit Trail</h2>
          <p>Every administrative modification, soft-delete, and reversal is stamped with before & after state diffs.</p>
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Table</th>
              <th>Record ID</th>
              <th style={{ textAlign: 'right' }}>State Diff</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              const isExpanded = expandedId === log.id;
              return (
                <React.Fragment key={log.id}>
                  <tr>
                    <td data-label="Timestamp" style={{ color: '#7A7268' }}>{formatDate(log.at)}</td>
                    <td data-label="Actor"><strong>{log.actor_name || 'Owner'}</strong></td>
                    <td data-label="Action">
                      <span style={{ background: '#FAF0F2', color: '#9B1C31', padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                        {log.action}
                      </span>
                    </td>
                    <td data-label="Table"><code>{log.table_name}</code></td>
                    <td data-label="Record ID" style={{ color: '#7A7268', fontSize: 11 }}>{log.record_id}</td>
                    <td data-label="Inspect" style={{ textAlign: 'right' }}>
                      <button className="btn-secondary" onClick={() => toggleExpand(log.id)}>
                        {isExpanded ? 'Hide Diff ▲' : 'View JSON Diff ▼'}
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={6} style={{ background: '#FBF7F2', padding: 16 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 12 }}>
                          <div>
                            <strong style={{ color: '#DC2626' }}>Before State:</strong>
                            <pre style={{ background: '#FFF', padding: 12, borderRadius: 6, border: '1px solid #E9E0D7', overflowX: 'auto', marginTop: 6 }}>
                              {log.before_data ? JSON.stringify(log.before_data, null, 2) : 'null (Created)'}
                            </pre>
                          </div>
                          <div>
                            <strong style={{ color: '#059669' }}>After State:</strong>
                            <pre style={{ background: '#FFF', padding: 12, borderRadius: 6, border: '1px solid #E9E0D7', overflowX: 'auto', marginTop: 6 }}>
                              {log.after_data ? JSON.stringify(log.after_data, null, 2) : 'null (Deleted)'}
                            </pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="auto-note">
        Database triggers block UPDATE and DELETE on audit_log. History cannot be altered.
      </p>
    </div>
  );
}
