import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { ReminderSettings } from '../../types';
import { BellRing, Send, CheckCircle2, AlertCircle, Clock, ShieldCheck, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const ReminderSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [repeatDays, setRepeatDays] = useState<number>(3);
  const [sendTimeUtc, setSendTimeUtc] = useState<string>('04:00:00');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [language, setLanguage] = useState<string>('en_IN');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const data = await api.reminders.getSettings();
      setSettings(data);
      setRepeatDays(data.repeat_days || 3);
      setSendTimeUtc(data.send_time_utc || '04:00:00');
      setIsActive(data.is_active !== undefined ? data.is_active : true);
      setLanguage(data.language || 'en_IN');
    } catch {
      // Silently handled
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const updated = await api.reminders.updateSettings({
        repeat_days: Number(repeatDays),
        send_time_utc: sendTimeUtc,
        is_active: isActive,
        language,
      });
      setSettings(updated);
      setStatusMessage('Settings updated successfully!');
    } catch (err: any) {
      setStatusMessage(`Error saving settings: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestDispatch = async () => {
    setIsTesting(true);
    setStatusMessage(null);
    try {
      const res = await api.reminders.triggerReminders(false);
      setStatusMessage(
        `Dispatched test reminder batch: ${res.reminders_sent} customer WhatsApp messages sent. Consolidated summary sent to Owner WhatsApp.`
      );
    } catch (err: any) {
      setStatusMessage(`Error during test dispatch: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#2B2B2B] flex items-center gap-2">
            <BellRing className="h-6 w-6 text-[#9B1C31]" />
            WhatsApp Dues Reminder Automation
          </h1>
          <p className="text-xs text-[#66615C]">
            Configure automated daily overdue payment reminders & owner consolidated summary
          </p>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-xl bg-[#FAF6EF] border border-[#EBD7BA] text-xs font-semibold text-[#7E5627] flex items-center justify-between">
          <span>{statusMessage}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs text-[#8C857E] hover:text-[#2B2B2B]"
          >
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E8DFD5] shadow-soft space-y-5">
        {/* Active Toggle Switch */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-[#FAF6EF]/60 border border-[#EBD7BA]">
          <div>
            <div className="text-sm font-bold text-[#2B2B2B]">Automated Daily Scheduler</div>
            <div className="text-xs text-[#66615C]">
              When enabled, runs daily at the specified time to remind delinquent customers
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[#E8DFD5] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#E8DFD5] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9B1C31]" />
          </label>
        </div>

        {/* Repeat Days Input */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Repeat Throttle (Days)"
            type="number"
            min={1}
            max={30}
            required
            value={repeatDays}
            onChange={(e) => setRepeatDays(parseInt(e.target.value) || 3)}
            helperText="Minimum days to wait before re-sending reminder for the same unpaid bill."
          />

          <div>
            <label className="block text-xs font-semibold text-[#2B2B2B] uppercase tracking-wider mb-1.5">
              Send Time (UTC)
            </label>
            <input
              type="time"
              step={1}
              required
              value={sendTimeUtc}
              onChange={(e) => setSendTimeUtc(e.target.value)}
              className="w-full bg-white border border-[#E8DFD5] text-[#2B2B2B] text-sm font-medium rounded-xl min-h-[44px] px-3.5 focus:outline-none focus:ring-2 focus:ring-[#9B1C31]/20 focus:border-[#9B1C31]"
            />
            <p className="mt-1 text-[11px] text-[#8C857E]">
              Default 04:00:00 UTC corresponds to 09:30 AM IST.
            </p>
          </div>
        </div>

        {/* Language Selection */}
        <div>
          <label className="block text-xs font-semibold text-[#2B2B2B] uppercase tracking-wider mb-1.5">
            Template Language & Tone
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setLanguage('en_IN')}
              className={`p-3 rounded-xl border text-xs font-bold transition ${
                language === 'en_IN'
                  ? 'bg-[#FAF6EF] text-[#B8893B] border-[#B8893B]'
                  : 'bg-white text-[#66615C] border-[#E8DFD5]'
              }`}
            >
              English (India)
            </button>
            <button
              type="button"
              onClick={() => setLanguage('hi_IN')}
              className={`p-3 rounded-xl border text-xs font-bold transition ${
                language === 'hi_IN'
                  ? 'bg-[#FAF6EF] text-[#B8893B] border-[#B8893B]'
                  : 'bg-white text-[#66615C] border-[#E8DFD5]'
              }`}
            >
              Hindi / Hinglish
            </button>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-[#F5EFE6]">
          <Button
            type="button"
            variant="gold"
            size="md"
            onClick={handleTestDispatch}
            isLoading={isTesting}
            leftIcon={<Send className="h-4 w-4" />}
          >
            Send Test Run Now
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSaving}
            leftIcon={<CheckCircle2 className="h-4 w-4" />}
          >
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
