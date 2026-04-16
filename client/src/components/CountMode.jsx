import { useState, useEffect, useRef } from 'react';
import { api } from '../api.js';

export default function CountMode({ onExit }) {
  const [queue, setQueue] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [filter, setFilter] = useState('unverified');
  const [sectionFilter, setSectionFilter] = useState('');
  const [localQtys, setLocalQtys] = useState({});
  const [pendingChanges, setPendingChanges] = useState([]);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const inputRefs = useRef({});

  const loadQueue = async () => {
    const data = await api.getCountQueue(filter, sectionFilter);
    const combined = [...data.rack, ...data.floor];
    setQueue(combined);
    setCurrentIdx(0);
    setDone(false);
    // Init local qtys
    const qtys = {};
    for (const skid of combined) {
      for (const p of skid.products) {
        qtys[p.id] = p.qty;
      }
    }
    setLocalQtys(qtys);
    setPendingChanges([]);
  };

  useEffect(() => { if (started) loadQueue(); }, [started, filter, sectionFilter]);

  const current = queue[currentIdx];
  const progress = queue.length > 0 ? Math.round(((currentIdx) / queue.length) * 100) : 0;

  const handleQtyChange = (productId, newQty, isFloor) => {
    setLocalQtys(prev => ({ ...prev, [productId]: newQty }));
    setPendingChanges(prev => {
      const existing = prev.filter(p => p.productId !== productId);
      return [...existing, { productId, newQty: parseInt(newQty) || 0, isFloor: !!isFloor }];
    });
  };

  const handleConfirm = async () => {
    if (!current) return;
    // Submit any qty changes for this skid
    const skidChanges = pendingChanges.filter(c => 
      current.products.some(p => p.id === c.productId)
    );
    if (skidChanges.length > 0) {
      await api.submitCountUpdates(skidChanges);
      setPendingChanges(prev => prev.filter(c => !skidChanges.includes(c)));
    }
    // Mark verified
    if (current.isFloor) {
      await api.toggleFloorVerified(current.id);
    } else {
      await api.toggleVerified(current.section, current.level, current.place);
    }

    if (currentIdx < queue.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setDone(true);
    }
  };

  const handleSkip = () => {
    if (currentIdx < queue.length - 1) setCurrentIdx(currentIdx + 1);
    else setDone(true);
  };

  // Start screen
  if (!started) {
    return (
      <div>
        <div className="header">
          <button className="back-btn" onClick={onExit}>← Back</button>
          <h1>📋 Count Mode</h1>
        </div>
        <div className="count-setup">
          <p className="count-desc">Walk through skids one at a time, verify quantities, and mark each as counted.</p>
          
          <div className="count-option">
            <label className="count-label">What to count:</label>
            <div className="count-toggles">
              <button className={`toggle ${filter === 'unverified' ? 'active' : 'inactive'}`} onClick={() => setFilter('unverified')}>Unverified Only</button>
              <button className={`toggle ${filter === 'all' ? 'active' : 'inactive'}`} onClick={() => setFilter('all')}>Everything</button>
              <button className={`toggle ${filter === 'section' ? 'active' : 'inactive'}`} onClick={() => setFilter('section')}>By Section</button>
            </div>
          </div>

          {filter === 'section' && (
            <div className="count-option">
              <label className="count-label">Section:</label>
              <select className="count-select" value={sectionFilter} onChange={e => setSectionFilter(e.target.value)}>
                <option value="">Select...</option>
                {["E","F","G","H","I","J","K"].map(l => <option key={l} value={l}>{l} Section</option>)}
              </select>
            </div>
          )}

          <button className="count-start-btn" onClick={() => setStarted(true)} 
            disabled={filter === 'section' && !sectionFilter}>
            Start Counting
          </button>
        </div>
      </div>
    );
  }

  // Done screen
  if (done) {
    return (
      <div>
        <div className="header">
          <button className="back-btn" onClick={onExit}>← Back</button>
          <h1>📋 Count Mode</h1>
        </div>
        <div className="count-done">
          <div className="count-done-icon">✅</div>
          <h2>Count Complete!</h2>
          <p>Verified {queue.length} skids</p>
          <button className="count-start-btn" onClick={onExit}>Back to Inventory</button>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div>
        <div className="header">
          <button className="back-btn" onClick={onExit}>← Back</button>
          <h1>📋 Count Mode</h1>
        </div>
        <div className="count-done">
          <p>No skids to count with current filter.</p>
          <button className="count-start-btn" onClick={() => setStarted(false)}>Change Filter</button>
        </div>
      </div>
    );
  }

  const locationLabel = current.isFloor ? `Floor: ${current.name}` : current.key;

  return (
    <div>
      <div className="header">
        <button className="back-btn" onClick={onExit}>← Exit</button>
        <h1>📋 Count Mode</h1>
      </div>

      {/* Progress bar */}
      <div className="count-progress">
        <div className="count-progress-bar" style={{ width: `${progress}%` }} />
        <span className="count-progress-text">{currentIdx + 1} / {queue.length}</span>
      </div>

      {/* Current skid */}
      <div className="count-skid-header">
        <h2 className="count-location">📍 {locationLabel}</h2>
        {current.is_order ? <span className="so-badge">SO {current.so_number || '?'}</span> : null}
      </div>

      <div className="count-products">
        {current.products.map(p => (
          <div key={p.id} className="count-product">
            <div className="count-product-name">{p.name}</div>
            <div className="count-product-row">
              <span className="count-expected">Expected: {p.qty}</span>
              <div className="count-input-wrap">
                <label className="count-input-label">Actual:</label>
                <input className="count-input" type="number" 
                  ref={el => inputRefs.current[p.id] = el}
                  value={localQtys[p.id] ?? p.qty}
                  onChange={e => handleQtyChange(p.id, e.target.value, current.isFloor)}
                />
              </div>
            </div>
            {(localQtys[p.id] ?? p.qty) !== p.qty && (
              <div className={`count-diff ${(localQtys[p.id] ?? p.qty) < p.qty ? 'negative' : 'positive'}`}>
                {((localQtys[p.id] ?? p.qty) - p.qty > 0 ? '+' : '')}{(localQtys[p.id] ?? p.qty) - p.qty}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="count-actions">
        <button className="count-confirm" onClick={handleConfirm}>✅ Confirm & Next</button>
        <button className="count-skip" onClick={handleSkip}>Skip →</button>
      </div>
    </div>
  );
}
