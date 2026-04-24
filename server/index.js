import express from 'express';
import cors from 'cors';
import db from './db.js';
import { verifyToken } from './auth.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api', verifyToken);

// === RACK SKIDS ===

// Get all rack skids with products
app.get('/api/skids', (req, res) => {
  const skids = db.prepare(`SELECT * FROM rack_skids`).all();
  const products = db.prepare(`SELECT * FROM rack_products ORDER BY id`).all();
  const productsBySkid = {};
  for (const p of products) {
    if (!productsBySkid[p.skid_id]) productsBySkid[p.skid_id] = [];
    productsBySkid[p.skid_id].push(p);
  }
  const result = skids.map(s => ({ ...s, products: productsBySkid[s.id] || [] }));
  res.json(result);
});

// Get single rack skid by location
app.get('/api/skids/:section/:level/:place', (req, res) => {
  const { section, level, place } = req.params;
  let skid = db.prepare(`SELECT * FROM rack_skids WHERE section=? AND level=? AND place=?`).get(section, +level, +place);
  if (!skid) {
    return res.json({ section, level: +level, place: +place, products: [], verified: 0, verified_at: null, is_order: 0, so_number: '' });
  }
  const products = db.prepare(`SELECT * FROM rack_products WHERE skid_id=? ORDER BY id`).all(skid.id);
  res.json({ ...skid, products });
});

// Ensure a rack skid exists, return its id
function ensureRackSkid(section, level, place) {
  let skid = db.prepare(`SELECT id FROM rack_skids WHERE section=? AND level=? AND place=?`).get(section, level, place);
  if (!skid) {
    const info = db.prepare(`INSERT INTO rack_skids (section, level, place) VALUES (?, ?, ?)`).run(section, level, place);
    return info.lastInsertRowid;
  }
  return skid.id;
}

// Add product to rack skid
app.post('/api/skids/:section/:level/:place/products', (req, res) => {
  const { section, level, place } = req.params;
  const { name, qty, notes } = req.body;
  const skidId = ensureRackSkid(section, +level, +place);
  // Reset verified on change
  db.prepare(`UPDATE rack_skids SET verified=0, verified_at=NULL, updated_at=datetime('now') WHERE id=?`).run(skidId);
  const info = db.prepare(`INSERT INTO rack_products (skid_id, name, qty, notes) VALUES (?, ?, ?, ?)`).run(skidId, name, qty || 0, notes || '');
  res.json({ id: info.lastInsertRowid, skid_id: skidId, name, qty: qty || 0, notes: notes || '' });
});

// Update product
app.put('/api/products/:id', (req, res) => {
  const { name, qty, notes } = req.body;
  db.prepare(`UPDATE rack_products SET name=?, qty=?, notes=? WHERE id=?`).run(name, qty || 0, notes || '', +req.params.id);
  const prod = db.prepare(`SELECT * FROM rack_products WHERE id=?`).get(+req.params.id);
  if (prod) {
    db.prepare(`UPDATE rack_skids SET verified=0, verified_at=NULL, updated_at=datetime('now') WHERE id=?`).run(prod.skid_id);
  }
  res.json({ ok: true });
});

// Delete product
app.delete('/api/products/:id', (req, res) => {
  const prod = db.prepare(`SELECT * FROM rack_products WHERE id=?`).get(+req.params.id);
  db.prepare(`DELETE FROM rack_products WHERE id=?`).run(+req.params.id);
  if (prod) {
    db.prepare(`UPDATE rack_skids SET verified=0, verified_at=NULL, updated_at=datetime('now') WHERE id=?`).run(prod.skid_id);
  }
  res.json({ ok: true });
});

// Toggle verified
app.put('/api/skids/:section/:level/:place/verify', (req, res) => {
  const { section, level, place } = req.params;
  const skidId = ensureRackSkid(section, +level, +place);
  const skid = db.prepare(`SELECT verified FROM rack_skids WHERE id=?`).get(skidId);
  const newVal = skid.verified ? 0 : 1;
  const verAt = newVal ? new Date().toISOString() : null;
  db.prepare(`UPDATE rack_skids SET verified=?, verified_at=?, updated_at=datetime('now') WHERE id=?`).run(newVal, verAt, skidId);
  res.json({ verified: newVal, verified_at: verAt });
});

