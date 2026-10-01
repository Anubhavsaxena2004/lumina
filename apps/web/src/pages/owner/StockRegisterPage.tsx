import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { StockRegisterItem } from '../../types';
import { formatWeightKg } from '../../lib/formatters';
import { Boxes, Plus, RefreshCw, Search, ShieldCheck, ArrowUpDown } from 'lucide-react';
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
  const [newItemOpeningPieces, setNewItemOpeningPieces] = useState<number>(0);
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Adjust Stock Modal State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustItemId, setAdjustItemId] = useState<string>('');
  const [adjustType, setAdjustType] = useState<'ADD' | 'REMOVE'>('ADD');
  const [adjustPieces, setAdjustPieces] = useState<number>(0);
  const [adjustWeightKg, setAdjustWeightKg] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [isSavingAdjust, setIsSavingAdjust] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  const fetchStock = async () => {
    setIsLoading(true);
    try {
      const res = await api.stock.getStockRegister();
      const list = Array.isArray(res) ? res : (res as any)?.items || [];
      setStock(list);
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
        opening_stock_pieces: newItemOpeningPieces,
        opening_pieces: newItemOpeningPieces,
        opening_weight_kg: newItemOpeningStock,
      } as any);

      setIsAddItemModalOpen(false);
      setNewItemName('');
      setNewItemHsn('');
      setNewItemRate(0);
      setNewItemOpeningStock(0);
      setNewItemOpeningPieces(0);
      await fetchStock();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create item.');
    } finally {
      setIsSavingItem(false);
    }
  };

  const openAdjustModal = (item?: StockRegisterItem) => {
    const defaultItem = item || stock[0];
    if (defaultItem) {
      setAdjustItemId(defaultItem.id);
    }
    setAdjustType('ADD');
    setAdjustPieces(0);
    setAdjustWeightKg(0);
    setAdjustReason('');
    setAdjustError(null);
    setIsAdjustModalOpen(true);
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItemId) {
      setAdjustError('Please select an item.');
      return;
    }
    if (adjustPieces === 0 && adjustWeightKg === 0) {
      setAdjustError('Please enter pieces or weight (Kg) to adjust.');
      return;
    }

    setIsSavingAdjust(true);
    setAdjustError(null);

    try {
      const pDelta = adjustType === 'ADD' ? adjustPieces : -adjustPieces;
      const kgDelta = adjustType === 'ADD' ? adjustWeightKg : -adjustWeightKg;

      await api.stock.adjustStock({
        item_id: adjustItemId,
        pieces_delta: pDelta,
        kg_delta: kgDelta,
        reason: adjustReason.trim() || (adjustType === 'ADD' ? 'Manual Stock Inward' : 'Manual Stock Deduction'),
      });

      setIsAdjustModalOpen(false);
      setAdjustPieces(0);
      setAdjustWeightKg(0);
      setAdjustReason('');
      await fetchStock();
    } catch (err: any) {
      setAdjustError(err.message || 'Failed to adjust stock.');
    } finally {
      setIsSavingAdjust(false);
    }
  };

  const filteredStock = stock.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.hsn_code && item.hsn_code.includes(searchTerm))
  );

  const selectedAdjustItem = stock.find((it) => it.id === adjustItemId) || stock[0];
  const curPieces = selectedAdjustItem ? Number(selectedAdjustItem.current_pieces || 0) : 0;
  const curWeight = selectedAdjustItem ? Number(selectedAdjustItem.current_balance_kg || 0) : 0;
  const previewPieces = adjustType === 'ADD' ? curPieces + adjustPieces : Math.max(0, curPieces - adjustPieces);
  const previewWeight = adjustType === 'ADD'
    ? Math.round((curWeight + adjustWeightKg) * 1000) / 1000
    : Math.max(0, Math.round((curWeight - adjustWeightKg) * 1000) / 1000);

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
            Real-time ornament stock in pieces and kilograms computed dynamically from append-only stock movements
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchStock}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => openAdjustModal()}
            leftIcon={<ArrowUpDown className="h-3.5 w-3.5 text-[#B8893B]" />}
          >
            Add / Adjust Stock
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
                  <th className="py-3 px-3 text-right text-[#7E5627]">Job Work</th>
                  <th className="py-3 px-3 text-right font-bold text-[#2B2B2B]">Stock Pieces</th>
                  <th className="py-3 px-4 text-right font-extrabold text-[#9B1C31]">Live Balance (Kg)</th>
                  <th className="py-3 px-3 text-center">Action</th>
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
                      {formatWeightKg(
                        Number(it.polish_received_kg || it.meena_received_kg || 0) -
                        Number(it.polish_issued_kg || it.meena_issued_kg || 0)
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right tabular-nums font-bold text-sm text-[#2B2B2B]">
                      {it.current_pieces ?? 0} pcs
                    </td>
                    <td className="py-3.5 px-4 text-right tabular-nums font-extrabold text-sm text-[#9B1C31]">
                      {formatWeightKg(it.current_balance_kg)}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openAdjustModal(it)}
                        className="text-[11px] py-1 px-2.5"
                      >
                        + Add Stock
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal 1: Add New Item Master */}
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
                placeholder="e.g. Gold Bracelet 22K or Silver Payal 80T"
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
              <div className="grid grid-cols-2 gap-3 bg-[#FAF6EF] p-3 rounded-xl border border-[#E8DFD5]">
                <div>
                  <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                    Opening Pieces (pcs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="w-full bg-white border border-[#E8DFD5] text-xs rounded-xl px-3 py-2 text-[#2B2B2B] focus:outline-none focus:ring-1 focus:ring-[#9B1C31]"
                    value={newItemOpeningPieces === 0 ? '' : newItemOpeningPieces}
                    onChange={(e) => setNewItemOpeningPieces(parseInt(e.target.value, 10) || 0)}
                    placeholder="0 pcs"
                  />
                </div>
                <WeightInput
                  label="Opening Stock (Kg)"
                  value={newItemOpeningStock}
                  onChange={setNewItemOpeningStock}
                />
              </div>
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

      {/* Modal 2: Add / Adjust Stock */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E8DFD5] space-y-4">
            <h3 className="text-base font-bold text-[#2B2B2B]">Add / Adjust Item Stock</h3>
            {adjustError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {adjustError}
              </div>
            )}
            <form onSubmit={handleAdjustStock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                  Select Item
                </label>
                <select
                  value={adjustItemId}
                  onChange={(e) => setAdjustItemId(e.target.value)}
                  className="w-full bg-[#FAF6EF] border border-[#E8DFD5] text-xs rounded-xl px-3 py-2 text-[#2B2B2B] focus:outline-none focus:ring-1 focus:ring-[#9B1C31]"
                >
                  {stock.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name} (Cur: {it.current_pieces ?? 0} pcs &bull; {formatWeightKg(it.current_balance_kg)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                  Action Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('ADD')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      adjustType === 'ADD'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-500'
                        : 'bg-[#FAF6EF] text-[#66615C] border-[#E8DFD5]'
                    }`}
                  >
                    ＋ Inward / Add Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('REMOVE')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      adjustType === 'REMOVE'
                        ? 'bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-500'
                        : 'bg-[#FAF6EF] text-[#66615C] border-[#E8DFD5]'
                    }`}
                  >
                    － Outward / Deduct Stock
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                    Pieces (pcs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={adjustPieces === 0 ? '' : adjustPieces}
                    onChange={(e) => setAdjustPieces(parseInt(e.target.value, 10) || 0)}
                    placeholder="0 pcs"
                    className="w-full bg-[#FAF6EF] border border-[#E8DFD5] text-xs rounded-xl px-3 py-2 text-[#2B2B2B] focus:outline-none focus:ring-1 focus:ring-[#9B1C31]"
                  />
                </div>
                <WeightInput
                  label="Weight in Kg"
                  value={adjustWeightKg}
                  onChange={setAdjustWeightKg}
                />
              </div>

              <Input
                label="Reason / Reference Note"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="e.g. Physical inventory count, workshop inward"
              />

              {/* Preview Box */}
              {selectedAdjustItem && (
                <div className="bg-[#FAF6EF] p-3 rounded-xl border border-[#E8DFD5] text-xs space-y-1">
                  <div className="text-[10px] font-bold text-[#8C857E] uppercase">Balance Impact Preview</div>
                  <div className="flex justify-between">
                    <span className="text-[#66615C]">Current:</span>
                    <span className="font-semibold">{curPieces} pcs &bull; {formatWeightKg(curWeight)}</span>
                  </div>
                  <div className={`flex justify-between font-bold ${adjustType === 'ADD' ? 'text-emerald-700' : 'text-rose-700'}`}>
                    <span>Adjustment:</span>
                    <span>{adjustType === 'ADD' ? '+' : '-'}{adjustPieces} pcs &bull; {adjustType === 'ADD' ? '+' : '-'}{formatWeightKg(adjustWeightKg)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-[#9B1C31] border-t border-[#E8DFD5] pt-1">
                    <span>Resulting Stock:</span>
                    <span>{previewPieces} pcs &bull; {formatWeightKg(previewWeight)}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-3">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  disabled={isSavingAdjust}
                >
                  Cancel
                </Button>
                <Button variant="primary" type="submit" isLoading={isSavingAdjust}>
                  Confirm {adjustType === 'ADD' ? 'Stock Addition' : 'Stock Adjustment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

