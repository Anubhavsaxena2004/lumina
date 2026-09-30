import React, { useState } from 'react';
import { X, UserPlus, Phone, User, Landmark } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { MoneyInput } from '../ui/MoneyInput';
import { api } from '../../api/client';
import { Party, PartyType, BalanceType } from '../../types';

export interface PartyQuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newParty: Party) => void;
  defaultType?: PartyType;
}

export const PartyQuickAddModal: React.FC<PartyQuickAddModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultType = 'CUSTOMER',
}) => {
  const [name, setName] = useState('');
  const [partyType, setPartyType] = useState<PartyType>(defaultType);
  const [whatsappNumber, setWhatsappNumber] = useState('+91');
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [balanceType, setBalanceType] = useState<BalanceType>('DEBIT');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Party name is required');
      return;
    }

    let phone = whatsappNumber.trim();
    if (phone && !phone.startsWith('+')) {
      phone = '+91' + phone.replace(/^0+/, '');
    }

    setIsLoading(true);
    setError(null);

    try {
      const created = await api.masters.createParty({
        name: name.trim(),
        party_type: partyType,
        whatsapp_number: phone,
        opening_balance: openingBalance,
        opening_balance_type: balanceType,
      });
      onSuccess(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create party. Check mobile number format.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E8DFD5] space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-[#F5EFE6]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#FAF6EF] text-[#9B1C31] border border-[#EBD7BA]">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#2B2B2B]">Quick Add Party</h3>
              <p className="text-xs text-[#8C857E]">Register new customer or supplier</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8C857E] hover:text-[#2B2B2B] hover:bg-[#F5EFE6] transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Party / Business Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Shree Jewellers"
            leftAddon={<User className="h-4 w-4" />}
            autoFocus
          />

          <div>
            <label className="block text-xs font-semibold text-[#2B2B2B] uppercase tracking-wider mb-1.5">
              Party Type <span className="text-[#9B1C31]">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['CUSTOMER', 'SUPPLIER', 'BOTH'] as PartyType[]).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setPartyType(t)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition ${
                    partyType === t
                      ? 'bg-[#9B1C31] text-white border-[#9B1C31] shadow-soft'
                      : 'bg-white text-[#66615C] border-[#E8DFD5] hover:bg-[#F5EFE6]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="WhatsApp Number (E.164)"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="+919876543210"
            helperText="Include country code (+91 for India)"
            leftAddon={<Phone className="h-4 w-4" />}
          />

          <div className="grid grid-cols-2 gap-3">
            <MoneyInput
              label="Opening Balance"
              value={openingBalance}
              onChange={(val) => setOpeningBalance(val)}
            />
            <div>
              <label className="block text-xs font-semibold text-[#2B2B2B] uppercase tracking-wider mb-1.5">
                Balance Type
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['DEBIT', 'CREDIT'] as BalanceType[]).map((bt) => (
                  <button
                    type="button"
                    key={bt}
                    onClick={() => setBalanceType(bt)}
                    className={`py-2 text-xs font-semibold rounded-xl border transition ${
                      balanceType === bt
                        ? 'bg-[#B8893B] text-white border-[#B8893B]'
                        : 'bg-white text-[#66615C] border-[#E8DFD5] hover:bg-[#F5EFE6]'
                    }`}
                  >
                    {bt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3">
            <Button variant="secondary" type="button" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isLoading}>
              Save Party
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
