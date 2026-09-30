import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { Party, BankAccount, VoucherType, PaymentMode } from '../../types';
import { formatRupee, formatDate } from '../../lib/formatters';
import {
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Landmark,
  Wallet,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { MoneyInput } from '../../components/ui/MoneyInput';
import { Combobox } from '../../components/ui/Combobox';
import { ServerTimestampNotice } from '../../components/ui/ServerTimestampNotice';
import { PartyQuickAddModal } from '../../components/modals/PartyQuickAddModal';
import confetti from 'canvas-confetti';

interface OpenBillItem {
  id: string;
  bill_no: number | string;
  total_amount: number;
  allocated_amount: number;
  outstanding_amount: number;
  due_date: string;
  type: 'SALE' | 'PURCHASE';
  current_allocation: number;
}

export const NewVoucherPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialType: VoucherType =
    searchParams.get('type') === 'PAYMENT' ? 'PAYMENT' : 'RECEIPT';

  const [voucherType, setVoucherType] = useState<VoucherType>(initialType);
  const [mode, setMode] = useState<PaymentMode>('CASH');
  const [parties, setParties] = useState<Party[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [partyId, setPartyId] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');

  // Open Bills for Allocation
  const [openBills, setOpenBills] = useState<OpenBillItem[]>([]);
  const [isLoadingBills, setIsLoadingBills] = useState(false);

  const [isQuickAddPartyOpen, setIsQuickAddPartyOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [partiesList, banksList] = await Promise.all([
          api.masters.getParties(),
          api.masters.getBankAccounts(),
        ]);
        setParties(partiesList);
        setBankAccounts(banksList);
        if (banksList.length > 0) {
          setBankAccountId(banksList[0].id);
        }
      } catch {
        // Handled silently
      }
    };
    loadMasters();
  }, []);

  // Fetch open bills whenever selected party changes
  useEffect(() => {
    if (!partyId) {
      setOpenBills([]);
      return;
    }

    const fetchBills = async () => {
      setIsLoadingBills(true);
      try {
        const bills = await api.vouchers.getOpenBills(partyId);
        setOpenBills(
          bills.map((b) => ({
            ...b,
            current_allocation: 0,
          }))
        );
      } catch {
        setOpenBills([]);
      } finally {
        setIsLoadingBills(false);
      }
    };
    fetchBills();
  }, [partyId]);

  // Auto-allocate voucher amount against oldest open bills
  const handleAutoAllocate = () => {
    let remaining = amount;
    const updated = openBills.map((b) => {
      if (remaining <= 0) {
        return { ...b, current_allocation: 0 };
      }
      const canAllocate = Math.min(remaining, b.outstanding_amount);
      remaining -= canAllocate;
      return { ...b, current_allocation: canAllocate };
    });
    setOpenBills(updated);
  };

  const handleManualAllocationChange = (index: number, val: number) => {
    setOpenBills((prev) => {
      const next = [...prev];
      next[index].current_allocation = Math.min(val, next[index].outstanding_amount);
      return next;
    });
  };

  const totalAllocated = openBills.reduce((sum, b) => sum + (b.current_allocation || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyId) {
      setError('Please select a party.');
      return;
    }
    if (amount <= 0) {
      setError('Voucher amount must be greater than ₹0.');
      return;
    }
    if (mode === 'BANK' && !bankAccountId) {
      setError('Please select a company bank account for bank transfer/cheque.');
      return;
    }
    if (totalAllocated > amount) {
      setError('Total bill allocation cannot exceed the voucher payment amount.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const allocations = openBills
      .filter((b) => b.current_allocation > 0)
      .map((b) => ({
        sale_id: b.type === 'SALE' ? b.id : undefined,
        purchase_id: b.type === 'PURCHASE' ? b.id : undefined,
        allocated_amount: b.current_allocation,
      }));

    try {
      await api.vouchers.createVoucher({
        party_id: partyId,
        voucher_type: voucherType,
        mode,
        bank_account_id: mode === 'BANK' ? bankAccountId : undefined,
        amount,
        reference_no: referenceNo.trim() || undefined,
        notes: notes.trim() || undefined,
        allocations: allocations.length > 0 ? allocations : undefined,
      });

      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      setSuccess(true);
      setTimeout(() => {
        navigate('/staff/entries');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to record money voucher.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="p-2 rounded-xl text-[#8C857E] hover:text-[#2B2B2B] hover:bg-[#F5EFE6] transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#2B2B2B] flex items-center gap-2">
              {voucherType === 'RECEIPT' ? (
                <ArrowDownLeft className="h-6 w-6 text-emerald-600" />
              ) : (
                <ArrowUpRight className="h-6 w-6 text-rose-600" />
              )}
              {voucherType === 'RECEIPT' ? 'Receipt Voucher (Money In)' : 'Payment Voucher (Money Out)'}
            </h1>
            <p className="text-xs text-[#66615C]">
              Record cash/bank transaction and allocate against open customer/supplier bills
            </p>
          </div>
        </div>
      </div>

      <ServerTimestampNotice />

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Money voucher recorded and ledger updated! Redirecting...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E8DFD5] shadow-soft space-y-5">
          {/* Voucher Type & Mode Switchers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#2B2B2B] uppercase tracking-wider mb-1.5">
                Voucher Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVoucherType('RECEIPT')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition ${
                    voucherType === 'RECEIPT'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-soft'
                      : 'bg-white text-[#66615C] border-[#E8DFD5] hover:bg-[#F5EFE6]'
                  }`}
                >
                  <ArrowDownLeft className="h-4 w-4" />
                  <span>RECEIPT (In)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVoucherType('PAYMENT')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition ${
                    voucherType === 'PAYMENT'
                      ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-soft'
                      : 'bg-white text-[#66615C] border-[#E8DFD5] hover:bg-[#F5EFE6]'
                  }`}
                >
                  <ArrowUpRight className="h-4 w-4" />
                  <span>PAYMENT (Out)</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2B2B2B] uppercase tracking-wider mb-1.5">
                Payment Channel / Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode('CASH')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition ${
                    mode === 'CASH'
                      ? 'bg-[#FAF6EF] text-[#B8893B] border-[#B8893B] shadow-soft'
                      : 'bg-white text-[#66615C] border-[#E8DFD5] hover:bg-[#F5EFE6]'
                  }`}
                >
                  <Wallet className="h-4 w-4" />
                  <span>Cash in Hand</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('BANK')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition ${
                    mode === 'BANK'
                      ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-soft'
                      : 'bg-white text-[#66615C] border-[#E8DFD5] hover:bg-[#F5EFE6]'
                  }`}
                >
                  <Landmark className="h-4 w-4" />
                  <span>Bank Account</span>
                </button>
              </div>
            </div>
          </div>

          {/* Party Selection & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Combobox
              label="Party Name"
              required
              placeholder="Select party..."
              value={partyId}
              onChange={setPartyId}
              options={parties.map((p) => ({
                value: p.id,
                label: p.name,
                subLabel: p.whatsapp_number,
                badge: p.party_type,
              }))}
              onQuickAdd={() => setIsQuickAddPartyOpen(true)}
            />

            <MoneyInput
              label="Total Amount (₹)"
              required
              value={amount}
              onChange={(val) => setAmount(val)}
            />
          </div>

          {/* Bank Account Selection (if mode = BANK) */}
          {mode === 'BANK' && (
            <div className="p-4 rounded-xl bg-[#FAF6EF]/60 border border-[#EBD7BA] space-y-3">
              <label className="block text-xs font-semibold text-[#2B2B2B] uppercase tracking-wider">
                Select Company Bank Account <span className="text-[#9B1C31]">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {bankAccounts.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => setBankAccountId(b.id)}
                    className={`p-3 rounded-xl border cursor-pointer select-none transition ${
                      bankAccountId === b.id
                        ? 'bg-white border-[#B8893B] ring-2 ring-[#B8893B]/20 shadow-soft'
                        : 'bg-white/80 border-[#E8DFD5] hover:border-[#CCA462]'
                    }`}
                  >
                    <div className="text-xs font-bold text-[#2B2B2B]">{b.bank_name}</div>
                    <div className="text-[11px] text-[#66615C]">A/C: {b.account_number}</div>
                    <div className="text-[10px] text-[#8C857E]">IFSC: {b.ifsc_code}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reference & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Reference / Cheque / UTR No"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="e.g. UTR12345678 or Cheque 0045"
            />
            <Input
              label="Narration / Remarks"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Advance payment against order"
            />
          </div>
        </div>

        {/* Bill Allocation Section */}
        {partyId && (
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E8DFD5] shadow-soft space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#F5EFE6]">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#AFA190]">
                  Bill Outstanding & Allocation
                </h2>
                <p className="text-xs text-[#66615C]">
                  Allocate receipt/payment against open bills to mark them PAID and stop reminders
                </p>
              </div>
              {openBills.length > 0 && amount > 0 && (
                <Button
                  type="button"
                  variant="gold"
                  size="sm"
                  onClick={handleAutoAllocate}
                  leftIcon={<Sparkles className="h-4 w-4" />}
                >
                  Auto-Allocate ₹{amount}
                </Button>
              )}
            </div>

            {isLoadingBills ? (
              <div className="p-6 text-center text-xs text-[#8C857E]">
                Checking party open bills...
              </div>
            ) : openBills.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#8C857E] bg-[#FAF6EF]/50 rounded-xl">
                No unpaid or outstanding bills found for this party. The full amount will be credited/debited to party account balance directly.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E8DFD5] text-[#8C857E] uppercase tracking-wider">
                        <th className="py-2">Bill No</th>
                        <th className="py-2">Due Date</th>
                        <th className="py-2 text-right">Bill Total</th>
                        <th className="py-2 text-right">Outstanding</th>
                        <th className="py-2 text-right w-36">Allocate (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F5EFE6]">
                      {openBills.map((bill, idx) => (
                        <tr key={bill.id} className="hover:bg-[#FAF6EF]/50">
                          <td className="py-2.5 font-bold text-[#2B2B2B]">
                            #{bill.bill_no} ({bill.type})
                          </td>
                          <td className="py-2.5 text-[#66615C]">
                            {formatDate(bill.due_date)}
                          </td>
                          <td className="py-2.5 text-right font-medium text-[#2B2B2B] tabular-nums">
                            {formatRupee(bill.total_amount)}
                          </td>
                          <td className="py-2.5 text-right font-bold text-rose-600 tabular-nums">
                            {formatRupee(bill.outstanding_amount)}
                          </td>
                          <td className="py-2.5 text-right">
                            <input
                              type="number"
                              min={0}
                              max={bill.outstanding_amount}
                              step="0.01"
                              value={bill.current_allocation || ''}
                              onChange={(e) =>
                                handleManualAllocationChange(idx, parseFloat(e.target.value) || 0)
                              }
                              placeholder="0.00"
                              className="w-full text-right bg-white border border-[#E8DFD5] rounded-lg px-2 py-1 text-xs font-bold text-[#9B1C31] tabular-nums focus:outline-none focus:ring-1 focus:ring-[#9B1C31]"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center p-3 rounded-xl bg-[#FAF6EF] border border-[#EBD7BA] text-xs">
                  <span className="font-semibold text-[#7E5627]">
                    Total Allocated against Bills:
                  </span>
                  <span className="font-bold text-sm text-[#9B1C31] tabular-nums">
                    {formatRupee(totalAllocated)} / {formatRupee(amount)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            leftIcon={<CheckCircle2 className="h-5 w-5" />}
          >
            Record Voucher
          </Button>
        </div>
      </form>

      <PartyQuickAddModal
        isOpen={isQuickAddPartyOpen}
        onClose={() => setIsQuickAddPartyOpen(false)}
        defaultType="CUSTOMER"
        onSuccess={(newParty) => {
          setParties((prev) => [newParty, ...prev]);
          setPartyId(newParty.id);
        }}
      />
    </div>
  );
};
