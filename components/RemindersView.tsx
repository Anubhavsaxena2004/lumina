'use client'

import React, { useState } from 'react';
import { ReminderSettings } from '@/lib/api/types';
import { updateReminderSettings, triggerDailyReminders } from '@/lib/api/services';

interface RemindersViewProps {
  settings: ReminderSettings;
  onRefresh: () => void;
}

export function RemindersView({ settings, onRefresh }: RemindersViewProps) {
  const [repeatDays, setRepeatDays] = useState(settings.repeat_days || 3);
  const [sendTime, setSendTime] = useState(settings.send_time || '10:00');
  const [ownerPhone, setOwnerPhone] = useState(settings.owner_whatsapp || '+919690000000');
  const [isActive, setIsActive] = useState(settings.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateReminderSettings({
        repeat_days: repeatDays,
        send_time: sendTime,
        owner_whatsapp: ownerPhone,
        is_active: isActive,
      });
      alert('Reminder configuration updated successfully!');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error updating settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    setTesting(true);
    try {
      const res = await triggerDailyReminders();
      setTestResult(res);
    } catch (err: any) {
      alert(err.message || 'Error triggering reminder job');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div>
      <div className="welcome-row">
        <div>
          <h2>Overdue Payment Reminders & Scheduler</h2>
          <p>Automate WhatsApp alerts for unpaid invoices past due date and receive daily consolidated summaries.</p>
        </div>
        <button className="primary-button" onClick={handleSendTest} disabled={testing} style={{ background: '#25D366' }}>
          {testing ? 'Dispatching...' : '📱 Trigger Test Reminder Run'}
        </button>
      </div>

      {testResult && (
        <div style={{ background: '#DEF7EC', border: '1px solid #BCF0DA', borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <strong style={{ color: '#03543F' }}>✓ Daily Run Executed Successfully</strong>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#046C4E' }}>
            Found {testResult.overdueBillsFound} overdue bills. Sent {testResult.customerMessagesSent} customer reminder(s) and 1 consolidated owner summary for ₹{testResult.grandTotalOverdue?.toLocaleString('en-IN')}.
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
        {/* Settings Form */}
        <div className="panel">
          <form onSubmit={handleSave}>
            <h3 style={{ font: '20px Georgia', margin: '0 0 16px' }}>Scheduler Configuration</h3>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label>Reminders Automation Switch</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <input
                  type="checkbox"
                  id="activeSwitch"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                <label htmlFor="activeSwitch" style={{ fontSize: 13, textTransform: 'none', color: '#2B2B2B', cursor: 'pointer' }}>
                  Enable automatic daily WhatsApp payment reminders
                </label>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Repeat Every N Days</label>
                <input
                  type="number"
                  min="1"
                  className="form-input tabular-numbers"
                  value={repeatDays}
                  onChange={(e) => setRepeatDays(parseInt(e.target.value) || 1)}
                  required
                />
                <small style={{ fontSize: 11, color: '#7A7268' }}>Days between repeat reminders per bill</small>
              </div>

              <div className="form-group">
                <label>Daily Schedule Time (IST)</label>
                <input
                  type="time"
                  className="form-input"
                  value={sendTime}
                  onChange={(e) => setSendTime(e.target.value)}
                  required
                />
                <small style={{ fontSize: 11, color: '#7A7268' }}>Asia/Kolkata timezone</small>
              </div>

              <div className="form-group full-width">
                <label>Owner WhatsApp Number (E.164)</label>
                <input
                  className="form-input"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  required
                  placeholder="+919876543210"
                />
                <small style={{ fontSize: 11, color: '#7A7268' }}>Receives the single consolidated daily summary</small>
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? 'Saving...' : 'Save Reminder Settings'}
              </button>
            </div>
          </form>
        </div>

        {/* Live Message Previews */}
        <div className="panel" style={{ background: '#FAF7F4' }}>
          <h3 style={{ font: '20px Georgia', margin: '0 0 12px' }}>Live Message Previews</h3>

          {/* Owner Daily Summary Preview */}
          <div style={{ background: '#FFF', border: '1px solid #E9E0D7', borderRadius: 8, padding: 14, marginBottom: 14 }}>
            <span style={{ fontSize: 10, textTransform: 'uppercase', color: '#9B1C31', fontWeight: 700 }}>
              Owner Combined Daily Summary (1 Per Day)
            </span>
            <p style={{ fontStyle: 'italic', fontSize: 12, color: '#2B2B2B', margin: '8px 0 0', lineHeight: 1.5 }}>
              &quot;Kumkum Payal Daily Summary: You have <strong>3</strong> pending overdue bills totaling <strong>₹4,61,500</strong> across <strong>2</strong> customers as of {new Date().toLocaleDateString('en-GB')}. Check the owner dashboard for individual statements.&quot;
            </p>
          </div>

          {/* Customer Reminder Preview */}
          <div style={{ background: '#FFF', border: '1px solid #E9E0D7', borderRadius: 8, padding: 14 }}>
            <span style={{ fontSize: 10, textTransform: 'uppercase', color: '#B8893B', fontWeight: 700 }}>
              Individual Customer WhatsApp HSM
            </span>
            <p style={{ fontStyle: 'italic', fontSize: 12, color: '#2B2B2B', margin: '8px 0 0', lineHeight: 1.5 }}>
              &quot;Namaste Kohinoor Exports, gentle reminder from Kumkum Payal regarding Invoice #1047 for ₹2,75,000, which was due on 26/09/2026. Kindly arrange the settlement at your earliest convenience.&quot;
            </p>
          </div>

          <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: 8, padding: 12, marginTop: 16, fontSize: 11, color: '#9F1239' }}>
            <strong>Confirmed Client Rules:</strong>
            <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
              <li>No reminders sent before the due date passes.</li>
              <li>Reminders stop automatically when a bill is settled.</li>
              <li>Owner gets exactly ONE combined message per day.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
