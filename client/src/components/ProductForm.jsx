import { useState, useEffect, useRef } from 'react';
import { api } from '../api.js';

export default function ProductForm({ initial, onSave, onCancel, onDelete }) {
  const [name, setName] = useState(initial?.name || '');
  const [qty, setQty] = useState(initial?.qty?.toString() || '');
  const [notes, setNotes] = useState(initial?.notes || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [knownProducts, setKnownProducts] = useState([]);
  const qtyRef = useRef();

  useEffect(() => {
    api.getKnownProducts().then(setKnownProducts);
  }, []);

  const handleNameChange = (val) => {
    setName(val);
    if (val.trim()) {
      const q = val.toLowerCase();
      const matches = knownProducts.filter(p => p.toLowerCase().includes(q)).slice(0, 8);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (s) => {
    setName(s);
    setShowSuggestions(false);
    qtyRef.current?.focus();
  };

  const handleSave = () => {
    if (name && qty) onSave({ name: name.trim(), qty: parseInt(qty) || 0, notes: notes.trim() });
  };

  return (
    <div className="form-card">
      <div className="autocomplete">
        <input className="form-input" placeholder="SKU / Product name" value={name}
          onChange={e => handleNameChange(e.target.value)}
          onFocus={() => name.trim() && handleNameChange(name)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          autoFocus />
        {showSuggestions && (
          <div className="ac-list">
            {suggestions.map((s, i) => (
              <div key={i} className="ac-item" onMouseDown={() => selectSuggestion(s)}>{s}</div>
            ))}
          </div>
        )}
      </div>
      <input className="form-input" placeholder="Quantity" type="number" value={qty}
        onChange={e => setQty(e.target.value)} ref={qtyRef} />
      <input className="form-input" placeholder="Notes (optional)" value={notes}
        onChange={e => setNotes(e.target.value)} />
      <div className="form-actions">
        <button className="btn-save" onClick={handleSave}>{initial ? 'Update' : 'Add'}</button>
        <button className="btn-cancel" onClick={onCancel}>Cancel</button>
        {initial && onDelete && <button className="btn-delete" onClick={onDelete}>Delete</button>}
      </div>
    </div>
  );
}