// Update order info
app.put('/api/skids/:section/:level/:place/order', (req, res) => {
  const { section, level, place } = req.params;
  const { is_order, so_number } = req.body;
  const skidId = ensureRackSkid(section, +level, +place);
  db.prepare(`UPDATE rack_skids SET is_order=?, so_number=?, updated_at=datetime('now') WHERE id=?`).run(is_order ? 1 : 0, so_number || '', skidId);
  res.json({ ok: true });
});

// === RACK CONFIG ===

app.get('/api/config', (req, res) => {
  const configs = db.prepare(`SELECT * FROM rack_config`).all();
  const result = {};
  for (const c of configs) result[`${c.section}-${c.level}`] = { places: c.places };
  res.json(result);
});

app.put('/api/config/:section/:level', (req, res) => {
  const { section, level } = req.params;
  const { places } = req.body;
  db.prepare(`INSERT INTO rack_config (section, level, places) VALUES (?, ?, ?) ON CONFLICT(section, level) DO UPDATE SET places=?`).run(section, +level, places, places);
  res.json({ ok: true });
});

// === FLOOR SKIDS ===

app.get('/api/floor', (req, res) => {
  const floors = db.prepare(`SELECT * FROM floor_skids ORDER BY id`).all();
  const products = db.prepare(`SELECT * FROM floor_products ORDER BY id`).all();
  const productsByFloor = {};
  for (const p of products) {
    if (!productsByFloor[p.floor_skid_id]) productsByFloor[p.floor_skid_id] = [];
    productsByFloor[p.floor_skid_id].push(p);
  }
  res.json(floors.map(f => ({ ...f, products: productsByFloor[f.id] || [] })));
});

app.post('/api/floor', (req, res) => {
  const { name } = req.body;
  const info = db.prepare(`INSERT INTO floor_skids (name) VALUES (?)`).run(name || 'Floor Skid');
  res.json({ id: info.lastInsertRowid, name: name || 'Floor Skid', products: [], verified: 0, is_order: 0, so_number: '' });
});

app.put('/api/floor/:id', (req, res) => {
  const { name, is_order, so_number } = req.body;
  if (name !== undefined) db.prepare(`UPDATE floor_skids SET name=?, updated_at=datetime('now') WHERE id=?`).run(name, +req.params.id);
  if (is_order !== undefined) db.prepare(`UPDATE floor_skids SET is_order=?, so_number=?, updated_at=datetime('now') WHERE id=?`).run(is_order ? 1 : 0, so_number || '', +req.params.id);
  res.json({ ok: true });
});

app.delete('/api/floor/:id', (req, res) => {
  db.prepare(`DELETE FROM floor_products WHERE floor_skid_id=?`).run(+req.params.id);
  db.prepare(`DELETE FROM floor_skids WHERE id=?`).run(+req.params.id);
  res.json({ ok: true });
});

app.put('/api/floor/:id/verify', (req, res) => {
  const f = db.prepare(`SELECT verified FROM floor_skids WHERE id=?`).get(+req.params.id);
  const newVal = f.verified ? 0 : 1;
  const verAt = newVal ? new Date().toISOString() : null;
  db.prepare(`UPDATE floor_skids SET verified=?, verified_at=?, updated_at=datetime('now') WHERE id=?`).run(newVal, verAt, +req.params.id);
  res.json({ verified: newVal, verified_at: verAt });
});

app.post('/api/floor/:id/products', (req, res) => {
  const { name, qty, notes } = req.body;
  db.prepare(`UPDATE floor_skids SET verified=0, verified_at=NULL, updated_at=datetime('now') WHERE id=?`).run(+req.params.id);
  const info = db.prepare(`INSERT INTO floor_products (floor_skid_id, name, qty, notes) VALUES (?, ?, ?, ?)`).run(+req.params.id, name, qty || 0, notes || '');
  res.json({ id: info.lastInsertRowid, floor_skid_id: +req.params.id, name, qty: qty || 0, notes: notes || '' });
});

app.put('/api/floor-products/:id', (req, res) => {
  const { name, qty, notes } = req.body;
  db.prepare(`UPDATE floor_products SET name=?, qty=?, notes=? WHERE id=?`).run(name, qty || 0, notes || '', +req.params.id);
  const prod = db.prepare(`SELECT * FROM floor_products WHERE id=?`).get(+req.params.id);
  if (prod) db.prepare(`UPDATE floor_skids SET verified=0, verified_at=NULL, updated_at=datetime('now') WHERE id=?`).run(prod.floor_skid_id);
  res.json({ ok: true });
});

