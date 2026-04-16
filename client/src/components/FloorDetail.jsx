import { useState, useEffect } from 'react';
import { api } from '../api.js';
import ProductForm from './ProductForm.jsx';

export default function FloorDetail({ floorId, onBack }) {
  const [floor, setFloor] = useState(null);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);

  const reload = async () => {
    const floors = await api.getFloor();
    setFloor(floors.find(f => f.id === floorId));
  };

  useEffect(() => { reload(); }, [floorId]);

  if (!floor) return <div className="loading">Loading...</div>;

  const handleVerify = async () => { await api.toggleFloorVerified(floorId); reload(); };

  const handleOrderChange = async (isOrder) => {
    await api.updateFloorSkid(floorId, { is_order: isOrder, so_number: isOrder ? floor.so_number : '' });
    reload();
  };

  const handleSOChange = async (soNum) => {
    await api.updateFloorSkid(floorId, { is_order: true, so_number: soNum });
    reload();
  };

  const handleNameChange = async (name) => {
    await api.updateFloorSkid(floorId, { name });
    reload();
  };

  const handleAdd = async (product) => {
    await api.addFloorProduct(floorId, product);
    setAdding(false); reload();
  };

  const handleUpdate = async (id, product) => {
    await api.updateFloorProduct(id, product);
    setEditing(null); reload();
  };

  const handleDelete = async (id) => {
    await api.deleteFloorProduct(id);
    setEditing(null); reload();
  };

  const handleDeleteFloor = async () => {
    if (confirm('Delete this floor skid?')) { await api.deleteFloorSkid(floorId); onBack(); }
  };

  return (
    <div>
      <div className="header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1>📍 Floor: {floor.name}{floor.is_order ? ' 📦' : ''}</h1>
      </div>

      <div style={{ marginBottom: 12 }}>
        <input className="form-input" defaultValue={floor.name} placeholder="Skid name..."
          style={{ marginBottom: 0 }} onBlur={e => { if (e.target.value !== floor.name) handleNameChange(e.target.value); }} />
      </div>

      <div className="verify-row">
        <button className={`verify-btn ${floor.verified ? 'on' : 'off'}`} onClick={handleVerify}>
          {floor.verified ? '✅ Verified' : '☐ Mark Verified'}
        </button>
        {floor.verified_at && <span className="verified-time">Last verified: {new Date(floor.verified_at).toLocaleString()}</span>}
      </div>

      <div className="order-row">
        <label className="order-chk">
          <input type="checkbox" checked={!!floor.is_order} onChange={e => handleOrderChange(e.target.checked)} /> Order/SO
        </label>
        {floor.is_order && (
          <input className="so-input" placeholder="SO #" defaultValue={floor.so_number || ''}
            onBlur={e => handleSOChange(e.target.value)} />
        )}
      </div>

      <div className="products-header">
        <h2 className="subtitle">Products ({floor.products?.length || 0})</h2>
        <button className="add-btn" onClick={() => { setAdding(true); setEditing(null); }}>+ Add Product</button>
      </div>

      {adding && <ProductForm onSave={handleAdd} onCancel={() => setAdding(false)} />}
      {!adding && (!floor.products || floor.products.length === 0) && <div className="empty-msg">No products yet.</div>}

      {floor.products?.map(p => (
        editing === p.id ? (
          <ProductForm key={p.id} initial={p}
            onSave={(data) => handleUpdate(p.id, data)}
            onCancel={() => setEditing(null)}
            onDelete={() => handleDelete(p.id)} />
        ) : (
          <div key={p.id} className="product-card" onClick={() => { setEditing(p.id); setAdding(false); }}>
            <div className="product-name">{p.name}</div>
            <div className="product-meta"><span className="qty-badge">{p.qty} pcs</span></div>
            {p.notes && <div className="product-notes">{p.notes}</div>}
          </div>
        )
      ))}

      <div style={{ marginTop: 16 }}>
        <button className="del-floor" onClick={handleDeleteFloor}>Delete Floor Skid</button>
      </div>
    </div>
  );
}
