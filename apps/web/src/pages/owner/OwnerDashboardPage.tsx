import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { OwnerDashboardData } from '../../types';
import { formatRupee, formatWeightKg, formatDate } from '../../lib/formatters';
import {
  TrendingUp,
  AlertTriangle,
  Wallet,
  Landmark,
  Boxes,
  BellRing,
  ShoppingBag,
  ShoppingCart,
  Send,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';

export const OwnerDashboardPage: React.FC = () => {
  const [data, setData] = useState<OwnerDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);
  const [triggerStatus, setTriggerStatus] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await api.dashboard.getOwnerMetrics();
      setData(res);
    } catch {
      // Silently handled
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleManualReminderTrigger = async () => {
    setIsTriggering(true);
    setTriggerStatus(null);
    try {
      const result = await api.reminders.triggerReminders(false);
      setTriggerStatus(
        `Batch dispatched: ${result.reminders_sent} customer WhatsApp reminders sent. Consolidated Owner summary delivered.`
      );
      fetchDashboard();
    } catch (err: any) {
      setTriggerStatus(`Error dispatching reminders: ${err.message}`);
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#2B2B2B]">
            Owner Executive Overview
          </h1>
          <p className="text-xs text-[#66615C]">
            Live consolidated financials, outstanding receivables, dues reminders, and stock balances
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchDashboard}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh
          </Button>
          <Button
            variant="gold"
            size="sm"
            onClick={handleManualReminderTrigger}
            isLoading={isTriggering}
            leftIcon={<BellRing className="h-3.5 w-3.5" />}
          >
            Trigger Due Reminders
          </Button>
        </div>
      </div>

      {triggerStatus && (
        <div className="p-3.5 rounded-xl bg-[#FAF6EF] border border-[#EBD7BA] text-xs font-semibold text-[#7E5627] flex items-center justify-between">
          <span>{triggerStatus}</span>
          <button
            onClick={() => setTriggerStatus(null)}
            className="text-xs text-[#8C857E] hover:text-[#2B2B2B]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Receivables */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8DFD5] shadow-soft space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8C857E]">
              Total Receivables
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <div className="text-2xl font-extrabold text-[#2B2B2B] tabular-nums">
              {formatRupee(data?.totalReceivables)}
            </div>
          )}
          <p className="text-[11px] text-[#66615C]">
            Customer dues across all staff accounts
          </p>
        </div>

        {/* Overdue Delinquent Dues */}
        <div className="bg-white rounded-2xl p-5 border border-rose-200 shadow-soft space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
              Overdue Receivables
            </span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <div className="text-2xl font-extrabold text-[#9B1C31] tabular-nums">
              {formatRupee(data?.totalOverdueAmount)}
            </div>
          )}
          <p className="text-[11px] text-rose-600 font-medium">
            {data?.overdueBillsCount || 0} delinquent bills past due date
          </p>
        </div>

        {/* Total Payables */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8DFD5] shadow-soft space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8C857E]">
              Total Payables
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <div className="text-2xl font-extrabold text-[#2B2B2B] tabular-nums">
              {formatRupee(data?.totalPayables)}
            </div>
          )}
          <p className="text-[11px] text-[#66615C]">
            Liabilities owed to suppliers & artisans
          </p>
        </div>

        {/* Cash in Hand */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8DFD5] shadow-soft space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8C857E]">
              Cash in Hand
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <div className="text-2xl font-extrabold text-emerald-700 tabular-nums">
              {formatRupee(data?.cashInHand)}
            </div>
          )}
          <p className="text-[11px] text-[#66615C]">
            Physical cash balance in shop drawer
          </p>
        </div>
      </div>

      {/* Today's Sales & Purchases + Bank Balances */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Activity */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E8DFD5] shadow-soft space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#AFA190]">
            Today's Turnover & Movements
          </h2>
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-[#FAF6EF] border border-[#EBD7BA] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#9B1C31] text-white">
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#2B2B2B]">Today's Sales</div>
                  <div className="text-[11px] text-[#8C857E]">Completed invoices</div>
                </div>
              </div>
              <div className="text-sm font-bold text-[#9B1C31] tabular-nums">
                {formatRupee(data?.todaySalesAmount)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF6EF] border border-[#EBD7BA] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#B8893B] text-white">
                  <ShoppingCart className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#2B2B2B]">Today's Purchases</div>
                  <div className="text-[11px] text-[#8C857E]">Inward stock orders</div>
                </div>
              </div>
              <div className="text-sm font-bold text-[#2B2B2B] tabular-nums">
                {formatRupee(data?.todayPurchasesAmount)}
              </div>
            </div>
          </div>
        </div>

        {/* Company Bank Accounts */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-[#E8DFD5] shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#AFA190]">
              Bank Account Balances
            </h2>
            <Landmark className="h-4 w-4 text-[#8C857E]" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data?.bankBalances && data.bankBalances.length > 0 ? (
              data.bankBalances.map((bank) => (
                <div
                  key={bank.id}
                  className="p-4 rounded-xl bg-[#FAF6EF]/60 border border-[#E8DFD5] flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-[#2B2B2B]">{bank.bank_name}</div>
                    <div className="text-[11px] text-[#8C857E]">A/C: {bank.account_number}</div>
                  </div>
                  <div className="text-sm font-bold text-[#2B2B2B] tabular-nums">
                    {formatRupee(bank.balance)}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 p-6 text-center text-xs text-[#8C857E]">
                No bank accounts registered.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top 5 Delinquent Debtors (with WhatsApp Remind) */}
      <div className="bg-white rounded-2xl border border-[#E8DFD5] shadow-soft overflow-hidden">
        <div className="p-4 sm:px-6 border-b border-[#F5EFE6] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#2B2B2B]">
              Top Delinquent Debtors (Overdue Dues)
            </h2>
            <p className="text-xs text-[#8C857E]">
              Parties with the largest past-due balances. Evaluated daily by automated WhatsApp scheduler.
            </p>
          </div>
        </div>

        {data?.topDelinquentDebtors && data.topDelinquentDebtors.length > 0 ? (
          <div className="divide-y divide-[#F5EFE6]">
            {data.topDelinquentDebtors.map((debtor) => (
              <div
                key={debtor.party_id}
                className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF6EF]/50 transition"
              >
                <div className="space-y-1">
                  <div className="font-bold text-sm text-[#2B2B2B]">{debtor.party_name}</div>
                  <div className="text-xs text-[#66615C]">
                    WhatsApp: <span className="font-medium text-[#2B2B2B]">{debtor.whatsapp_number}</span>
                    <span className="ml-2 text-[#8C857E]">
                      ({debtor.bill_count} overdue {debtor.bill_count === 1 ? 'bill' : 'bills'})
                    </span>
                  </div>
                  <div className="text-[11px] text-rose-600 font-semibold">
                    Oldest Due: {formatDate(debtor.oldest_due_date)} &bull; {debtor.days_overdue} days overdue
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-extrabold text-[#9B1C31] tabular-nums">
                    {formatRupee(debtor.overdue_amount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-[#8C857E]">
            No delinquent accounts currently overdue! All customer bills are on schedule.
          </div>
        )}
      </div>

      {/* Low Stock Alerts */}
      <div className="bg-white rounded-2xl border border-[#E8DFD5] shadow-soft overflow-hidden">
        <div className="p-4 sm:px-6 border-b border-[#F5EFE6] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Boxes className="h-4 w-4 text-[#B8893B]" />
            <h2 className="text-sm font-bold text-[#2B2B2B]">Low Stock Inventory Alert</h2>
          </div>
        </div>

        {data?.lowStockItems && data.lowStockItems.length > 0 ? (
          <div className="divide-y divide-[#F5EFE6]">
            {data.lowStockItems.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:px-6 flex items-center justify-between hover:bg-[#FAF6EF]/50"
              >
                <div className="font-semibold text-xs text-[#2B2B2B]">{item.name}</div>
                <div className="text-right">
                  <span className="text-xs font-bold text-rose-600 tabular-nums">
                    {formatWeightKg(item.current_stock_kg)}
                  </span>
                  <span className="ml-2 text-[11px] text-[#8C857E]">({item.current_pieces} pcs)</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-[#8C857E]">
            All inventory item stock balances are above minimum reorder levels.
          </div>
        )}
      </div>
    </div>
  );
};
