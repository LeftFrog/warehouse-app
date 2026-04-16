const BASE = '/api';

async function request(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  return res.json();
}

export const api = {
  // Stats
  getStats: () => request('/stats'),

  // Rack skids
  getAllSkids: () => request('/skids'),
  getSkid: (sec, lvl, pl) => request(`/skids/${sec}/${lvl}/${pl}`),
  addProduct: (sec, lvl, pl, product) => request(`/skids/${sec}/${lvl}/${pl}/products`, { method: 'POST', body: product }),
  updateProduct: (id, product) => request(`/products/${id}`, { method: 'PUT', body: product }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  toggleVerified: (sec, lvl, pl) => request(`/skids/${sec}/${lvl}/${pl}/verify`, { method: 'PUT' }),
  updateOrder: (sec, lvl, pl, data) => request(`/skids/${sec}/${lvl}/${pl}/order`, { method: 'PUT', body: data }),

  // Config
  getConfig: () => request('/config'),
  setPlaces: (sec, lvl, places) => request(`/config/${sec}/${lvl}`, { method: 'PUT', body: { places } }),

  // Floor
  getFloor: () => request('/floor'),
  addFloorSkid: (name) => request('/floor', { method: 'POST', body: { name } }),
  updateFloorSkid: (id, data) => request(`/floor/${id}`, { method: 'PUT', body: data }),
  deleteFloorSkid: (id) => request(`/floor/${id}`, { method: 'DELETE' }),
  toggleFloorVerified: (id) => request(`/floor/${id}/verify`, { method: 'PUT' }),
  addFloorProduct: (id, product) => request(`/floor/${id}/products`, { method: 'POST', body: product }),
  updateFloorProduct: (id, product) => request(`/floor-products/${id}`, { method: 'PUT', body: product }),
  deleteFloorProduct: (id) => request(`/floor-products/${id}`, { method: 'DELETE' }),

  // Search
  search: (q) => request(`/search?q=${encodeURIComponent(q)}`),

  // Autocomplete
  getKnownProducts: () => request('/known-products'),

  // Import/Export
  exportData: () => request('/export'),
  importData: (data) => request('/import', { method: 'POST', body: data }),

  // Excel export
  getExcelData: () => request('/export-excel'),

  // Count mode
  getCountQueue: (filter, section) => request(`/count-queue?filter=${filter || 'unverified'}&section=${section || ''}`),
  submitCountUpdates: (updates) => request('/count-update', { method: 'POST', body: { updates } }),

  // Sections
  getSections: () => request('/sections'),
  addSection: (section) => request('/sections', { method: 'POST', body: { section } }),
  deleteSection: (section) => request(`/sections/${section}`, { method: 'DELETE' }),
};
