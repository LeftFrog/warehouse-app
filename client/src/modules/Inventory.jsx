import { useState, useEffect, useMemo } from 'react';
import { api } from '../api.js';
import SkidDetail from '../components/SkidDetail.jsx';
import FloorDetail from '../components/FloorDetail.jsx';
import CountMode from '../components/CountMode.jsx';
import ExcelExport from '../components/ExcelExport.jsx';
import '../styles.css';

const SECTION_MAX = { E: 22, F: 22, G: 16, H: 16, I: 19, J: 16, K: 19 };
const SECTIONS = [];
["E","F","G","H","I","J","K"].forEach(letter => {
  for (let i = 1; i <= SECTION_MAX[letter]; i++) SECTIONS.push(`${letter}${i}`);
});
const LEVELS = [6,5,4,3,2,1];

export default function Inventory() {
  const [view, setView] = useState('browse');
  const [selectedSkid, setSelectedSkid] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [showUnverifiedOnly, setShowUnverifiedOnly] = useState(false);

  const [stats, setStats] = useState({ total: 0, verified: 0, totalQty: 0 });
  const [allSkids, setAllSkids] = useState([]);
  const [config, setConfig] = useState({});
  const [floors, setFloors] = useState([]);
  const [searchResults, setSearchResults] = useState(null);

  const reload = async () => {
    const [s, sk, c, f] = await Promise.all([api.getStats(), api.getAllSkids(), api.getConfig(), api.getFloor()]);
    setStats(s);
    setAllSkids(sk);
    setConfig(c);
    setFloors(f);
  };

  useEffect(() => { reload(); }, []);

  // Search
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults(null); return; }
    const timer = setTimeout(async () => {
      const r = await api.search(searchQuery);
      // Aggregate
      const totals = {};
      for (const item of [...r.rack, ...r.floor]) {
        const k = item.name;
        if (!totals[k]) totals[k] = { name: k, qty: 0, locations: [] };
        totals[k].qty += item.qty;
        const loc = item.section ? `${item.section}-${item.level}-${item.place}` : `Floor: ${item.floor_name}`;
        totals[k].locations.push(loc);
      }
      setSearchResults(Object.values(totals));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Build skid lookup
  const skidMap = useMemo(() => {
    const map = {};
    for (const s of allSkids) {
      map[`${s.section}-${s.level}-${s.place}`] = s;
    }
    return map;
  }, [allSkids]);

  const getSkid = (sec, lvl, pl) => skidMap[`${sec}-${lvl}-${pl}`] || { products: [], verified: 0 };
  const getPlaces = (sec, lvl) => config[`${sec}-${lvl}`]?.places || 1;

  const handleExport = async () => {
    const data = await api.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `warehouse-${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        if (data.skids && confirm('This will replace all current data. Continue?')) {
          await api.importData(data);
          reload();
        }
      } catch { alert('Could not read file.'); }
    };
    input.click();
  };

  // Skid detail
  if (view === 'skid' && selectedSkid) {
    return (
      <div className="container">
        <SkidDetail skidKey={selectedSkid} onBack={() => { setView('browse'); setSelectedSkid(null); reload(); }} />
      </div>
    );
  }

  // Floor detail
  if (view === 'floor-skid' && selectedFloor) {
    return (
      <div className="container">
        <FloorDetail floorId={selectedFloor} onBack={() => { setView('browse'); setSelectedFloor(null); reload(); }} />
      </div>
    );
  }

  // Count mode
  if (view === 'count') {
    return (
      <div className="container">
        <CountMode onExit={() => { setView('browse'); reload(); }} />
      </div>
    );
  }

  // Active skids for list
  const activeSkids = allSkids.filter(s => {
    if (s.products.length === 0 && !s.verified) return false;
    if (filterSection && !s.section.startsWith(filterSection)) return false;
    if (showUnverifiedOnly && s.verified) return false;
    return true;
  });

  return (
    <div className="container">
      <div className="header"><h1>🏭 Warehouse Inventory</h1></div>

      <div className="stats">
        <div className="stat"><div className="stat-num">{stats.total}</div><div className="stat-label">Active Skids</div></div>
        <div className="stat"><div className="stat-num">{stats.verified}</div><div className="stat-label">Verified</div></div>
        <div className="stat"><div className="stat-num">{stats.totalQty}</div><div className="stat-label">Total Pcs</div></div>
      </div>

      <div className="io-row">
        <button className="io-btn" onClick={handleExport}>📥 Export JSON</button>
        <button className="io-btn" onClick={handleImport}>📤 Import JSON</button>
        <ExcelExport />
      </div>

      <div className="tabs">
        <button className={`tab ${view === 'browse' ? 'active' : ''}`} onClick={() => setView('browse')}>Browse</button>
        <button className={`tab ${view === 'search' ? 'active' : ''}`} onClick={() => setView('search')}>Search</button>
        <button className={`tab ${view === 'count' ? 'active' : ''}`} onClick={() => setView('count')}>Count</button>
      </div>

      {view === 'search' && (
        <div>
          <input className="search-input" placeholder="Search by SKU or SO number..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} autoFocus />
          {searchResults && searchResults.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h3 className="subtitle">Totals</h3>
              {searchResults.map((t, i) => (
                <div key={i} className="total-card">
                  <div className="product-name">{t.name}</div>
                  <div className="product-meta"><span className="qty-badge">{t.qty} pcs total</span></div>
                  <div className="loc-list">
                    {t.locations.map((l, j) => (
                      <span key={j} className="loc-tag" onClick={() => {
                        if (l.startsWith('Floor:')) return;
                        setSelectedSkid(l); setView('skid');
                      }}>{l}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {searchQuery.trim() && searchResults && searchResults.length === 0 && (
            <div className="empty-msg">No products found matching "{searchQuery}"</div>
          )}
        </div>
      )}

      {view === 'browse' && (
        <div>
          <div className="filter-row">
            <select value={filterSection} onChange={e => setFilterSection(e.target.value)}>
              <option value="">All Sections</option>
              {["E","F","G","H","I","J","K"].map(l => <option key={l} value={l}>{l} Section</option>)}
            </select>
            <label className="check-label">
              <input type="checkbox" checked={showUnverifiedOnly} onChange={e => setShowUnverifiedOnly(e.target.checked)} /> Unverified only
            </label>
          </div>

          <div className="rack-nav">
            {["E","F","G","H","I","J","K"].filter(l => !filterSection || l === filterSection).map(letter => {
              const secs = SECTIONS.filter(s => s.match(new RegExp(`^${letter}\\d`)));
              return (
                <div key={letter} className="letter-group">
                  <div className="letter-label">{letter}</div>
                  <div className="letter-racks">
                    {secs.map(sec => (
                      <div key={sec} className="rack-group">
                        <div className="level-row">
                          {LEVELS.map(lvl => {
                            const places = getPlaces(sec, lvl);
                            return Array.from({ length: places }, (_, pi) => {
                              const skid = getSkid(sec, lvl, pi + 1);
                              const has = skid.products?.length > 0;
                              const cls = has ? (skid.verified ? 'verified' : 'active') : 'empty';
                              const key = `${sec}-${lvl}-${pi + 1}`;
                              const label = `${lvl}${places > 1 ? (pi === 0 ? 'a' : 'b') : ''}`;
                              return (
                                <button key={key} className={`cell ${cls}`} title={key}
                                  onClick={() => { setSelectedSkid(key); setView('skid'); }}>{label}</button>
                              );
                            });
                          })}
                        </div>
                        <div className="rack-label">{letter + sec.slice(1)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="floor-section">
            <div className="floor-header">
              <h3 className="subtitle">Floor Skids ({floors.length})</h3>
              <button className="add-btn" onClick={async () => { await api.addFloorSkid(''); reload(); }}>+ Add Floor Skid</button>
            </div>
            {floors.length === 0 && <div className="empty-msg">No floor skids yet.</div>}
            {floors.map(f => (
              <div key={f.id} className="floor-skid" onClick={() => { setSelectedFloor(f.id); setView('floor-skid'); }}>
                <div className="skid-loc">{f.verified ? '✅ ' : ''}{f.name || 'Unnamed'}</div>
                <div className="skid-info">
                  {f.is_order && <span className="so-badge">SO {f.so_number || '?'}</span>}
                  {f.products?.slice(0, 2).map((p, i) => (
                    <span key={i} className="mini-product">{p.name} ({p.qty})</span>
                  ))}
                  {f.products?.length > 2 && <span className="more-tag">+{f.products.length - 2} more</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
