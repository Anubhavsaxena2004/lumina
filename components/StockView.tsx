'use client'

import React, { useState } from 'react';
import { Item, StockMovement } from '@/lib/api/types';
import { createItem, adjustStock, getItemMovements } from '@/lib/api/services';

interface StockViewProps {
  items: Item[];
  onRefresh: () => void;
}

export function StockView({ items, onRefresh }: StockViewProps) {
  // Add New Item Modal State
  const [showAddItem, setShowAddItem] = useState(false);
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Gold Ornaments');
  const [stockPieces, setStockPieces] = useState<string>('');
  const [stockKg, setStockKg] = useState<string>('');
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);

  // Add / Adjust Stock Modal State
  const [showAdjustStock, setShowAdjustStock] = useState(false);
  const [adjustItemId, setAdjustItemId] = useState<string>('');
  const [adjustType, setAdjustType] = useState<'ADD' | 'REMOVE'>('ADD');
  const [adjustPieces, setAdjustPieces] = useState<string>('');
  const [adjustKg, setAdjustKg] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);

  // Movement History Drawer State
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  // Target item being adjusted
  const targetAdjustItem = items.find((i) => i.id === adjustItemId) || items[0] || null;

  // Handle Create New Item with Opening Stock
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      alert('Item name is required');
      return;
    }

    setIsSubmittingItem(true);
    try {
      const p = parseInt(stockPieces, 10) || 0;
      const w = parseFloat(stockKg) || 0;

      await createItem({
        name: itemName.trim(),
        category,
        stock_pieces: p,
        stock_kg: w,
      });

      setShowAddItem(false);
      setItemName('');
      setCategory('Gold Ornaments');
      setStockPieces('');
      setStockKg('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error creating item');
    } finally {
      setIsSubmittingItem(false);
    }
  };

  // Handle Open Adjust Stock Modal
  const handleOpenAdjust = (item?: Item | null) => {
    const itemToSet = item || items[0] || null;
    if (itemToSet) {
      setAdjustItemId(itemToSet.id);
    }
    setAdjustType('ADD');
    setAdjustPieces('');
    setAdjustKg('');
    setAdjustReason('');
    setShowAdjustStock(true);
  };

  // Handle Submit Stock Adjustment
  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAdjustItem) {
      alert('Please select an item to adjust');
      return;
    }

    const p = parseInt(adjustPieces, 10) || 0;
    const w = parseFloat(adjustKg) || 0;

    if (p === 0 && w === 0) {
      alert('Please enter stock pieces or weight (Kg) to add or adjust');
      return;
    }

    setIsSubmittingAdjust(true);
    try {
      const piecesDelta = adjustType === 'ADD' ? p : -p;
      const kgDelta = adjustType === 'ADD' ? w : -w;

      await adjustStock({
        item_id: targetAdjustItem.id,
        pieces_delta: piecesDelta,
        kg_delta: kgDelta,
        reason: adjustReason.trim() || (adjustType === 'ADD' ? 'Manual Stock Inward' : 'Manual Stock Deduction'),
      });

      setShowAdjustStock(false);
      setAdjustPieces('');
      setAdjustKg('');
      setAdjustReason('');
      onRefresh();

      // If movements drawer is currently open for this item, refresh movements too
      if (selectedItem && selectedItem.id === targetAdjustItem.id) {
        handleOpenHistory(targetAdjustItem);
      }
    } catch (err: any) {
      alert(err.message || 'Error adjusting stock');
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  // Handle Open History Drawer
  const handleOpenHistory = async (item: Item) => {
    setSelectedItem(item);
    setLoadingMovements(true);
    try {
      const data = await getItemMovements(item.id);
      setMovements(data);
    } catch {
      setMovements([]);
    } finally {
      setLoadingMovements(false);
    }
  };

  // Calculation for live preview during stock adjustment
  const currentP = targetAdjustItem ? targetAdjustItem.stock_pieces : 0;
  const currentW = targetAdjustItem ? parseFloat(String(targetAdjustItem.stock_kg)) : 0;
  const inputP = parseInt(adjustPieces, 10) || 0;
  const inputW = parseFloat(adjustKg) || 0;
  const previewP = adjustType === 'ADD' ? currentP + inputP : Math.max(0, currentP - inputP);
  const previewW = adjustType === 'ADD'
    ? Math.round((currentW + inputW) * 1000) / 1000
    : Math.max(0, Math.round((currentW - inputW) * 1000) / 1000);

  return (
    <div>
      {/* Header Row */}
      <div className="welcome-row">
        <div>
          <h2>Stock Register & Inventory</h2>
          <p>Real-time physical stock in pieces and kilograms derived from append-only stock movements.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="btn-secondary"
            style={{
              minHeight: 44,
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: 700,
              borderColor: '#B8893B',
              color: '#B8893B',
            }}
            onClick={() => handleOpenAdjust(null)}
          >
            <span>＋</span> Add / Adjust Stock
          </button>
          <button className="primary-button" onClick={() => setShowAddItem(true)}>
            ＋ Add New Item
          </button>
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Category</th>
              <th style={{ textAlign: 'right' }}>Stock Pieces</th>
              <th style={{ textAlign: 'right' }}>Stock Weight (Kg)</th>
              <th style={{ textAlign: 'center' }}>Movement Audit & Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td data-label="Item Name">
                  <strong>{item.name}</strong>
                </td>
                <td data-label="Category">
                  <span style={{ color: '#7A7268' }}>{item.category || 'Standard'}</span>
                </td>
                <td data-label="Pieces" style={{ textAlign: 'right', fontWeight: 700 }} className="tabular-numbers">
                  {item.stock_pieces} pcs
                </td>
                <td data-label="Weight" style={{ textAlign: 'right', fontWeight: 700, color: '#9B1C31' }} className="tabular-numbers">
                  {parseFloat(String(item.stock_kg)).toFixed(3)} Kg
                </td>
                <td data-label="Actions" style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
                    <button
                      className="primary-button"
                      style={{
                        minHeight: 34,
                        padding: '0 12px',
                        fontSize: 12,
                        background: '#9B1C31',
                        boxShadow: 'none',
                      }}
                      onClick={() => handleOpenAdjust(item)}
                      title={`Add or adjust stock for ${item.name}`}
                    >
                      + Add Stock
                    </button>
                    <button
                      className="btn-secondary"
                      style={{ minHeight: 34, padding: '0 12px', fontSize: 12 }}
                      onClick={() => handleOpenHistory(item)}
                    >
                      Inspect Movements ↗
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal 1: Add New Inventory Item (With Initial Pieces & Weight in Kg) */}
      {showAddItem && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: 480 }}>
            <form onSubmit={handleCreate}>
              <div className="modal-header">
                <h3>Add New Inventory Item</h3>
                <button type="button" className="close-btn" onClick={() => setShowAddItem(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Item Name *</label>
                  <input
                    className="form-input"
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="e.g. Gold Bracelet 22K or Silver Payal 80T"
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="Gold Ornaments">Gold Ornaments</option>
                    <option value="Silver Ornaments">Silver Ornaments</option>
                    <option value="Diamond Studded">Diamond Studded</option>
                    <option value="Loose Stones">Loose Stones</option>
                    <option value="Bullion / Raw Metal">Bullion / Raw Metal</option>
                  </select>
                </div>

                {/* Stock Pieces and Stock Weight in Kg */}
                <div style={{ background: '#FAF6F2', border: '1px solid #E9E0D7', borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#9B1C31', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Initial / Opening Stock Balance
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Opening Pieces (pcs)</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="form-input tabular-numbers"
                        value={stockPieces}
                        onChange={(e) => setStockPieces(e.target.value)}
                        placeholder="0 pcs"
                      />
                    </div>

                    <div className="form-group">
                      <label>Opening Weight (Kg)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        className="form-input tabular-numbers"
                        value={stockKg}
                        onChange={(e) => setStockKg(e.target.value)}
                        placeholder="0.000 Kg"
                      />
                    </div>
                  </div>

                  <small style={{ color: '#7A7268', fontSize: 11, display: 'block', marginTop: 8 }}>
                    Weight is recorded in Kilograms strictly to 3 decimal places (e.g. 0.250 Kg = 250 grams).
                  </small>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAddItem(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={isSubmittingItem}>
                  {isSubmittingItem ? 'Saving...' : 'Save Item & Record Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add / Adjust Stock for Existing Item */}
      {showAdjustStock && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: 500 }}>
            <form onSubmit={handleAdjustSubmit}>
              <div className="modal-header">
                <h3>Add or Adjust Stock</h3>
                <button type="button" className="close-btn" onClick={() => setShowAdjustStock(false)}>✕</button>
              </div>

              <div className="modal-body">
                {/* Select Item */}
                <div className="form-group">
                  <label>Select Inventory Item *</label>
                  <select
                    className="form-select"
                    value={adjustItemId}
                    onChange={(e) => setAdjustItemId(e.target.value)}
                    required
                  >
                    {items.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} — Current: {i.stock_pieces} pcs | {parseFloat(String(i.stock_kg)).toFixed(3)} Kg
                      </option>
                    ))}
                  </select>
                </div>

                {/* Adjustment Mode Toggle */}
                <div className="form-group">
                  <label>Adjustment Direction</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <button
                      type="button"
                      className={adjustType === 'ADD' ? 'primary-button' : 'btn-secondary'}
                      style={{
                        minHeight: 38,
                        background: adjustType === 'ADD' ? '#059669' : undefined,
                        borderColor: adjustType === 'ADD' ? '#059669' : undefined,
                      }}
                      onClick={() => setAdjustType('ADD')}
                    >
                      ＋ Add Inward Stock
                    </button>
                    <button
                      type="button"
                      className={adjustType === 'REMOVE' ? 'primary-button' : 'btn-secondary'}
                      style={{
                        minHeight: 38,
                        background: adjustType === 'REMOVE' ? '#DC2626' : undefined,
                        borderColor: adjustType === 'REMOVE' ? '#DC2626' : undefined,
                      }}
                      onClick={() => setAdjustType('REMOVE')}
                    >
                      − Deduct Outward Stock
                    </button>
                  </div>
                </div>

                {/* Stock Pieces & Weight Inputs */}
                <div className="form-grid">
                  <div className="form-group">
                    <label>{adjustType === 'ADD' ? 'Pieces to Add (pcs)' : 'Pieces to Deduct (pcs)'} *</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="form-input tabular-numbers"
                      required
                      value={adjustPieces}
                      onChange={(e) => setAdjustPieces(e.target.value)}
                      placeholder="0"
                      autoFocus
                    />
                  </div>

                  <div className="form-group">
                    <label>{adjustType === 'ADD' ? 'Weight to Add (Kg)' : 'Weight to Deduct (Kg)'} *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      className="form-input tabular-numbers"
                      required
                      value={adjustKg}
                      onChange={(e) => setAdjustKg(e.target.value)}
                      placeholder="0.000"
                    />
                  </div>
                </div>

                {/* Reason / Reference */}
                <div className="form-group">
                  <label>Reason / Reference Notes</label>
                  <input
                    className="form-input"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder="e.g. Physical inventory count, workshop inward, sample lot"
                  />
                </div>

                {/* Real-time Calculation Summary Card */}
                {targetAdjustItem && (
                  <div style={{ background: '#FAF6F2', border: '1px solid #E9E0D7', borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#7A7268', textTransform: 'uppercase', marginBottom: 6 }}>
                      Balance Impact Preview
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span>Current Stock:</span>
                      <strong>{currentP} pcs &bull; {currentW.toFixed(3)} Kg</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4, color: adjustType === 'ADD' ? '#059669' : '#DC2626' }}>
                      <span>Adjustment:</span>
                      <strong>{adjustType === 'ADD' ? '+' : '-'}{inputP} pcs &bull; {adjustType === 'ADD' ? '+' : '-'}{inputW.toFixed(3)} Kg</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderTop: '1px solid #E9E0D7', paddingTop: 6, marginTop: 4 }}>
                      <span>Resulting Balance:</span>
                      <strong style={{ color: '#9B1C31' }}>{previewP} pcs &bull; {previewW.toFixed(3)} Kg</strong>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAdjustStock(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={isSubmittingAdjust}>
                  {isSubmittingAdjust ? 'Updating...' : `Confirm ${adjustType === 'ADD' ? 'Addition' : 'Adjustment'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Movement History Drawer Modal */}
      {selectedItem && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Stock Movements: {selectedItem.name}</h3>
                <span style={{ fontSize: 11, color: '#7A7268' }}>Category: {selectedItem.category || 'Standard'}</span>
              </div>
              <button className="close-btn" onClick={() => setSelectedItem(null)}>✕</button>
            </div>

            <div className="modal-body">
              <div style={{ background: '#FAF6F2', border: '1px solid #E9E0D7', padding: 14, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <div>
                  <span>Current Physical Stock: <strong>{selectedItem.stock_pieces} pcs</strong></span>
                  <span style={{ marginLeft: 16 }}>Net Weight: <strong style={{ color: '#9B1C31' }}>{parseFloat(String(selectedItem.stock_kg)).toFixed(3)} Kg</strong></span>
                </div>
                <button
                  className="primary-button"
                  style={{ minHeight: 32, padding: '0 12px', fontSize: 11 }}
                  onClick={() => {
                    handleOpenAdjust(selectedItem);
                  }}
                >
                  ＋ Add Stock
                </button>
              </div>

              <div style={{ marginTop: 12 }}>
                <h4 style={{ fontSize: 12, marginBottom: 8, color: '#7A7268', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Immutable Stock Movement Audit Trail
                </h4>

                {loadingMovements ? (
                  <div style={{ padding: 24, textAlign: 'center', color: '#7A7268', fontSize: 12 }}>
                    Loading audit movements...
                  </div>
                ) : movements.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: '#7A7268', fontSize: 12, background: '#FAF6F2', borderRadius: 8 }}>
                    No stock movements recorded yet for this item. Use <strong>"+ Add Stock"</strong> to record physical count or inward inventory.
                  </div>
                ) : (
                  <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#FAF6F2' }}>
                        <th style={{ padding: 8, textAlign: 'left', borderBottom: '1px solid var(--line)' }}>Time</th>
                        <th style={{ padding: 8, textAlign: 'left', borderBottom: '1px solid var(--line)' }}>Source / Event</th>
                        <th style={{ padding: 8, textAlign: 'left', borderBottom: '1px solid var(--line)' }}>Reference</th>
                        <th style={{ padding: 8, textAlign: 'right', borderBottom: '1px solid var(--line)' }}>Pcs Δ</th>
                        <th style={{ padding: 8, textAlign: 'right', borderBottom: '1px solid var(--line)' }}>Weight Δ (Kg)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movements.map((m: StockMovement, idx: number) => {
                        const isPos = m.pieces_delta > 0 || m.kg_delta > 0;
                        const isZero = m.pieces_delta === 0 && m.kg_delta === 0;
                        const color = isZero ? '#7A7268' : isPos ? '#059669' : '#DC2626';

                        return (
                          <tr key={m.id || idx} style={{ borderBottom: '1px solid var(--line)' }}>
                            <td style={{ padding: 8, whiteSpace: 'nowrap' }}>
                              {new Date(m.entry_at).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}{' '}
                              {new Date(m.entry_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </td>
                            <td style={{ padding: 8, fontWeight: 600 }}>{m.source_type}</td>
                            <td style={{ padding: 8, color: '#7A7268' }}>{m.reference || '-'}</td>
                            <td style={{ padding: 8, textAlign: 'right', fontWeight: 700, color }} className="tabular-numbers">
                              {m.pieces_delta > 0 ? `+${m.pieces_delta}` : m.pieces_delta}
                            </td>
                            <td style={{ padding: 8, textAlign: 'right', fontWeight: 700, color }} className="tabular-numbers">
                              {m.kg_delta > 0 ? `+${parseFloat(String(m.kg_delta)).toFixed(3)}` : parseFloat(String(m.kg_delta)).toFixed(3)} Kg
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedItem(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
