import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { Button } from './Button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  ledgerEffectNotice?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  ledgerEffectNotice,
  confirmLabel = 'Proceed with Action',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E8DFD5] space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3.5">
          <div
            className={`p-3 rounded-xl shrink-0 ${
              variant === 'danger' ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
            }`}
          >
            {variant === 'danger' ? <AlertTriangle className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#2B2B2B]">{title}</h3>
            <p className="text-sm text-[#66615C] mt-1 leading-relaxed">{description}</p>
          </div>
        </div>

        {ledgerEffectNotice && (
          <div className="p-3.5 rounded-xl bg-[#FAF6EF] border border-[#EBD7BA] text-xs text-[#7E5627] space-y-1">
            <div className="font-bold flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <ShieldAlert className="h-3.5 w-3.5 text-[#B8893B]" />
              Double-Entry Accounting & Audit Effect:
            </div>
            <p className="leading-relaxed">{ledgerEffectNotice}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'gold'}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
