import React from 'react';

export type ChipVariant =
  | 'OPEN'
  | 'PARTIAL'
  | 'PAID'
  | 'OVERDUE'
  | 'ACTIVE'
  | 'SOFT_DELETED'
  | 'POLISH'
  | 'MEENA'
  | 'RECEIPT'
  | 'PAYMENT';

export interface StatusChipProps {
  status: string | ChipVariant;
  className?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, className = '' }) => {
  const norm = (status || '').toUpperCase() as ChipVariant;

  const styles: Record<ChipVariant, { bg: string; text: string; border: string; dot: string; label: string }> = {
    OPEN: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      dot: 'bg-blue-500',
      label: 'Open Bill',
    },
    PARTIAL: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
      label: 'Partially Paid',
    },
    PAID: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
      label: 'Fully Paid',
    },
    OVERDUE: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      dot: 'bg-rose-500',
      label: 'Overdue Dues',
    },
    ACTIVE: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
      label: 'Active',
    },
    SOFT_DELETED: {
      bg: 'bg-slate-100',
      text: 'text-slate-500 line-through',
      border: 'border-slate-200',
      dot: 'bg-slate-400',
      label: 'Cancelled / Reversal',
    },
    POLISH: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      dot: 'bg-purple-500',
      label: 'Polish Work',
    },
    MEENA: {
      bg: 'bg-cyan-50',
      text: 'text-cyan-700',
      border: 'border-cyan-200',
      dot: 'bg-cyan-500',
      label: 'Meena Enamel',
    },
    RECEIPT: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      dot: 'bg-emerald-600',
      label: 'Receipt In',
    },
    PAYMENT: {
      bg: 'bg-rose-50',
      text: 'text-rose-800',
      border: 'border-rose-200',
      dot: 'bg-rose-600',
      label: 'Payment Out',
    },
  };

  const current = styles[norm] || {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    label: status,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${current.bg} ${current.text} ${current.border} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${current.dot}`} />
      <span>{current.label}</span>
    </span>
  );
};
