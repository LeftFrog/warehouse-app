import { useState, useEffect, useRef } from 'react';
import { api } from '../api.js';

export default function ProductForm({ initial, onSave, onCancel, onDelete, requireSku = false, skuCategory = '' }) {
  const [name, setName] = useState(initial?.name || '');
  const [qty, setQty] = useState(initial?.qty?.toString() || '');
  const [notes, setNotes] = useState(initial?.notes || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isValidSku, setIsValidSku] = useState(!requireSku); // if not required, always valid
  const [selectedSku, setSelectedSku] = useState(null);
  const qtyRef = useRef();

  const handleNameChange = async (val) => {
    setName(val);
    setIsValidSku(!requireSku);
    setSelectedSku(null);

    if (val.trim().length >= 2) {
      const results = await api.searchSkus(val, skuCategory);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSku = (sku) => {
    setName(sku.acumatica_id);
    setSelectedSku(sku);
    setIsValidSku(true);
    setShowSuggestions(false);
    qtyRef.current?.focus();
  };

  const handleSave = () => {
    if (!name || !qty) return;
    if (requireSku && !isValidSku) return;
    onSave({
      name: selectedSku ? selectedSku.acumatica_id : name.trim(),
      qty: parseInt(qty) || 0,
      notes: notes.trim()
    });
  };

  return (
    <div className="form-card">
      <div className="autocomplete">
        <input
          className={`form-input ${requireSku && name && !isValidSku ? 'input-invalid' : ''}`}
          placeholder={requireSku ? "Search SKU..." : "SKU / Product name"}
          value={name}
          onChange={e => handleNameChange(e.target.value)}
          onFocus={() => name.trim() && handleNameChange(name)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          autoFocus
        />
        {requireSku && name && !isValidSku && (
          <div className="validation-msg">Select a valid SKU from the list</div>
        )}
        {isValidSku && selectedSku && (
          <div className="sku-preview">{selectedSku.product_name}</div>
        )}
        {showSuggestions && (
          <div className="ac-list">
            {suggestions.map(s => (
              <div key={s.id} className="ac-item" onMouseDown={() => selectSku(s)}>
                <span className="ac-id">{s.acumatica_id}</span>
                <span className="ac-name">{s.product_name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <input className="form-input" placeholder="Quantity" type="number"
        value={qty} onChange={e => setQty(e.target.value)} ref={qtyRef} />
      <input className="form-input" placeholder="Notes (optional)"
        value={notes} onChange={e => setNotes(e.target.value)} />
      <div className="form-actions">
        <button className="btn-save" onClick={handleSave}
          disabled={requireSku && !isValidSku}>
          {initial ? 'Update' : 'Add'}
        </button>
        <button className="btn-cancel" onClick={onCancel}>Cancel</button>
        {initial && onDelete && <button className="btn-delete" onClick={onDelete}>Delete</button>}
      </div>
    </div>
  );
}