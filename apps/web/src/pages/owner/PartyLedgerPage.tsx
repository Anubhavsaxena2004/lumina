import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Party, LedgerEntry } from '../../types';
import { formatRupee, formatDate, formatDateTime } from '../../lib/formatters';
import { BookOpen, Search, Calendar, Download, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Combobox } from '../../components/ui/Combobox';
import { Skeleton } from '../../components/ui/Skeleton';

export const PartyLedgerPage: React.FC = () => {
  const [parties, setParties] = useState<Party[]>([]);
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [statement, setStatement] = useState<{
    party: Party;
    opening_balance: number;
    opening_balance_type: 'DEBIT' | 'CREDIT';
    closing_balance: number;
    closing_balance_type: 'DEBIT' | 'CREDIT';
    entries: LedgerEntry[];
  } | null>(null);

  const [isLoadingParties, setIsLoadingParties] = useState(true);
  const [isLoadingStatement, setIsLoadingStatement] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadParties = async () => {
      try {
        const list = await api.masters.getParties();
        setParties(list);
        if (list.length > 0) {
          setSelectedPartyId(list[0].id);
        }
      } catch {
        // Silently handled
      } finally {
        setIsLoadingParties(false);
      }
    };
    loadParties();
  }, []);

  const fetchStatement = async () => {
    if (!selectedPartyId) return;
    setIsLoadingStatement(true);
    setError(null);
    try {
      const res = await api.ledger.getPartyStatement(selectedPartyId, fromDate || undefined, toDate || undefined);
      setStatement(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load ledger statement.');
    } finally {
      setIsLoadingStatement(false);
    }
  };

  useEffect(() => {
    if (selectedPartyId) {
      fetchStatement();
    }
  }, [selectedPartyId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#2B2B2B] flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-[#9B1C31]" />
            Party Ledger Statement
          </h1>
          <p className="text-xs text-[#66615C]">
            Double-entry running balance statement with combined customer & supplier transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchStatement}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh Statement
          </Button>
        </div>
      </div>

      {/* Party & Date Filter Card */}
      <div className="bg-white rounded-2xl p-5 border border-[#E8DFD5] shadow-soft space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Combobox
            label="Select Party Account"
            placeholder="Search party by name..."
            value={selectedPartyId}
            onChange={setSelectedPartyId}
            options={parties.map((p) => ({
              value: p.id,
              label: p.name,
              subLabel: p.whatsapp_number,
              badge: p.party_type,
            }))}
          />

          <div>
            <label className="block text-xs font-semibold text-[#2B2B2B] uppercase tracking-wider mb-1.5">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full bg-[#FAF6EF] border border-[#E8DFD5] text-xs font-medium rounded-xl min-h-[44px] px-3.5 focus:outline-none focus:ring-1 focus:ring-[#9B1C31]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2B2B2B] uppercase tracking-wider mb-1.5">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full bg-[#FAF6EF] border border-[#E8DFD5] text-xs font-medium rounded-xl min-h-[44px] px-3.5 focus:outline-none focus:ring-1 focus:ring-[#9B1C31]"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <Button variant="primary" size="sm" onClick={fetchStatement}>
            Filter Statement
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Statement Card */}
      {statement && (
        <div className="bg-white rounded-2xl border border-[#E8DFD5] shadow-soft overflow-hidden space-y-4">
          {/* Party Account Summary Banner */}
          <div className="p-5 sm:p-6 bg-[#FAF6EF] border-b border-[#EBD7BA] flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-[#2B2B2B]">{statement.party.name}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white border border-[#E8DFD5] text-[#B8893B]">
                  {statement.party.party_type}
                </span>
              </div>
              <div className="text-xs text-[#66615C] mt-1">
                WhatsApp: {statement.party.whatsapp_number || 'None'}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-[11px] font-semibold text-[#8C857E] uppercase tracking-wider">
                  Opening Balance
                </div>
                <div className="text-sm font-bold text-[#2B2B2B] tabular-nums">
                  {formatRupee(statement.opening_balance)} {statement.opening_balance_type}
                </div>
              </div>

              <div className="text-right">
                <div className="text-[11px] font-semibold text-[#8C857E] uppercase tracking-wider">
                  Net Closing Balance
                </div>
                <div
                  className={`text-base font-extrabold tabular-nums ${
                    statement.closing_balance_type === 'DEBIT'
                      ? 'text-[#9B1C31]'
                      : 'text-emerald-700'
                  }`}
                >
                  {formatRupee(statement.closing_balance)} {statement.closing_balance_type}
                </div>
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto px-4 pb-4">
            {isLoadingStatement ? (
              <div className="p-8 space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : statement.entries.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#8C857E]">
                No transactional ledger activity in the selected date range.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E8DFD5] text-[#8C857E] uppercase tracking-wider">
                    <th className="py-2.5">Date & Time</th>
                    <th className="py-2.5">Entry Type</th>
                    <th className="py-2.5">Narration / Particulars</th>
                    <th className="py-2.5 text-right text-rose-700">Debit (₹)</th>
                    <th className="py-2.5 text-right text-emerald-700">Credit (₹)</th>
                    <th className="py-2.5 text-right">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5EFE6]">
                  {statement.entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-[#FAF6EF]/50">
                      <td className="py-3 font-medium text-[#2B2B2B] whitespace-nowrap">
                        {formatDateTime(entry.entry_at)}
                      </td>
                      <td className="py-3 font-semibold text-[#7E5627]">
                        {entry.entry_type}
                      </td>
                      <td className="py-3 text-[#66615C] max-w-xs truncate">
                        {entry.narration || '-'}
                      </td>
                      <td className="py-3 text-right font-bold text-rose-700 tabular-nums">
                        {Number(entry.debit) > 0 ? formatRupee(entry.debit) : '-'}
                      </td>
                      <td className="py-3 text-right font-bold text-emerald-700 tabular-nums">
                        {Number(entry.credit) > 0 ? formatRupee(entry.credit) : '-'}
                      </td>
                      <td className="py-3 text-right font-bold text-[#2B2B2B] tabular-nums whitespace-nowrap">
                        {formatRupee(entry.running_balance)} {entry.balance_type || ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
