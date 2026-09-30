import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { BankAccount } from '../../types';
import { formatRupee, formatDate, formatDateTime } from '../../lib/formatters';
import { Wallet, Landmark, RefreshCw, Calendar, ArrowDownLeft, ArrowUpRight, Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { MoneyInput } from '../../components/ui/MoneyInput';
import { Skeleton } from '../../components/ui/Skeleton';

export const CashBankBooksPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'CASH' | 'BANK'>('CASH');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedBankId, setSelectedBankId] = useState('');

  const [cashBookData, setCashBookData] = useState<{
    opening_balance: number;
    closing_balance: number;
    entries: any[];
  } | null>(null);

  const [bankBookData, setBankBookData] = useState<{
    bank: BankAccount;
    opening_balance: number;
    closing_balance: number;
    entries: any[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isAddBankModalOpen, setIsAddBankModalOpen] = useState(false);

  // New Bank Form
  const [newBankName, setNewBankName] = useState('');
  const [newAccNum, setNewAccNum] = useState('');
  const [newIfsc, setNewIfsc] = useState('');
  const [newOpeningBal, setNewOpeningBal] = useState<number>(0);
  const [isSavingBank, setIsSavingBank] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [banks, cash] = await Promise.all([
        api.masters.getBankAccounts(),
        api.ledger.getCashBook(),
      ]);
      setBankAccounts(banks);
      setCashBookData(cash);
      if (banks.length > 0 && !selectedBankId) {
        setSelectedBankId(banks[0].id);
      }
    } catch {
      // Silently handled
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadBankBook = async (bankId: string) => {
    if (!bankId) return;
    try {
      const res = await api.ledger.getBankBook(bankId);
      setBankBookData(res);
    } catch {
      // Silently handled
    }
  };

  useEffect(() => {
    if (activeTab === 'BANK' && selectedBankId) {
      loadBankBook(selectedBankId);
    }
  }, [activeTab, selectedBankId]);

  const handleCreateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName.trim() || !newAccNum.trim()) return;

    setIsSavingBank(true);
    try {
      const created = await api.masters.createBankAccount({
        bank_name: newBankName.trim(),
        account_number: newAccNum.trim(),
        ifsc_code: newIfsc.trim().toUpperCase(),
        opening_balance: newOpeningBal,
        is_active: true,
      });
      setIsAddBankModalOpen(false);
      setNewBankName('');
      setNewAccNum('');
      setNewIfsc('');
      setNewOpeningBal(0);
      await loadData();
      setSelectedBankId(created.id);
    } catch (err: any) {
      alert(err.message || 'Failed to add bank account.');
    } finally {
      setIsSavingBank(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#2B2B2B]">
            Cash Book & Bank Books
          </h1>
          <p className="text-xs text-[#66615C]">
            Live running ledger balances for cash in drawer and company bank accounts
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={loadData}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddBankModalOpen(true)}
            leftIcon={<Plus className="h-3.5 w-3.5" />}
          >
            Add Bank Account
          </Button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab('CASH')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'CASH'
              ? 'bg-[#9B1C31] text-white shadow-soft'
              : 'bg-white text-[#66615C] border border-[#E8DFD5] hover:bg-[#FAF6EF]'
          }`}
        >
          <Wallet className="h-4 w-4" />
          <span>Shop Cash Book</span>
        </button>

        <button
          onClick={() => setActiveTab('BANK')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'BANK'
              ? 'bg-[#B8893B] text-white shadow-soft'
              : 'bg-white text-[#66615C] border border-[#E8DFD5] hover:bg-[#FAF6EF]'
          }`}
        >
          <Landmark className="h-4 w-4" />
          <span>Company Bank Books</span>
        </button>
      </div>

      {/* Cash Book View */}
      {activeTab === 'CASH' && cashBookData && (
        <div className="bg-white rounded-2xl border border-[#E8DFD5] shadow-soft overflow-hidden space-y-4">
          <div className="p-5 bg-[#FAF6EF] border-b border-[#EBD7BA] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#2B2B2B]">Physical Cash in Drawer</h2>
                <div className="text-xs text-[#8C857E]">Daily inflows and cash payments</div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-[11px] font-semibold text-[#8C857E] uppercase tracking-wider">
                  Opening Cash
                </div>
                <div className="text-sm font-bold text-[#2B2B2B] tabular-nums">
                  {formatRupee(cashBookData.opening_balance)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-semibold text-[#8C857E] uppercase tracking-wider">
                  Closing Cash Balance
                </div>
                <div className="text-base font-extrabold text-emerald-700 tabular-nums">
                  {formatRupee(cashBookData.closing_balance)}
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto px-4 pb-4">
            {cashBookData.entries.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#8C857E]">
                No cash transactions recorded yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E8DFD5] text-[#8C857E] uppercase tracking-wider">
                    <th className="py-2.5">Date & Time</th>
                    <th className="py-2.5">Voucher #</th>
                    <th className="py-2.5">Party / Narration</th>
                    <th className="py-2.5 text-right text-emerald-700">Receipt In (+)</th>
                    <th className="py-2.5 text-right text-rose-700">Payment Out (-)</th>
                    <th className="py-2.5 text-right">Running Cash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5EFE6]">
                  {cashBookData.entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-[#FAF6EF]/50">
                      <td className="py-3 text-[#2B2B2B] whitespace-nowrap">
                        {formatDateTime(entry.entry_at)}
                      </td>
                      <td className="py-3 font-bold text-[#7E5627]">
                        #{entry.voucher_no || '-'}
                      </td>
                      <td className="py-3 text-[#66615C]">
                        <span className="font-semibold text-[#2B2B2B]">{entry.party_name}</span>
                        {entry.narration && ` (${entry.narration})`}
                      </td>
                      <td className="py-3 text-right font-bold text-emerald-700 tabular-nums">
                        {Number(entry.debit) > 0 ? `+${formatRupee(entry.debit)}` : '-'}
                      </td>
                      <td className="py-3 text-right font-bold text-rose-700 tabular-nums">
                        {Number(entry.credit) > 0 ? `-${formatRupee(entry.credit)}` : '-'}
                      </td>
                      <td className="py-3 text-right font-bold text-[#2B2B2B] tabular-nums whitespace-nowrap">
                        {formatRupee(entry.running_balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Bank Book View */}
      {activeTab === 'BANK' && (
        <div className="space-y-4">
          {/* Bank Account Switcher Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {bankAccounts.map((b) => (
              <div
                key={b.id}
                onClick={() => setSelectedBankId(b.id)}
                className={`p-4 rounded-2xl border cursor-pointer select-none transition ${
                  selectedBankId === b.id
                    ? 'bg-white border-[#B8893B] ring-2 ring-[#B8893B]/20 shadow-soft'
                    : 'bg-white/80 border-[#E8DFD5] hover:border-[#CCA462]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#2B2B2B]">{b.bank_name}</span>
                  <Landmark className="h-4 w-4 text-[#B8893B]" />
                </div>
                <div className="text-[11px] text-[#8C857E]">A/C: {b.account_number}</div>
                <div className="text-[10px] text-[#AFA190]">IFSC: {b.ifsc_code}</div>
              </div>
            ))}
          </div>

          {/* Selected Bank Ledger */}
          {bankBookData && (
            <div className="bg-white rounded-2xl border border-[#E8DFD5] shadow-soft overflow-hidden space-y-4">
              <div className="p-5 bg-[#FAF6EF] border-b border-[#EBD7BA] flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#2B2B2B]">
                    {bankBookData.bank.bank_name} &bull; {bankBookData.bank.account_number}
                  </h2>
                  <div className="text-xs text-[#8C857E]">
                    IFSC: {bankBookData.bank.ifsc_code}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-semibold text-[#8C857E] uppercase tracking-wider">
                    Live Bank Balance
                  </div>
                  <div className="text-lg font-extrabold text-[#2B2B2B] tabular-nums">
                    {formatRupee(bankBookData.closing_balance)}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto px-4 pb-4">
                {bankBookData.entries.length === 0 ? (
                  <div className="p-12 text-center text-xs text-[#8C857E]">
                    No transactions recorded for this bank account yet.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E8DFD5] text-[#8C857E] uppercase tracking-wider">
                        <th className="py-2.5">Date & Time</th>
                        <th className="py-2.5">Party / Reference</th>
                        <th className="py-2.5 text-right text-emerald-700">Credit / In (+)</th>
                        <th className="py-2.5 text-right text-rose-700">Debit / Out (-)</th>
                        <th className="py-2.5 text-right">Running Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F5EFE6]">
                      {bankBookData.entries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-[#FAF6EF]/50">
                          <td className="py-3 text-[#2B2B2B] whitespace-nowrap">
                            {formatDateTime(entry.entry_at)}
                          </td>
                          <td className="py-3 text-[#66615C]">
                            <span className="font-semibold text-[#2B2B2B]">{entry.party_name}</span>
                            {entry.reference_no && ` • Ref: ${entry.reference_no}`}
                          </td>
                          <td className="py-3 text-right font-bold text-emerald-700 tabular-nums">
                            {Number(entry.debit) > 0 ? `+${formatRupee(entry.debit)}` : '-'}
                          </td>
                          <td className="py-3 text-right font-bold text-rose-700 tabular-nums">
                            {Number(entry.credit) > 0 ? `-${formatRupee(entry.credit)}` : '-'}
                          </td>
                          <td className="py-3 text-right font-bold text-[#2B2B2B] tabular-nums whitespace-nowrap">
                            {formatRupee(entry.running_balance)}
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
      )}

      {/* Add Bank Modal */}
      {isAddBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E8DFD5] space-y-4">
            <h3 className="text-base font-bold text-[#2B2B2B]">Add Company Bank Account</h3>
            <form onSubmit={handleCreateBank} className="space-y-4">
              <Input
                label="Bank Name"
                required
                value={newBankName}
                onChange={(e) => setNewBankName(e.target.value)}
                placeholder="e.g. HDFC Bank"
                autoFocus
              />
              <Input
                label="Account Number"
                required
                value={newAccNum}
                onChange={(e) => setNewAccNum(e.target.value)}
                placeholder="e.g. 5010023456789"
              />
              <Input
                label="IFSC Code"
                value={newIfsc}
                onChange={(e) => setNewIfsc(e.target.value.toUpperCase())}
                placeholder="e.g. HDFC0001234"
              />
              <MoneyInput
                label="Opening Balance (₹)"
                value={newOpeningBal}
                onChange={setNewOpeningBal}
              />
              <div className="flex justify-end gap-2.5 pt-3">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setIsAddBankModalOpen(false)}
                  disabled={isSavingBank}
                >
                  Cancel
                </Button>
                <Button variant="primary" type="submit" isLoading={isSavingBank}>
                  Save Bank Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