app.delete('/api/floor-products/:id', (req, res) => {
  const prod = db.prepare(`SELECT * FROM floor_products WHERE id=?`).get(+req.params.id);
  db.prepare(`DELETE FROM floor_products WHERE id=?`).run(+req.params.id);
  if (prod) db.prepare(`UPDATE floor_skids SET verified=0, verified_at=NULL, updated_at=datetime('now') WHERE id=?`).run(prod.floor_skid_id);
  res.json({ ok: true });
});

// === SEARCH ===

app.get('/api/search', (req, res) => {
  const q = `%${req.query.q || ''}%`;
  const rackResults = db.prepare(`
    SELECT rp.*, rs.section, rs.level, rs.place, rs.verified, rs.is_order, rs.so_number
    FROM rack_products rp JOIN rack_skids rs ON rp.skid_id = rs.id
    WHERE rp.name LIKE ? OR rs.so_number LIKE ?
  `).all(q, q);
  const floorResults = db.prepare(`
    SELECT fp.*, fs.name as floor_name, fs.id as floor_id, fs.verified, fs.is_order, fs.so_number
    FROM floor_products fp JOIN floor_skids fs ON fp.floor_skid_id = fs.id
    WHERE fp.name LIKE ? OR fs.so_number LIKE ?
  `).all(q, q);
  res.json({ rack: rackResults, floor: floorResults });
});

// === STATS ===

app.get('/api/stats', (req, res) => {
  const rackActive = db.prepare(`SELECT COUNT(DISTINCT skid_id) as c FROM rack_products`).get().c;
  const rackVerified = db.prepare(`SELECT COUNT(*) as c FROM rack_skids WHERE verified=1 AND id IN (SELECT DISTINCT skid_id FROM rack_products)`).get().c;
  const floorActive = db.prepare(`SELECT COUNT(DISTINCT floor_skid_id) as c FROM floor_products`).get().c;
  const floorVerified = db.prepare(`SELECT COUNT(*) as c FROM floor_skids WHERE verified=1 AND id IN (SELECT DISTINCT floor_skid_id FROM floor_products)`).get().c;
  const totalQty = (db.prepare(`SELECT COALESCE(SUM(qty),0) as s FROM rack_products`).get().s || 0)
    + (db.prepare(`SELECT COALESCE(SUM(qty),0) as s FROM floor_products`).get().s || 0);
  res.json({ total: rackActive + floorActive, verified: rackVerified + floorVerified, totalQty });
});

// === KNOWN PRODUCTS (autocomplete) ===

app.get('/api/known-products', (req, res) => {
  const rack = db.prepare(`SELECT DISTINCT name FROM rack_products`).all().map(r => r.name);
  const floor = db.prepare(`SELECT DISTINCT name FROM floor_products`).all().map(r => r.name);
  res.json([...new Set([...rack, ...floor])].sort());
});

// === IMPORT (from JSON) ===

app.post('/api/import', (req, res) => {
  const { skids, config, floor } = req.body;
  const importTx = db.transaction(() => {
    // Clear existing
    db.prepare(`DELETE FROM rack_products`).run();
    db.prepare(`DELETE FROM rack_skids`).run();
    db.prepare(`DELETE FROM floor_products`).run();
    db.prepare(`DELETE FROM floor_skids`).run();
    db.prepare(`DELETE FROM rack_config`).run();

    // Import rack skids
    for (const [key, skid] of Object.entries(skids || {})) {
      const parts = key.match(/^(.+?)-(\d+)-(\d+)$/);
      if (!parts) continue;
      const [, section, level, place] = parts;
      const info = db.prepare(`INSERT INTO rack_skids (section, level, place, verified, verified_at, is_order, so_number) VALUES (?,?,?,?,?,?,?)`)
        .run(section, +level, +place, skid.verified ? 1 : 0, skid.verifiedAt || null, skid.isOrder ? 1 : 0, skid.soNumber || '');
      for (const p of (skid.products || [])) {
        db.prepare(`INSERT INTO rack_products (skid_id, name, qty, notes) VALUES (?,?,?,?)`)
          .run(info.lastInsertRowid, p.name, p.qty || 0, p.notes || '');
      }
    }

    // Import config
    for (const [key, cfg] of Object.entries(config || {})) {
      const parts = key.match(/^(.+?)-(\d+)$/);
      if (!parts) continue;
      db.prepare(`INSERT INTO rack_config (section, level, places) VALUES (?,?,?)`)
        .run(parts[1], +parts[2], cfg.places || 1);
    }

    // Import floor
    for (const f of (floor || [])) {
      const info = db.prepare(`INSERT INTO floor_skids (name, verified, verified_at, is_order, so_number) VALUES (?,?,?,?,?)`)
        .run(f.name, f.verified ? 1 : 0, f.verifiedAt || null, f.isOrder ? 1 : 0, f.soNumber || '');
      for (const p of (f.products || [])) {
        db.prepare(`INSERT INTO floor_products (floor_skid_id, name, qty, notes) VALUES (?,?,?,?)`)
          .run(info.lastInsertRowid, p.name, p.qty || 0, p.notes || '');
      }
    }
  });
  importTx();
  res.json({ ok: true });
});

