import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Sale, Purchase, JobWorkEntry, MoneyVoucher, User, Party } from '../../types';
import { formatRupee, formatWeightKg, formatDate, formatDateTime } from '../../lib/formatters';
import {
  FileText,
  Filter,
  Trash2,
  Edit,
  Eye,
  Send,
  AlertTriangle,
  RefreshCw,
  Search,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { StatusChip } from '../../components/ui/StatusChip';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { BillPreviewModal } from '../../components/modals/BillPreviewModal';
import { Skeleton } from '../../components/ui/Skeleton';

export const OwnerEntriesPage: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedStaffId, setSelectedStaffId] = useState<string>('ALL');
  const [selectedPartyId, setSelectedPartyId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Sale for Action
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedSaleForPreview, setSelectedSaleForPreview] = useState<Sale | null>(null);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [salesData, usersData, partiesData] = await Promise.all([
        api.sales.getSales({ limit: 100 }),
        api.users.getStaffList(),
        api.masters.getParties(),
      ]);
      setSales(salesData);
      setStaffList(usersData);
      setParties(partiesData);
    } catch {
      // Silently handled
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleConfirmDelete = async () => {
    if (!saleToDelete) return;
    setIsDeleting(true);
    try {
      await api.sales.deleteSale(saleToDelete.id);
      setSaleToDelete(null);
      await fetchAll();
    } catch (err: any) {
      alert(err.message || 'Failed to soft-delete entry.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredSales = sales.filter((s) => {
    if (selectedStaffId !== 'ALL' && s.created_by !== selectedStaffId) return false;
    if (selectedPartyId !== 'ALL' && s.party_id !== selectedPartyId) return false;
    if (statusFilter !== 'ALL' && s.payment_status !== statusFilter) return false;
    if (
      searchTerm &&
      !s.party_name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !String(s.bill_no).includes(searchTerm)
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#2B2B2B] flex items-center gap-2">
            <FileText className="h-6 w-6 text-[#9B1C31]" />
            Consolidated Entries Management
          </h1>
          <p className="text-xs text-[#66615C]">
            Owner view across all staff members with compensating reversal deletion flows
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={fetchAll}
          leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
        >
          Refresh All
        </Button>
      </div>

      {/* Multi-Filters Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8DFD5] shadow-soft space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#AFA190]">
          <Filter className="h-4 w-4" />
          Filter Entries
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Staff Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-[#66615C] mb-1">
              Staff Member
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full bg-[#FAF6EF] border border-[#E8DFD5] text-xs font-medium rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-[#9B1C31]"
            >
              <option value="ALL">All Staff Members</option>
              {staffList.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} (@{st.username})
                </option>
              ))}
            </select>
          </div>

          {/* Party Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-[#66615C] mb-1">
              Party / Customer
            </label>
            <select
              value={selectedPartyId}
              onChange={(e) => setSelectedPartyId(e.target.value)}
              className="w-full bg-[#FAF6EF] border border-[#E8DFD5] text-xs font-medium rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-[#9B1C31]"
            >
              <option value="ALL">All Parties</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-[#66615C] mb-1">
              Payment Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#FAF6EF] border border-[#E8DFD5] text-xs font-medium rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-[#9B1C31]"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open (Unpaid)</option>
              <option value="PARTIAL">Partially Paid</option>
              <option value="PAID">Fully Paid</option>
              <option value="OVERDUE">Overdue Dues</option>
            </select>
          </div>

          {/* Search Term */}
          <div>
            <label className="block text-[11px] font-semibold text-[#66615C] mb-1">
              Search Party or Bill #
            </label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-[#8C857E]" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#FAF6EF] border border-[#E8DFD5] text-xs rounded-xl pl-9 pr-3 py-2.5 text-[#2B2B2B] focus:outline-none focus:ring-1 focus:ring-[#9B1C31]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Entries Data Table / Cards */}
      <div className="bg-white rounded-2xl border border-[#E8DFD5] shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#8C857E]">
            No sales entries found matching the specified filters.
          </div>
        ) : (
          <div className="divide-y divide-[#F5EFE6]">
            {filteredSales.map((sale) => (
              <div
                key={sale.id}
                className={`p-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                  sale.status === 'SOFT_DELETED'
                    ? 'bg-slate-50 opacity-60'
                    : 'hover:bg-[#FAF6EF]/50'
                }`}
              >
                {/* Entry Meta */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-bold text-sm text-[#2B2B2B]">
                      Bill #{sale.bill_no || sale.bill_number}
                    </span>
                    <StatusChip status={sale.status === 'SOFT_DELETED' ? 'SOFT_DELETED' : (sale.payment_status || 'OPEN')} />
                    <span className="text-[11px] font-medium text-[#7E5627] bg-[#FAF6EF] px-2 py-0.5 rounded-full border border-[#EBD7BA]">
                      Staff: {sale.staff_name || 'Staff User'}
                    </span>
                  </div>

                  <div className="text-xs text-[#66615C]">
                    Customer: <span className="font-bold text-[#2B2B2B]">{sale.party_name}</span>
                    {sale.party_phone && (
                      <span className="ml-2 text-[#8C857E]">({sale.party_phone})</span>
                    )}
                  </div>

                  <div className="text-[11px] text-[#8C857E] flex items-center gap-3">
                    <span>Recorded: {formatDateTime(sale.entry_at)}</span>
                    <span>&bull;</span>
                    <span>Due: {formatDate(sale.due_date)}</span>
                  </div>
                </div>

                {/* Amounts & Owner Actions */}
                <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-0 border-[#F5EFE6]">
                  <div className="text-right">
                    <div className="text-base font-extrabold text-[#9B1C31] tabular-nums">
                      {formatRupee(sale.total_amount)}
                    </div>
                    {sale.outstanding_amount !== undefined && Number(sale.outstanding_amount) > 0 ? (
                      <div className="text-[11px] font-semibold text-rose-600 tabular-nums">
                        Outstanding: {formatRupee(sale.outstanding_amount)}
                      </div>
                    ) : (
                      <div className="text-[11px] font-semibold text-emerald-600">
                        Paid in Full
                      </div>
                    )}
                  </div>

                  {/* Owner Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setSelectedSaleForPreview(sale)}
                      title="Preview Tax Invoice"
                      className="p-2 rounded-xl text-[#8C857E] hover:text-[#2B2B2B] hover:bg-[#F5EFE6] transition"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {sale.status !== 'SOFT_DELETED' && (
                      <button
                        onClick={() => setSaleToDelete(sale)}
                        title="Owner Reversal Soft-Delete"
                        className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bill Preview Modal */}
      {selectedSaleForPreview && (
        <BillPreviewModal
          isOpen={!!selectedSaleForPreview}
          onClose={() => setSelectedSaleForPreview(null)}
          sale={selectedSaleForPreview}
          onSentSuccess={() => fetchAll()}
        />
      )}

      {/* Owner Soft-Delete Confirmation Dialog explaining Double-Entry Ledger Effect */}
      <ConfirmDialog
        isOpen={!!saleToDelete}
        title={`Soft-Delete Bill #${saleToDelete?.bill_no}?`}
        description="Are you sure you want to cancel and reverse this sale invoice? Once confirmed, this sale will be archived."
        ledgerEffectNotice="The database will execute an atomic compensating transaction: reversing ledger entries will credit the party's account for the sale amount, returning deducted stock quantities back into stock_movements, and recording before/after delta snapshots in the immutable audit_log."
        confirmLabel="Confirm Compensating Reversal"
        cancelLabel="Keep Sale Active"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setSaleToDelete(null)}
      />
    </div>
  );
};
