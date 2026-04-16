import db from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Check if data already exists
const existing = db.prepare(`SELECT COUNT(*) as c FROM rack_products`).get();
if (existing.c > 0) {
  console.log(`Database already has ${existing.c} rack products. Skipping seed.`);
  console.log('To re-seed, delete warehouse.db and run again.');
  process.exit(0);
}

// Look for JSON seed file
const seedPath = path.join(__dirname, '..', 'seed-data.json');
if (!fs.existsSync(seedPath)) {
  console.log('No seed-data.json found. Place your exported JSON as seed-data.json in the project root.');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

const importTx = db.transaction(() => {
  let rackCount = 0, floorCount = 0, productCount = 0;

  for (const [key, skid] of Object.entries(data.skids || {})) {
    const parts = key.match(/^(.+?)-(\d+)-(\d+)$/);
    if (!parts) continue;
    const [, section, level, place] = parts;
    const info = db.prepare(`INSERT INTO rack_skids (section, level, place, verified, verified_at, is_order, so_number) VALUES (?,?,?,?,?,?,?)`)
      .run(section, +level, +place, skid.verified ? 1 : 0, skid.verifiedAt || null, skid.isOrder ? 1 : 0, skid.soNumber || '');
    rackCount++;
    for (const p of (skid.products || [])) {
      db.prepare(`INSERT INTO rack_products (skid_id, name, qty, notes) VALUES (?,?,?,?)`)
        .run(info.lastInsertRowid, p.name, p.qty || 0, p.notes || '');
      productCount++;
    }
  }

  for (const [key, cfg] of Object.entries(data.config || {})) {
    const parts = key.match(/^(.+?)-(\d+)$/);
    if (!parts) continue;
    db.prepare(`INSERT INTO rack_config (section, level, places) VALUES (?,?,?)`)
      .run(parts[1], +parts[2], cfg.places || 1);
  }

  for (const f of (data.floor || [])) {
    const info = db.prepare(`INSERT INTO floor_skids (name, verified, verified_at, is_order, so_number) VALUES (?,?,?,?,?)`)
      .run(f.name, f.verified ? 1 : 0, f.verifiedAt || null, f.isOrder ? 1 : 0, f.soNumber || '');
    floorCount++;
    for (const p of (f.products || [])) {
      db.prepare(`INSERT INTO floor_products (floor_skid_id, name, qty, notes) VALUES (?,?,?,?)`)
        .run(info.lastInsertRowid, p.name, p.qty || 0, p.notes || '');
      productCount++;
    }
  }

  console.log(`Seeded: ${rackCount} rack skids, ${floorCount} floor skids, ${productCount} products`);
});

importTx();
console.log('Done!');
