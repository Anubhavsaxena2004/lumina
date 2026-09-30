import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { StockRegisterItem, Item } from '../../types';
import { formatWeightKg, formatRupee } from '../../lib/formatters';
import { Boxes, Plus, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { WeightInput } from '../../components/ui/WeightInput';
import { MoneyInput } from '../../components/ui/MoneyInput';
import { Skeleton } from '../../components/ui/Skeleton';

export const StockRegisterPage: React.FC = () => {
  const [stock, setStock] = useState<StockRegisterItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);

  // New Item State
  const [newItemName, setNewItemName] = useState('');
  const [newItemHsn, setNewItemHsn] = useState('');
  const [newItemRate, setNewItemRate] = useState<number>(0);
  const [newItemOpeningStock, setNewItemOpeningStock] = useState<number>(0);
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchStock = async () => {
    setIsLoading(true);
    try {
      const res = await api.stock.getStockRegister();
      setStock(res);
    } catch {
      // Silently handled
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      setModalError('Item name is required.');
      return;
    }

    setIsSavingItem(true);
    setModalError(null);

    try {
      await api.masters.createItem({
        name: newItemName.trim(),
        hsn_code: newItemHsn.trim() || undefined,
        default_rate_per_kg: newItemRate,
        opening_stock_kg: newItemOpeningStock,
      });

      setIsAddItemModalOpen(false);
      setNewItemName('');
      setNewItemHsn('');
      setNewItemRate(0);
      setNewItemOpeningStock(0);
      await fetchStock();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create item.');
    } finally {
      setIsSavingItem(false);
    }
  };

  const filteredStock = stock.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.hsn_code && item.hsn_code.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#2B2B2B] flex items-center gap-2">
            <Boxes className="h-6 w-6 text-[#9B1C31]" />
            Live Inventory & Stock Register
          </h1>
          <p className="text-xs text-[#66615C]">
            Real-time ornament stock computed dynamically from append-only stock movements
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchStock}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddItemModalOpen(true)}
            leftIcon={<Plus className="h-3.5 w-3.5" />}
          >
            New Item Master
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E8DFD5] shadow-soft flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-3 top-3 text-[#8C857E]" />
          <input
            type="text"
            placeholder="Search items by name or HSN code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#FAF6EF] border border-[#E8DFD5] text-xs rounded-xl pl-9 pr-3 py-2 text-[#2B2B2B] focus:outline-none focus:ring-1 focus:ring-[#9B1C31]"
          />
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#7E5627] bg-[#FAF6EF] px-3 py-1.5 rounded-full border border-[#EBD7BA]">
          <ShieldCheck className="h-3.5 w-3.5 text-[#B8893B]" />
          <span>Stock movements are insert-only</span>
        </div>
      </div>

      {/* Stock Register Table */}
      <div className="bg-white rounded-2xl border border-[#E8DFD5] shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : filteredStock.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#8C857E]">
            No inventory items found. Click "New Item Master" above to register ornaments.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#FAF6EF] border-b border-[#E8DFD5] text-[#8C857E] uppercase tracking-wider">
                  <th className="py-3 px-4">Ornament Item</th>
                  <th className="py-3 px-3 text-right">Opening</th>
                  <th className="py-3 px-3 text-right text-emerald-700">Purchases (+)</th>
                  <th className="py-3 px-3 text-right text-rose-700">Sales (-)</th>
                  <th className="py-3 px-3 text-right text-[#7E5627]">Job Issued (-)</th>
                  <th className="py-3 px-3 text-right text-[#7E5627]">Job Received (+)</th>
                  <th className="py-3 px-4 text-right font-extrabold text-[#9B1C31]">Live Balance (Kg)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5EFE6]">
                {filteredStock.map((it) => (
                  <tr key={it.id} className="hover:bg-[#FAF6EF]/50">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-sm text-[#2B2B2B]">{it.name}</div>
                      {it.hsn_code && (
                        <div className="text-[10px] text-[#8C857E]">HSN: {it.hsn_code}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right tabular-nums text-[#66615C]">
                      {formatWeightKg(it.opening_stock_kg)}
                    </td>
                    <td className="py-3.5 px-3 text-right tabular-nums font-semibold text-emerald-700">
                      +{formatWeightKg(it.purchase_in_kg)}
                    </td>
                    <td className="py-3.5 px-3 text-right tabular-nums font-semibold text-rose-700">
                      -{formatWeightKg(it.sale_out_kg)}
                    </td>
                    <td className="py-3.5 px-3 text-right tabular-nums text-[#8C857E]">
                      -{formatWeightKg(it.polish_issued_kg || it.meena_issued_kg)}
                    </td>
                    <td className="py-3.5 px-3 text-right tabular-nums text-[#8C857E]">
                      +{formatWeightKg(it.polish_received_kg || it.meena_received_kg)}
                    </td>
                    <td className="py-3.5 px-4 text-right tabular-nums font-extrabold text-sm text-[#9B1C31]">
                      {formatWeightKg(it.current_balance_kg)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E8DFD5] space-y-4">
            <h3 className="text-base font-bold text-[#2B2B2B]">Add New Item Master</h3>
            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {modalError}
              </div>
            )}
            <form onSubmit={handleCreateItem} className="space-y-4">
              <Input
                label="Item Name"
                required
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="e.g. Silver Payal 70 Tunch"
                autoFocus
              />
              <Input
                label="HSN Code"
                value={newItemHsn}
                onChange={(e) => setNewItemHsn(e.target.value)}
                placeholder="e.g. 7113"
              />
              <MoneyInput
                label="Default Rate per Kg (₹)"
                value={newItemRate}
                onChange={setNewItemRate}
              />
              <WeightInput
                label="Opening Stock in Kg"
                value={newItemOpeningStock}
                onChange={setNewItemOpeningStock}
              />
              <div className="flex justify-end gap-2.5 pt-3">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setIsAddItemModalOpen(false)}
                  disabled={isSavingItem}
                >
                  Cancel
                </Button>
                <Button variant="primary" type="submit" isLoading={isSavingItem}>
                  Create Item
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
