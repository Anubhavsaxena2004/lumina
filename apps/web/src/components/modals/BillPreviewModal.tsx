import React, { useState } from 'react';
import { X, Send, Eye, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { api } from '../../api/client';
import { Sale } from '../../types';
import { formatRupee, formatDate } from '../../lib/formatters';

export interface BillPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  onSentSuccess?: () => void;
}

export const BillPreviewModal: React.FC<BillPreviewModalProps> = ({
  isOpen,
  onClose,
  sale,
  onSentSuccess,
}) => {
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  if (!isOpen || !sale) return null;

  const previewUrl = api.sales.getBillPreviewUrl(sale.id);

  const handleSendWhatsApp = async () => {
    setIsSending(true);
    setSendError(null);
    try {
      await api.sales.sendBillWhatsApp(sale.id);
      setSendSuccess(true);
      if (onSentSuccess) onSentSuccess();
    } catch (err: any) {
      setSendError(err.message || 'Failed to dispatch bill on WhatsApp. Check customer phone.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#E8DFD5] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-[#F5EFE6] flex items-center justify-between bg-[#FAF6EF]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#9B1C31] text-white">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#2B2B2B]">
                Tax Invoice #{sale.bill_no || sale.bill_number}
              </h3>
              <p className="text-xs text-[#66615C]">
                {sale.party_name} &bull; {formatRupee(sale.total_amount)} &bull; Due: {formatDate(sale.due_date)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#8C857E] hover:text-[#2B2B2B] hover:bg-[#F5EFE6] transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Banners */}
        {sendSuccess && (
          <div className="px-6 py-3 bg-emerald-50 border-b border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>High-DPI JPG bill dispatched successfully to customer on WhatsApp!</span>
          </div>
        )}
        {sendError && (
          <div className="px-6 py-3 bg-rose-50 border-b border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{sendError}</span>
          </div>
        )}

        {/* Image Preview Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#FBF7F2] flex items-center justify-center">
          <div className="max-w-lg w-full bg-white rounded-xl shadow-soft-md border border-[#E8DFD5] overflow-hidden">
            <img
              src={previewUrl}
              alt={`Bill #${sale.bill_no}`}
              className="w-full h-auto object-contain block"
              loading="lazy"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:px-6 border-t border-[#F5EFE6] bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#8C857E]">
            Customer: <span className="font-semibold text-[#2B2B2B]">{sale.party_phone || 'No phone registered'}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="gold"
              size="sm"
              onClick={handleSendWhatsApp}
              isLoading={isSending}
              disabled={!sale.party_phone}
              leftIcon={<Send className="h-4 w-4" />}
            >
              {sendSuccess ? 'Send Again via WhatsApp' : 'Send via WhatsApp'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
