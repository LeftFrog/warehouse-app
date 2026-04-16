import { useState } from 'react';
import { api } from '../api.js';

let XLSX = null;
async function loadXLSX() {
  if (XLSX) return XLSX;
  // Dynamic import from CDN
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  document.head.appendChild(script);
  return new Promise((resolve) => {
    script.onload = () => { XLSX = window.XLSX; resolve(XLSX); };
  });
}

export default function ExcelExport() {
  const [loading, setLoading] = useState(false);

  const handleExport = async (type) => {
    setLoading(true);
    try {
      const xlsx = await loadXLSX();
      const data = await api.getExcelData();
      const wb = xlsx.utils.book_new();

      // Sheet 1: Full Inventory
      const invHeaders = ['Location', 'Type', 'SKU', 'Qty', 'Verified', 'Verified At', 'Order', 'SO #', 'Notes'];
      const invRows = data.inventory.map(r => [r.location, r.type, r.sku, r.qty, r.verified, r.verified_at, r.is_order, r.so_number, r.notes]);
      const ws1 = xlsx.utils.aoa_to_sheet([invHeaders, ...invRows]);
      ws1['!cols'] = [{ wch: 16 }, { wch: 8 }, { wch: 30 }, { wch: 8 }, { wch: 10 }, { wch: 20 }, { wch: 8 }, { wch: 14 }, { wch: 30 }];
      xlsx.utils.book_append_sheet(wb, ws1, 'Inventory');

      // Sheet 2: SKU Summary
      const sumHeaders = ['SKU', 'Total Qty', '# Locations', 'Locations'];
      const sumRows = data.summary.map(r => [r.sku, r.total, r.locations.length, r.locations.join(', ')]);
      const ws2 = xlsx.utils.aoa_to_sheet([sumHeaders, ...sumRows]);
      ws2['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 14 }, { wch: 80 }];
      xlsx.utils.book_append_sheet(wb, ws2, 'SKU Summary');

      // Sheet 3: Unverified
      const unverified = data.inventory.filter(r => r.verified === 'No');
      if (unverified.length > 0) {
        const ws3 = xlsx.utils.aoa_to_sheet([invHeaders, ...unverified.map(r => [r.location, r.type, r.sku, r.qty, r.verified, r.verified_at, r.is_order, r.so_number, r.notes])]);
        ws3['!cols'] = ws1['!cols'];
        xlsx.utils.book_append_sheet(wb, ws3, 'Unverified');
      }

      const date = new Date().toISOString().slice(0, 10);
      xlsx.writeFile(wb, `warehouse-inventory-${date}.xlsx`);
    } catch (e) {
      console.error(e);
      alert('Export failed: ' + e.message);
    }
    setLoading(false);
  };

  return (
    <button className="io-btn" onClick={() => handleExport('full')} disabled={loading}>
      {loading ? '⏳ Generating...' : '📊 Export Excel'}
    </button>
  );
}
