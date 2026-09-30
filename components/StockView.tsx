'use client'

import React, { useState } from 'react';
import { Item } from '@/lib/api/types';
import { createItem } from '@/lib/api/services';

interface StockViewProps {
  items: Item[];
  onRefresh: () => void;
}

export function StockView({ items, onRefresh }: StockViewProps) {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Gold Ornaments');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createItem({ name: itemName, category });
      setShowAddItem(false);
      setItemName('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error creating item');
    }
  };

  return (
    <div>
      <div className="welcome-row">
        <div>
          <h2>Stock Register & Inventory</h2>
          <p>Real-time physical stock in pieces and kilograms derived from append-only stock movements.</p>
        </div>
        <button className="primary-button" onClick={() => setShowAddItem(true)}>
          ＋ Add New Item
        </button>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Category</th>
              <th style={{ textAlign: 'right' }}>Stock Pieces</th>
              <th style={{ textAlign: 'right' }}>Stock Weight (Kg)</th>
              <th style={{ textAlign: 'center' }}>Movement Audit</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td data-label="Item Name"><strong>{item.name}</strong></td>
                <td data-label="Category"><span style={{ color: '#7A7268' }}>{item.category || 'Standard'}</span></td>
                <td data-label="Pieces" style={{ textAlign: 'right', fontWeight: 700 }} className="tabular-numbers">
                  {item.stock_pieces} pcs
                </td>
                <td data-label="Weight" style={{ textAlign: 'right', fontWeight: 700, color: '#9B1C31' }} className="tabular-numbers">
                  {parseFloat(String(item.stock_kg)).toFixed(3)} Kg
                </td>
                <td data-label="History" style={{ textAlign: 'center' }}>
                  <button className="btn-secondary" onClick={() => setSelectedItem(item)}>
                    Inspect Movements ↗
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Movement History Drawer Modal */}
      {selectedItem && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3>Stock Movements: {selectedItem.name}</h3>
              <button className="close-btn" onClick={() => setSelectedItem(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#FAF6F2', padding: 12, borderRadius: 8, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>Current Stock: <strong>{selectedItem.stock_pieces} pcs</strong></span>
                <span>Net Weight: <strong style={{ color: '#9B1C31' }}>{parseFloat(String(selectedItem.stock_kg)).toFixed(3)} Kg</strong></span>
              </div>

              <div style={{ marginTop: 12 }}>
                <h4 style={{ fontSize: 13, marginBottom: 8, color: '#7A7268' }}>Immutable Movement Records</h4>
                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#FAF6F2' }}>
                      <th style={{ padding: 8, textAlign: 'left' }}>Time</th>
                      <th style={{ padding: 8, textAlign: 'left' }}>Source</th>
                      <th style={{ padding: 8, textAlign: 'right' }}>Pcs Δ</th>
                      <th style={{ padding: 8, textAlign: 'right' }}>Weight Δ (Kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid var(--line)' }}>
                      <td style={{ padding: 8 }}>30/09/2026 10:30</td>
                      <td style={{ padding: 8 }}>Sale #1048</td>
                      <td style={{ padding: 8, textAlign: 'right', color: '#DC2626' }}>-1</td>
                      <td style={{ padding: 8, textAlign: 'right', color: '#DC2626' }}>-0.150 Kg</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--line)' }}>
                      <td style={{ padding: 8 }}>29/09/2026 16:00</td>
                      <td style={{ padding: 8 }}>Purchase #5001</td>
                      <td style={{ padding: 8, textAlign: 'right', color: '#059669' }}>+5</td>
                      <td style={{ padding: 8, textAlign: 'right', color: '#059669' }}>+0.500 Kg</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedItem(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: 440 }}>
            <form onSubmit={handleCreate}>
              <div className="modal-header">
                <h3>Add New Inventory Item</h3>
                <button type="button" className="close-btn" onClick={() => setShowAddItem(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Item Name</label>
                  <input className="form-input" required value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g. Gold Jhumka 22K" />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="Gold Ornaments">Gold Ornaments</option>
                    <option value="Silver Ornaments">Silver Ornaments</option>
                    <option value="Diamond Studded">Diamond Studded</option>
                    <option value="Stones">Loose Stones</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAddItem(false)}>Cancel</button>
                <button type="submit" className="primary-button">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
