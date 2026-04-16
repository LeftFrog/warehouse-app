import { useState, useEffect } from 'react';
import { api } from '../api.js';
import ProductForm from './ProductForm.jsx';

export default function SkidDetail({ skidKey, onBack }) {
  const [sec, lvl, pl] = skidKey.split('-');
  const [skid, setSkid] = useState(null);
  const [places, setPlaces] = useState(1);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);

  const reload = async () => {
    const s = await api.getSkid(sec, lvl, pl);
    setSkid(s);
    const cfg = await api.getConfig();
    setPlaces(cfg[`${sec}-${lvl}`]?.places || 1);
  };

  useEffect(() => { reload(); }, [skidKey]);

  if (!skid) return <div className="loading">Loading...</div>;

  const handleVerify = async () => {
    await api.toggleVerified(sec, lvl, pl);
    reload();
  };

  const handleOrderChange = async (isOrder) => {
    await api.updateOrder(sec, lvl, pl, { is_order: isOrder, so_number: isOrder ? skid.so_number : '' });
    reload();
  };

  const handleSOChange = async (soNum) => {
    await api.updateOrder(sec, lvl, pl, { is_order: true, so_number: soNum });
    reload();
  };

  const handlePlaces = async (p) => {
    await api.setPlaces(sec, lvl, p);
    setPlaces(p);
  };

  const handleAdd = async (product) => {
    await api.addProduct(sec, lvl, pl, product);
    setAdding(false);
    reload();
  };

  const handleUpdate = async (id, product) => {
    await api.updateProduct(id, product);
    setEditing(null);
    reload();
  };

  const handleDelete = async (id) => {
    await api.deleteProduct(id);
    setEditing(null);
    reload();
  };

  return (
    <div>
      <div className="header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1>📍 {skidKey}{skid.is_order ? ' 📦' : ''}</h1>
      </div>

      <div className="verify-row">
        <button className={`verify-btn ${skid.verified ? 'on' : 'off'}`} onClick={handleVerify}>
          {skid.verified ? '✅ Verified' : '☐ Mark Verified'}
        </button>
        {skid.verified_at && <span className="verified-time">Last verified: {new Date(skid.verified_at).toLocaleString()}</span>}
      </div>

      <div className="order-row">
        <label className="order-chk">
          <input type="checkbox" checked={!!skid.is_order} onChange={e => handleOrderChange(e.target.checked)} /> Order/SO
        </label>
        {skid.is_order && (
          <input className="so-input" placeholder="SO #" defaultValue={skid.so_number || ''}
            onBlur={e => handleSOChange(e.target.value)} />
        )}
      </div>

      <div className="config-row">
        <span className="config-label">Rack places at {sec} level {lvl}:</span>
        <button className={`toggle ${places === 1 ? 'active' : 'inactive'}`} onClick={() => handlePlaces(1)}>Single</button>
        <button className={`toggle ${places === 2 ? 'active' : 'inactive'}`} onClick={() => handlePlaces(2)}>Double</button>
      </div>

      <div className="products-header">
        <h2 className="subtitle">Products ({skid.products?.length || 0})</h2>
        <button className="add-btn" onClick={() => { setAdding(true); setEditing(null); }}>+ Add Product</button>
      </div>

      {adding && <ProductForm onSave={handleAdd} onCancel={() => setAdding(false)} />}
      {!adding && (!skid.products || skid.products.length === 0) && <div className="empty-msg">No products on this skid yet.</div>}

      {skid.products?.map(p => (
        editing === p.id ? (
          <ProductForm key={p.id} initial={p}
            onSave={(data) => handleUpdate(p.id, data)}
            onCancel={() => setEditing(null)}
            onDelete={() => handleDelete(p.id)} />
        ) : (
          <div key={p.id} className="product-card" onClick={() => { setEditing(p.id); setAdding(false); }}>
            <div className="product-name">{p.name}</div>
            <div className="product-meta">
              <span className="qty-badge">{p.qty} pcs</span>
            </div>
            {p.notes && <div className="product-notes">{p.notes}</div>}
          </div>
        )
      ))}
    </div>
  );
}
