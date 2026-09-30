import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { Party, JobWorkType, JobWorkDirection } from '../../types';
import { formatRupee, formatWeightKg } from '../../lib/formatters';
import { Sparkles, Flame, ArrowLeft, CheckCircle2, AlertCircle, ArrowDown, ArrowUp } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { MoneyInput } from '../../components/ui/MoneyInput';
import { WeightInput } from '../../components/ui/WeightInput';
import { Combobox } from '../../components/ui/Combobox';
import { ServerTimestampNotice } from '../../components/ui/ServerTimestampNotice';
import { PartyQuickAddModal } from '../../components/modals/PartyQuickAddModal';
import confetti from 'canvas-confetti';

export const NewJobWorkPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialType: JobWorkType =
    searchParams.get('type') === 'MEENA' ? 'MEENA' : 'POLISH';

  const [entryType, setEntryType] = useState<JobWorkType>(initialType);
  const [direction, setDirection] = useState<JobWorkDirection>('ISSUE');
  const [parties, setParties] = useState<Party[]>([]);
  const [partyId, setPartyId] = useState('');
  const [weightKg, setWeightKg] = useState<number>(0);
  const [chargeAmount, setChargeAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  const [isQuickAddPartyOpen, setIsQuickAddPartyOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadParties = async () => {
      try {
        const list = await api.masters.getParties();
        setParties(list);
      } catch {
        // Silently handled
      }
    };
    loadParties();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyId) {
      setError('Please select or quick-add an artisan party.');
      return;
    }
    if (weightKg <= 0) {
      setError('Job work weight must be greater than 0.000 Kg.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.jobWork.createEntry({
        entry_type: entryType,
        direction,
        party_id: partyId,
        weight_kg: weightKg,
        charge_amount: chargeAmount || 0,
        notes: notes.trim() || undefined,
      });

      confetti({ particleCount: 40, spread: 50, origin: { y: 0.8 } });
      setSuccess(true);
      setTimeout(() => {
        navigate('/staff/entries');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to record job work entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
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
              {entryType === 'POLISH' ? (
                <Sparkles className="h-6 w-6 text-[#B8893B]" />
              ) : (
                <Flame className="h-6 w-6 text-cyan-600" />
              )}
              {entryType === 'POLISH' ? 'Polish' : 'Meena (Enamel)'} Job Work
            </h1>
            <p className="text-xs text-[#66615C]">
              Record gold/silver ornament issue or receive with artisan party
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
          <span>Job work entry recorded successfully! Redirecting...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E8DFD5] shadow-soft space-y-5">
        {/* Entry Type Switcher */}
        <div>
          <label className="block text-xs font-semibold text-[#2B2B2B] uppercase tracking-wider mb-2">
            Work Category
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setEntryType('POLISH')}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-bold transition ${
                entryType === 'POLISH'
                  ? 'bg-[#FAF6EF] text-[#B8893B] border-[#B8893B] shadow-soft'
                  : 'bg-white text-[#66615C] border-[#E8DFD5] hover:bg-[#F5EFE6]'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>Polish Job Work</span>
            </button>
            <button
              type="button"
              onClick={() => setEntryType('MEENA')}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-bold transition ${
                entryType === 'MEENA'
                  ? 'bg-cyan-50 text-cyan-700 border-cyan-300 shadow-soft'
                  : 'bg-white text-[#66615C] border-[#E8DFD5] hover:bg-[#F5EFE6]'
              }`}
            >
              <Flame className="h-4 w-4" />
              <span>Meena (Enamel) Work</span>
            </button>
          </div>
        </div>

        {/* Direction Switcher */}
        <div>
          <label className="block text-xs font-semibold text-[#2B2B2B] uppercase tracking-wider mb-2">
            Direction (Movement)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDirection('ISSUE')}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-bold transition ${
                direction === 'ISSUE'
                  ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-soft'
                  : 'bg-white text-[#66615C] border-[#E8DFD5] hover:bg-[#F5EFE6]'
              }`}
            >
              <ArrowUp className="h-4 w-4 text-rose-600" />
              <span>ISSUE (Outgoing Stock)</span>
            </button>
            <button
              type="button"
              onClick={() => setDirection('RECEIVE')}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-bold transition ${
                direction === 'RECEIVE'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-soft'
                  : 'bg-white text-[#66615C] border-[#E8DFD5] hover:bg-[#F5EFE6]'
              }`}
            >
              <ArrowDown className="h-4 w-4 text-emerald-600" />
              <span>RECEIVE (Inward Processed)</span>
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-[#8C857E]">
            {direction === 'ISSUE'
              ? 'Deducts raw ornament weight from inventory register'
              : 'Adds processed ornament weight back to inventory register'}
          </p>
        </div>

        {/* Artisan Party Selection */}
        <Combobox
          label="Artisan / Karigar Party"
          required
          placeholder="Search or select artisan..."
          value={partyId}
          onChange={setPartyId}
          options={parties.map((p) => ({
            value: p.id,
            label: p.name,
            subLabel: p.whatsapp_number,
            badge: p.party_type,
          }))}
          onQuickAdd={() => setIsQuickAddPartyOpen(true)}
          quickAddLabel="+ Quick Add Artisan"
        />

        {/* Weight in Kg */}
        <WeightInput
          label="Weight in Kg (Strictly 3 Decimals)"
          required
          value={weightKg}
          onChange={(val) => setWeightKg(val)}
          helperText="Examples: 0.250 Kg, 1.500 Kg, 5.000 Kg"
        />

        {/* Optional Service Charge */}
        <div>
          <MoneyInput
            label="Optional Job Work Charge (₹)"
            value={chargeAmount}
            onChange={(val) => setChargeAmount(val)}
            helperText="If ₹0, records pure weight movement without financial debit/credit."
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-[#2B2B2B] uppercase tracking-wider mb-1.5">
            Narration / Specific Instructions
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="e.g. 5 pairs payal with high-gloss silver polish..."
            className="w-full bg-white border border-[#E8DFD5] text-[#2B2B2B] text-sm rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#9B1C31]/20 focus:border-[#9B1C31] placeholder:text-[#AFA190]"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-[#F5EFE6]">
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
            Record Job Work
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
