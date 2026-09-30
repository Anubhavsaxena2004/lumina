import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Sale, Purchase, JobWorkEntry, MoneyVoucher } from '../../types';
import { formatRupee, formatWeightKg, formatDate, formatDateTime } from '../../lib/formatters';
import {
  FileText,
  Send,
  Eye,
  Filter,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Flame,
  CreditCard,
  RefreshCw,
  Search,
} from 'lucide-react';
import { StatusChip } from '../../components/ui/StatusChip';
import { Button } from '../../components/ui/Button';
import { BillPreviewModal } from '../../components/modals/BillPreviewModal';
import { Skeleton } from '../../components/ui/Skeleton';

type EntryCategory = 'ALL' | 'SALES' | 'PURCHASES' | 'JOB_WORK' | 'VOUCHERS';

export const MyEntriesPage: React.FC = () => {
  const [category, setCategory] = useState<EntryCategory>('SALES');
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [jobWork, setJobWork] = useState<JobWorkEntry[]>([]);
  const [vouchers, setVouchers] = useState<MoneyVoucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSaleForPreview, setSelectedSaleForPreview] = useState<Sale | null>(null);

  const fetchEntries = async () => {
    setIsLoading(true);
    try {
      const [salesData, purchasesData, jwData, vouchersData] = await Promise.all([
        api.sales.getSales({ limit: 100 }),
        api.purchases.getPurchases({ limit: 100 }),
        api.jobWork.getEntries({ limit: 100 }),
        api.vouchers.getVouchers({ limit: 100 }),
      ]);
      setSales(salesData);
      setPurchases(purchasesData);
      setJobWork(jwData);
      setVouchers(vouchersData);
    } catch {
      // Handled silently
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const filteredSales = sales.filter(
    (s) =>
      s.party_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(s.bill_no).includes(searchTerm)
  );

  const filteredPurchases = purchases.filter(
    (p) =>
      p.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.bill_no).includes(searchTerm)
  );

  const filteredJobWork = jobWork.filter(
    (j) =>
      j.party_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.entry_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredVouchers = vouchers.filter(
    (v) =>
      v.party_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(v.voucher_no).includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#2B2B2B] flex items-center gap-2">
            <FileText className="h-6 w-6 text-[#9B1C31]" />
            My Created Entries
          </h1>
          <p className="text-xs text-[#66615C]">
            Audit history of entries recorded by your login. Staff cannot edit or delete entries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchEntries}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E8DFD5] shadow-soft space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'SALES', label: 'Sales', count: sales.length, icon: <ShoppingBag className="h-3.5 w-3.5" /> },
              { id: 'PURCHASES', label: 'Purchases', count: purchases.length, icon: <ShoppingCart className="h-3.5 w-3.5" /> },
              { id: 'JOB_WORK', label: 'Polish & Meena', count: jobWork.length, icon: <Sparkles className="h-3.5 w-3.5" /> },
              { id: 'VOUCHERS', label: 'Receipts & Payments', count: vouchers.length, icon: <CreditCard className="h-3.5 w-3.5" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCategory(tab.id as EntryCategory)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  category === tab.id
                    ? 'bg-[#9B1C31] text-white shadow-soft'
                    : 'bg-[#FAF6EF] text-[#66615C] hover:bg-[#F5EBDD]'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    category === tab.id ? 'bg-white/20 text-white' : 'bg-[#EBD7BA] text-[#7E5627]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="h-4 w-4 absolute left-3 top-3 text-[#8C857E]" />
            <input
              type="text"
              placeholder="Search by party or bill #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#FAF6EF] border border-[#E8DFD5] text-xs rounded-xl pl-9 pr-3 py-2 text-[#2B2B2B] focus:outline-none focus:ring-1 focus:ring-[#9B1C31]"
            />
          </div>
        </div>
      </div>

      {/* Entries List */}
      <div className="bg-white rounded-2xl border border-[#E8DFD5] shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : category === 'SALES' ? (
          filteredSales.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#8C857E]">
              No sales entries found matching your search.
            </div>
          ) : (
            <div className="divide-y divide-[#F5EFE6]">
              {filteredSales.map((sale) => (
                <div
                  key={sale.id}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF6EF]/50 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#2B2B2B]">
                        Bill #{sale.bill_no || sale.bill_number}
                      </span>
                      <StatusChip status={sale.payment_status || 'OPEN'} />
                    </div>
                    <div className="text-xs text-[#66615C]">
                      Customer: <span className="font-semibold text-[#2B2B2B]">{sale.party_name}</span>
                      {sale.party_phone && (
                        <span className="ml-2 text-[#8C857E]">({sale.party_phone})</span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#8C857E] flex items-center gap-3">
                      <span>Recorded: {formatDateTime(sale.entry_at)}</span>
                      <span>&bull;</span>
                      <span>Due Date: {formatDate(sale.due_date)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-[#F5EFE6]">
                    <div className="text-right sm:mr-3">
                      <div className="text-sm font-bold text-[#9B1C31] tabular-nums">
                        {formatRupee(sale.total_amount)}
                      </div>
                      {sale.outstanding_amount !== undefined && Number(sale.outstanding_amount) > 0 ? (
                        <div className="text-[11px] text-rose-600 font-semibold tabular-nums">
                          Due: {formatRupee(sale.outstanding_amount)}
                        </div>
                      ) : (
                        <div className="text-[11px] text-emerald-600 font-semibold">
                          Settled
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedSaleForPreview(sale)}
                        title="View Rendered Tax Invoice"
                        className="p-2 rounded-xl text-[#8C857E] hover:text-[#2B2B2B] hover:bg-[#F5EFE6] transition"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <Button
                        variant="gold"
                        size="sm"
                        onClick={() => setSelectedSaleForPreview(sale)}
                        leftIcon={<Send className="h-3.5 w-3.5" />}
                      >
                        WhatsApp
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : category === 'PURCHASES' ? (
          filteredPurchases.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#8C857E]">
              No purchase entries found.
            </div>
          ) : (
            <div className="divide-y divide-[#F5EFE6]">
              {filteredPurchases.map((purch) => (
                <div
                  key={purch.id}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF6EF]/50 transition"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-[#2B2B2B]">
                      Purchase Bill #{purch.bill_no}
                    </div>
                    <div className="text-xs text-[#66615C]">
                      Supplier: <span className="font-semibold text-[#2B2B2B]">{purch.supplier_name}</span>
                    </div>
                    <div className="text-[11px] text-[#8C857E]">
                      Recorded: {formatDateTime(purch.entry_at)} &bull; Due: {formatDate(purch.due_date)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-[#2B2B2B] tabular-nums">
                      {formatRupee(purch.total_amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : category === 'JOB_WORK' ? (
          filteredJobWork.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#8C857E]">
              No Polish or Meena job work entries recorded.
            </div>
          ) : (
            <div className="divide-y divide-[#F5EFE6]">
              {filteredJobWork.map((jw) => (
                <div
                  key={jw.id}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF6EF]/50 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#2B2B2B]">
                        {jw.entry_type} {jw.direction}
                      </span>
                      <StatusChip status={jw.entry_type} />
                    </div>
                    <div className="text-xs text-[#66615C]">
                      Artisan: <span className="font-semibold text-[#2B2B2B]">{jw.party_name}</span>
                    </div>
                    <div className="text-[11px] text-[#8C857E]">
                      Recorded: {formatDateTime(jw.entry_at)}
                      {jw.notes && ` • ${jw.notes}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-[#B8893B] tabular-nums">
                      {formatWeightKg(jw.weight_kg)}
                    </div>
                    {Number(jw.charge_amount) > 0 && (
                      <div className="text-xs text-[#66615C] tabular-nums">
                        Charge: {formatRupee(jw.charge_amount)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          filteredVouchers.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#8C857E]">
              No money vouchers recorded.
            </div>
          ) : (
            <div className="divide-y divide-[#F5EFE6]">
              {filteredVouchers.map((v) => (
                <div
                  key={v.id}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF6EF]/50 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#2B2B2B]">
                        Voucher #{v.voucher_no}
                      </span>
                      <StatusChip status={v.voucher_type} />
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {v.mode}
                      </span>
                    </div>
                    <div className="text-xs text-[#66615C]">
                      Party: <span className="font-semibold text-[#2B2B2B]">{v.party_name}</span>
                      {v.bank_name && ` (${v.bank_name})`}
                    </div>
                    <div className="text-[11px] text-[#8C857E]">
                      Recorded: {formatDateTime(v.entry_at)}
                      {v.reference_no && ` • Ref: ${v.reference_no}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-sm font-bold tabular-nums ${
                        v.voucher_type === 'RECEIPT' ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {v.voucher_type === 'RECEIPT' ? '+' : '-'}
                      {formatRupee(v.amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Bill Preview Modal */}
      {selectedSaleForPreview && (
        <BillPreviewModal
          isOpen={!!selectedSaleForPreview}
          onClose={() => setSelectedSaleForPreview(null)}
          sale={selectedSaleForPreview}
          onSentSuccess={() => fetchEntries()}
        />
      )}
    </div>
  );
};