// === EXPORT ===

app.get('/api/export', (req, res) => {
  const skidsData = {};
  const rackSkids = db.prepare(`SELECT * FROM rack_skids`).all();
  for (const s of rackSkids) {
    const key = `${s.section}-${s.level}-${s.place}`;
    const products = db.prepare(`SELECT name, qty, notes FROM rack_products WHERE skid_id=?`).all(s.id);
    skidsData[key] = { products, verified: !!s.verified, verifiedAt: s.verified_at, isOrder: !!s.is_order, soNumber: s.so_number };
  }
  const configData = {};
  for (const c of db.prepare(`SELECT * FROM rack_config`).all()) {
    configData[`${c.section}-${c.level}`] = { places: c.places };
  }
  const floorData = db.prepare(`SELECT * FROM floor_skids`).all().map(f => {
    const products = db.prepare(`SELECT name, qty, notes FROM floor_products WHERE floor_skid_id=?`).all(f.id);
    return { name: f.name, products, verified: !!f.verified, verifiedAt: f.verified_at, isOrder: !!f.is_order, soNumber: f.so_number };
  });
  res.json({ skids: skidsData, config: configData, floor: floorData });
});

const PORT = process.env.PORT || 3001;

// === EXCEL EXPORT ===

app.get('/api/export-excel', (req, res) => {
  // Return structured data for client-side XLSX generation
  const inventory = [];
  const rackSkids = db.prepare(`SELECT * FROM rack_skids ORDER BY section, level, place`).all();
  for (const s of rackSkids) {
    const products = db.prepare(`SELECT * FROM rack_products WHERE skid_id=? ORDER BY id`).all(s.id);
    for (const p of products) {
      inventory.push({
        location: `${s.section}-${s.level}-${s.place}`,
        type: 'Rack',
        sku: p.name,
        qty: p.qty,
        verified: s.verified ? 'Yes' : 'No',
        verified_at: s.verified_at || '',
        is_order: s.is_order ? 'Yes' : 'No',
        so_number: s.so_number || '',
        notes: p.notes || ''
      });
    }
  }
  const floorSkids = db.prepare(`SELECT * FROM floor_skids ORDER BY id`).all();
  for (const f of floorSkids) {
    const products = db.prepare(`SELECT * FROM floor_products WHERE floor_skid_id=? ORDER BY id`).all(f.id);
    for (const p of products) {
      inventory.push({
        location: `Floor: ${f.name}`,
        type: 'Floor',
        sku: p.name,
        qty: p.qty,
        verified: f.verified ? 'Yes' : 'No',
        verified_at: f.verified_at || '',
        is_order: f.is_order ? 'Yes' : 'No',
        so_number: f.so_number || '',
        notes: p.notes || ''
      });
    }
  }

  // SKU summary
  const summary = {};
  for (const row of inventory) {
    if (!summary[row.sku]) summary[row.sku] = { sku: row.sku, total: 0, locations: [] };
    summary[row.sku].total += row.qty;
    summary[row.sku].locations.push(`${row.location}(${row.qty})`);
  }

  res.json({ inventory, summary: Object.values(summary).sort((a, b) => b.total - a.total) });
});

// === COUNT MODE ===

