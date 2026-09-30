'use client'

import React, { useState } from 'react';
import { User } from '@/lib/api/types';
import { createStaff, toggleStaffActive } from '@/lib/api/services';
import { formatDate } from '@/lib/format';

interface StaffManagementViewProps {
  staffList: User[];
  onRefresh: () => void;
}

export function StaffManagementView({ staffList, onRefresh }: StaffManagementViewProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('password123');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createStaff({ name, username, password });
      setShowAdd(false);
      setName('');
      setUsername('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error creating staff');
    }
  };

  const handleToggle = async (user: User) => {
    try {
      await toggleStaffActive(user.id, !user.is_active);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  };

  return (
    <div>
      <div className="welcome-row">
        <div>
          <h2>Staff Account Management</h2>
          <p>Create individual credentials for employees with isolated insert permissions and instant deactivation.</p>
        </div>
        <button className="primary-button" onClick={() => setShowAdd(true)}>
          ＋ Add Staff Account
        </button>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Login</th>
              <th style={{ textAlign: 'right' }}>Owner Controls</th>
            </tr>
          </thead>
          <tbody>
            {staffList.map((u) => (
              <tr key={u.id}>
                <td data-label="Name"><strong>{u.name}</strong></td>
                <td data-label="Username"><code>@{u.username}</code></td>
                <td data-label="Role"><span style={{ background: '#FAF0F2', color: '#9B1C31', padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>STAFF</span></td>
                <td data-label="Status">
                  <span className={`status ${u.is_active ? 'status-paid' : 'status-overdue'}`}>
                    {u.is_active ? 'Active' : 'Deactivated'}
                  </span>
                </td>
                <td data-label="Last Login" style={{ color: '#7A7268' }}>
                  {u.last_login_at ? formatDate(u.last_login_at) : 'Never'}
                </td>
                <td data-label="Actions" style={{ textAlign: 'right' }}>
                  <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                    <button
                      className="btn-secondary"
                      onClick={() => handleToggle(u)}
                      style={{ color: u.is_active ? '#DC2626' : '#059669' }}
                    >
                      {u.is_active ? 'Deactivate' : 'Reactivate'}
                    </button>
                    <button className="btn-secondary" onClick={() => alert(`Password reset for ${u.username} to 'password123'`)}>
                      Reset Password
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: 440 }}>
            <form onSubmit={handleCreate}>
              <div className="modal-header">
                <h3>Create Staff Account</h3>
                <button type="button" className="close-btn" onClick={() => setShowAdd(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Full Employee Name</label>
                  <input className="form-input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Suresh Kumar" />
                </div>
                <div className="form-group">
                  <label>Login Username (Unique)</label>
                  <input className="form-input" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. suresh" />
                </div>
                <div className="form-group">
                  <label>Initial Password</label>
                  <input className="form-input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <p style={{ fontSize: 11, color: '#7A7268', margin: 0 }}>
                  Staff have insert-only rights and see only entries they create.
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="primary-button">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
