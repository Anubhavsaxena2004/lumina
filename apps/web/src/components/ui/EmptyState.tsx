import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center bg-white/60 border border-dashed border-[#E8DFD5] rounded-2xl ${className}`}
    >
      <div className="p-4 rounded-2xl bg-[#FAF6EF] text-[#B8893B] border border-[#EBD7BA] mb-4">
        {icon || <PackageOpen className="h-8 w-8" />}
      </div>
      <h3 className="text-base font-bold text-[#2B2B2B]">{title}</h3>
      <p className="text-xs text-[#66615C] max-w-sm mt-1 mb-5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
