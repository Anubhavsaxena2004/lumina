import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { AuditLogItem } from '../../types';
import { formatDateTime } from '../../lib/formatters';
import { ShieldAlert, ShieldCheck, RefreshCw, Filter, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<string>('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.audit.getLogs({
        entity: selectedEntity !== 'ALL' ? selectedEntity : undefined,
        limit: 100,
      });
      setLogs(res);
    } catch {
      // Handled silently
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedEntity]);

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#2B2B2B] flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-[#9B1C31]" />
            Immutable Audit Trail
          </h1>
          <p className="text-xs text-[#66615C]">
            Tamper-proof append-only audit log recording all mutations and compensating reversals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchLogs}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Security Invariant Card */}
      <div className="p-4 rounded-2xl bg-[#FAF6EF] border border-[#EBD7BA] flex items-center gap-3 text-xs text-[#7E5627]">
        <ShieldCheck className="h-5 w-5 text-[#B8893B] shrink-0" />
        <div>
          <span className="font-bold">PostgreSQL Database Trigger Enforced: </span>
          The audit_log table rejects all UPDATE and DELETE commands via immutable database triggers.
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {['ALL', 'sales', 'purchases', 'job_work_entries', 'money_vouchers', 'users'].map((ent) => (
          <button
            key={ent}
            onClick={() => setSelectedEntity(ent)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
              selectedEntity === ent
                ? 'bg-[#9B1C31] text-white shadow-soft'
                : 'bg-white text-[#66615C] border border-[#E8DFD5] hover:bg-[#FAF6EF]'
            }`}
          >
            {ent}
          </button>
        ))}
      </div>

      {/* Audit Log Entries List */}
      <div className="bg-white rounded-2xl border border-[#E8DFD5] shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#8C857E]">
            No audit records found.
          </div>
        ) : (
          <div className="divide-y divide-[#F5EFE6]">
            {logs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              return (
                <div key={log.id} className="p-4 sm:px-6 hover:bg-[#FAF6EF]/50 transition">
                  <div
                    onClick={() => toggleExpand(log.id)}
                    className="flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            log.action === 'INSERT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.action === 'UPDATE'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {log.action}
                        </span>
                        <span className="font-bold text-xs text-[#2B2B2B]">
                          {log.entity_name} &bull; ID: {log.entity_id ? `${log.entity_id.slice(0, 8)}...` : '-'}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#8C857E]">
                        Performed by: <span className="font-semibold text-[#2B2B2B]">{log.user_name || log.performed_by}</span> &bull; {formatDateTime(log.created_at)}
                      </div>
                    </div>

                    <div className="p-1 text-[#8C857E]">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </div>

                  {/* Expanded JSON Diff Viewer */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-[#F5EFE6] grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                      {log.before_state && (
                        <div>
                          <div className="font-bold text-[#8C857E] uppercase tracking-wider mb-1">
                            Before State:
                          </div>
                          <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 overflow-x-auto font-mono text-[10px] max-h-48">
                            {JSON.stringify(log.before_state, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.after_state && (
                        <div>
                          <div className="font-bold text-[#8C857E] uppercase tracking-wider mb-1">
                            After State:
                          </div>
                          <pre className="p-3 rounded-xl bg-slate-900 text-emerald-400 overflow-x-auto font-mono text-[10px] max-h-48">
                            {JSON.stringify(log.after_state, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
