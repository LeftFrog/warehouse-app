import db from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.join(__dirname, '..', 'sku_master.json');

if (!fs.existsSync(seedPath)) {
  console.log('No sku_master.json found. Place it in the project root.');
  process.exit(1);
}

const skus = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

const existing = db.prepare('SELECT COUNT(*) as c FROM sku_master').get();
if (existing.c > 0) {
  console.log(`sku_master already has ${existing.c} items. Use --force to overwrite.`);
  if (!process.argv.includes('--force')) process.exit(0);
  db.prepare('DELETE FROM sku_master').run();
}

const insert = db.prepare(`
  INSERT OR IGNORE INTO sku_master (acumatica_id, product_name, description, category, item_class)
  VALUES (?, ?, ?, ?, ?)
`);

const tx = db.transaction(() => {
  let count = 0;
  for (const sku of skus) {
    insert.run(sku.acumatica_id, sku.product_name, sku.description, sku.category, sku.item_class);
    count++;
  }
  console.log(`Seeded ${count} SKUs into sku_master`);
});

tx();