import React from 'react';
import { Clock, ShieldCheck } from 'lucide-react';

export const ServerTimestampNotice: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#FAF6EF] border border-[#EBD7BA] text-xs text-[#7E5627] ${className}`}
    >
      <Clock className="h-4 w-4 text-[#B8893B] shrink-0" />
      <span className="font-medium">
        Entry timestamp is recorded automatically by the database server.
      </span>
      <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-[#B8893B] font-semibold uppercase tracking-wider">
        <ShieldCheck className="h-3.5 w-3.5" />
        Immutable
      </span>
    </div>
  );
};
