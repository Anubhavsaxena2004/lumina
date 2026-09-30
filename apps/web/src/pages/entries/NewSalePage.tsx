import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { Party, Item, Sale } from '../../types';
import { formatRupee, formatWeightKg, parseWeightToNumber, parseRupeeToNumber } from '../../lib/formatters';
import {
  ShoppingBag,
  Plus,
  Trash2,
  Calendar,
  Send,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { MoneyInput } from '../../components/ui/MoneyInput';
import { WeightInput } from '../../components/ui/WeightInput';
import { Combobox } from '../../components/ui/Combobox';
import { ServerTimestampNotice } from '../../components/ui/ServerTimestampNotice';
import { PartyQuickAddModal } from '../../components/modals/PartyQuickAddModal';
import { BillPreviewModal } from '../../components/modals/BillPreviewModal';
import confetti from 'canvas-confetti';

interface SaleFormLine {
  item_id: string;
  pieces: number;
  weight_kg: number;
  rate_per_kg: number;
  amount: number;
}

export const NewSalePage: React.FC = () => {
  const navigate = useNavigate();

  // Masters
  const [parties, setParties] = useState<Party[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [isQuickAddPartyOpen, setIsQuickAddPartyOpen] = useState(false);

  // Form State
  const [partyId, setPartyId] = useState('');
  // Default due date: +7 days from today in YYYY-MM-DD format
  const defaultDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [lines, setLines] = useState<SaleFormLine[]>([
    { item_id: '', pieces: 1, weight_kg: 0, rate_per_kg: 0, amount: 0 },
  ]);
  const [addAnother, setAddAnother] = useState(false);

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSale, setSavedSale] = useState<Sale | null>(null);

  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [partiesList, itemsList] = await Promise.all([
          api.masters.getParties(),
          api.masters.getItems(),
        ]);
        setParties(partiesList);
        setItems(itemsList);
      } catch {
        // Silently handled
      }
    };
    loadMasters();
  }, []);

  // Update line row and compute amount = weight_kg * rate_per_kg
  const updateLine = (index: number, updates: Partial<SaleFormLine>) => {
    setLines((prev) => {
      const next = [...prev];
      const updated = { ...next[index], ...updates };

      // If item changed, auto-fill default rate
      if (updates.item_id !== undefined && updates.item_id !== next[index].item_id) {
        const selectedItem = items.find((i) => i.id === updates.item_id);
        if (selectedItem && selectedItem.default_rate_per_kg) {
          updated.rate_per_kg = Number(selectedItem.default_rate_per_kg);
        }
      }

      // Compute amount based on weight * rate
      const weight = updated.weight_kg || 0;
      const rate = updated.rate_per_kg || 0;
      updated.amount = Math.round(weight * rate * 100) / 100;

      next[index] = updated;
      return next;
    });
  };

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      { item_id: '', pieces: 1, weight_kg: 0, rate_per_kg: 0, amount: 0 },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const totalBillAmount = lines.reduce((sum, line) => sum + (line.amount || 0), 0);
  const totalWeightKg = lines.reduce((sum, line) => sum + (line.weight_kg || 0), 0);
  const totalPieces = lines.reduce((sum, line) => sum + (line.pieces || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyId) {
      setError('Please select or quick-add a customer party.');
      return;
    }
    if (!dueDate) {
      setError('Due date is mandatory.');
      return;
    }
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.item_id) {
        setError(`Please select an ornament item for line row #${i + 1}`);
        return;
      }
      if (line.weight_kg <= 0) {
        setError(`Weight must be greater than 0.000 Kg for line row #${i + 1}`);
        return;
      }
      if (line.rate_per_kg <= 0) {
        setError(`Rate must be greater than ₹0 for line row #${i + 1}`);
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const sale = await api.sales.createSale({
        party_id: partyId,
        due_date: dueDate,
        lines: lines.map((l) => ({
          item_id: l.item_id,
          pieces: Number(l.pieces),
          weight_kg: Number(l.weight_kg),
          rate_per_kg: Number(l.rate_per_kg),
        })),
      });

      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      setSavedSale(sale);

      if (addAnother) {
        // Reset form for next sale
        setLines([{ item_id: '', pieces: 1, weight_kg: 0, rate_per_kg: 0, amount: 0 }]);
        setPartyId('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save sale. Please check values.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
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
              <ShoppingBag className="h-6 w-6 text-[#9B1C31]" />
              New Sale Invoice
            </h1>
            <p className="text-xs text-[#66615C]">
              Record wholesale / retail ornament sale with automatic stock deduction
            </p>
          </div>
        </div>
      </div>

      {/* Mandatory Server Date/Time Invariant Notice */}
      <ServerTimestampNotice />

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Sale Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer & Due Date Card */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E8DFD5] shadow-soft space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#AFA190]">
            1. Customer Details & Due Date
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Combobox
              label="Customer Party"
              required
              placeholder="Search or select customer..."
              value={partyId}
              onChange={setPartyId}
              options={parties.map((p) => ({
                value: p.id,
                label: p.name,
                subLabel: p.whatsapp_number,
                badge: p.party_type,
              }))}
              onQuickAdd={() => setIsQuickAddPartyOpen(true)}
              quickAddLabel="+ Quick Add Customer"
            />

            <div>
              <label className="block text-xs font-semibold text-[#2B2B2B] uppercase tracking-wider mb-1.5">
                Payment Due Date <span className="text-[#9B1C31]">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-white border border-[#E8DFD5] text-[#2B2B2B] text-sm font-medium rounded-xl min-h-[44px] px-3.5 focus:outline-none focus:ring-2 focus:ring-[#9B1C31]/20 focus:border-[#9B1C31]"
                />
              </div>
              <p className="mt-1 text-[11px] text-[#8C857E]">
                Payment reminder scheduler evaluates this date.
              </p>
            </div>
          </div>
        </div>

        {/* Itemized Lines Card */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E8DFD5] shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#F5EFE6]">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#AFA190]">
                2. Jewellery Item Lines
              </h2>
              <p className="text-xs text-[#66615C]">
                Weight is recorded strictly in Kg with 3 decimals (12,3)
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addLine}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Add Row
            </Button>
          </div>

          <div className="space-y-4">
            {lines.map((line, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-[#FAF6EF]/50 border border-[#E8DFD5] space-y-3 relative group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-[#8C857E]">
                  <span>Item Line #{idx + 1}</span>
                  {lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLine(idx)}
                      className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                      title="Remove Row"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-4">
                    <Combobox
                      label="Jewellery Item"
                      required
                      placeholder="Select item..."
                      value={line.item_id}
                      onChange={(val) => updateLine(idx, { item_id: val })}
                      options={items.map((it) => ({
                        value: it.id,
                        label: it.name,
                        subLabel: `Default: ₹${it.default_rate_per_kg}/Kg`,
                        badge: it.hsn_code ? `HSN ${it.hsn_code}` : undefined,
                      }))}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Input
                      label="Pieces"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      required
                      value={line.pieces}
                      onChange={(e) => updateLine(idx, { pieces: parseInt(e.target.value) || 1 })}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <WeightInput
                      label="Weight (Kg)"
                      required
                      value={line.weight_kg}
                      onChange={(val) => updateLine(idx, { weight_kg: val })}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <MoneyInput
                      label="Rate / Kg"
                      required
                      value={line.rate_per_kg}
                      onChange={(val) => updateLine(idx, { rate_per_kg: val })}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-[#8C857E] uppercase tracking-wider mb-1.5">
                      Line Total
                    </label>
                    <div className="min-h-[44px] px-3 flex items-center bg-[#FAF6EF] border border-[#EBD7BA] rounded-xl text-sm font-bold text-[#9B1C31] tabular-nums">
                      {formatRupee(line.amount)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Grand Totals Bar */}
          <div className="p-4 rounded-xl bg-[#FAF6EF] border border-[#EBD7BA] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-xs text-[#66615C]">
              <div>
                Total Pieces:{' '}
                <span className="font-bold text-[#2B2B2B] text-sm">{totalPieces}</span>
              </div>
              <div>
                Total Weight:{' '}
                <span className="font-bold text-[#B8893B] text-sm tabular-nums">
                  {formatWeightKg(totalWeightKg)}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8C857E] mr-2">
                Grand Total:
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-[#9B1C31] tabular-nums">
                {formatRupee(totalBillAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions & Shortcut */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={addAnother}
              onChange={(e) => setAddAnother(e.target.checked)}
              className="h-4 w-4 rounded border-[#E8DFD5] text-[#9B1C31] focus:ring-[#9B1C31]"
            />
            <span className="text-xs font-semibold text-[#66615C]">
              Keep form open & Add another sale immediately
            </span>
          </label>

          <div className="flex items-center gap-3">
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
              Save Sale & Generate Bill
            </Button>
          </div>
        </div>
      </form>

      {/* Quick Add Party Modal */}
      <PartyQuickAddModal
        isOpen={isQuickAddPartyOpen}
        onClose={() => setIsQuickAddPartyOpen(false)}
        defaultType="CUSTOMER"
        onSuccess={(newParty) => {
          setParties((prev) => [newParty, ...prev]);
          setPartyId(newParty.id);
        }}
      />

      {/* Saved Bill Preview & WhatsApp Delivery Modal */}
      {savedSale && (
        <BillPreviewModal
          isOpen={!!savedSale}
          onClose={() => {
            setSavedSale(null);
            if (!addAnother) {
              navigate('/staff/entries');
            }
          }}
          sale={savedSale}
        />
      )}
    </div>
  );
};