app.get('/api/count-queue', (req, res) => {
  const filter = req.query.filter || 'unverified'; // unverified | all | section
  const section = req.query.section || '';

  let rackSkids;
  if (filter === 'unverified') {
    rackSkids = db.prepare(`SELECT * FROM rack_skids WHERE verified=0 AND id IN (SELECT DISTINCT skid_id FROM rack_products) ORDER BY section, level, place`).all();
  } else if (section) {
    rackSkids = db.prepare(`SELECT * FROM rack_skids WHERE section LIKE ? AND id IN (SELECT DISTINCT skid_id FROM rack_products) ORDER BY section, level, place`).all(`${section}%`);
  } else {
    rackSkids = db.prepare(`SELECT * FROM rack_skids WHERE id IN (SELECT DISTINCT skid_id FROM rack_products) ORDER BY section, level, place`).all();
  }

  const queue = rackSkids.map(s => {
    const products = db.prepare(`SELECT * FROM rack_products WHERE skid_id=? ORDER BY id`).all(s.id);
    return { ...s, key: `${s.section}-${s.level}-${s.place}`, products };
  });

  // Also add unverified floor skids
  let floorSkids;
  if (filter === 'unverified') {
    floorSkids = db.prepare(`SELECT * FROM floor_skids WHERE verified=0 AND id IN (SELECT DISTINCT floor_skid_id FROM floor_products) ORDER BY id`).all();
  } else {
    floorSkids = db.prepare(`SELECT * FROM floor_skids WHERE id IN (SELECT DISTINCT floor_skid_id FROM floor_products) ORDER BY id`).all();
  }
  const floorQueue = floorSkids.map(f => {
    const products = db.prepare(`SELECT * FROM floor_products WHERE floor_skid_id=? ORDER BY id`).all(f.id);
    return { ...f, key: `floor-${f.id}`, isFloor: true, products };
  });

  res.json({ rack: queue, floor: floorQueue, total: queue.length + floorQueue.length });
});

// Batch update counts from count mode
app.post('/api/count-update', (req, res) => {
  const { updates } = req.body; // [{ productId, newQty, isFloor }]
  const tx = db.transaction(() => {
    for (const u of updates) {
      if (u.isFloor) {
        db.prepare(`UPDATE floor_products SET qty=? WHERE id=?`).run(u.newQty, u.productId);
      } else {
        db.prepare(`UPDATE rack_products SET qty=? WHERE id=?`).run(u.newQty, u.productId);
      }
    }
  });
  tx();
  res.json({ ok: true, updated: updates.length });
});

// === SECTION MANAGEMENT ===

app.get('/api/sections', (req, res) => {
  // Return current section config
  const sections = db.prepare(`
    SELECT section, COUNT(DISTINCT level || '-' || place) as skid_count, 
           COALESCE(SUM(product_count), 0) as total_products
    FROM rack_skids rs
    LEFT JOIN (SELECT skid_id, COUNT(*) as product_count FROM rack_products GROUP BY skid_id) rp ON rs.id = rp.skid_id
    GROUP BY section ORDER BY section
  `).all();
  res.json(sections);
});

// Add a new section letter+number
app.post('/api/sections', (req, res) => {
  const { section } = req.body; // e.g. "E23" or "L1"
  if (!section || !/^[A-Z]\d+$/.test(section)) {
    return res.status(400).json({ error: 'Invalid section format. Use letter+number like E23 or K20' });
  }
  // Create empty level 1 placeholder
  const existing = db.prepare(`SELECT id FROM rack_skids WHERE section=?`).get(section);
  if (existing) return res.status(400).json({ error: 'Section already has data' });
  db.prepare(`INSERT INTO rack_skids (section, level, place) VALUES (?, 1, 1)`).run(section);
  res.json({ ok: true, section });
});

// Delete a section (only if empty)
app.delete('/api/sections/:section', (req, res) => {
  const { section } = req.params;
  const productCount = db.prepare(`
    SELECT COUNT(*) as c FROM rack_products WHERE skid_id IN (SELECT id FROM rack_skids WHERE section=?)
  `).get(section).c;
  if (productCount > 0) {
    return res.status(400).json({ error: `Section ${section} has ${productCount} products. Remove them first.` });
  }
  db.prepare(`DELETE FROM rack_skids WHERE section=?`).run(section);
  db.prepare(`DELETE FROM rack_config WHERE section=?`).run(section);
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`Warehouse API running on http://localhost:${PORT}`));
