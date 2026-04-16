# Warehouse Inventory App

React + Express + SQLite inventory management system.

## Quick Start

### 1. Install dependencies
```bash
cd warehouse-app
npm run install:all
```

### 2. Seed the database with your inventory data
Make sure `seed-data.json` is in the project root (the JSON export from the old app), then:
```bash
npm run seed
```
This creates `warehouse.db` with all your inventory data.

### 3. Start the app (2 terminals)

**Terminal 1 — Backend (API + Database):**
```bash
npm run dev:server
```
Runs on http://localhost:3001

**Terminal 2 — Frontend (React):**
```bash
npm run dev:client
```
Runs on http://localhost:3000

Open http://localhost:3000 in your browser.

## Accessing from iPad / other devices

Since the backend runs on your PC, you can access the app from any device on the same network:

1. Find your PC's local IP (e.g. `192.168.1.100`)
2. In `client/vite.config.js`, change the server config:
   ```js
   server: {
     host: '10.151.62.47',  // add this line
     port: 3000,
     proxy: { '/api': 'http://localhost:3001' }
   }
   ```
3. On iPad, go to `http://192.168.1.100:3000`

## Project Structure

```
warehouse-app/
├── package.json          # Root scripts
├── seed-data.json        # Your inventory data (place here)
├── warehouse.db          # SQLite database (auto-created)
├── server/
│   ├── index.js          # Express API server
│   ├── db.js             # SQLite schema & connection
│   └── seed.js           # Import JSON → SQLite
└── client/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx        # Main app component
        ├── api.js          # API helper functions
        ├── styles.css
        └── components/
            ├── ProductForm.jsx
            ├── SkidDetail.jsx
            └── FloorDetail.jsx
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/stats | Dashboard stats |
| GET | /api/skids | All rack skids with products |
| GET | /api/skids/:sec/:lvl/:pl | Single rack skid |
| POST | /api/skids/:sec/:lvl/:pl/products | Add product to rack |
| PUT | /api/products/:id | Update product |
| DELETE | /api/products/:id | Delete product |
| PUT | /api/skids/:sec/:lvl/:pl/verify | Toggle verified |
| PUT | /api/skids/:sec/:lvl/:pl/order | Update SO info |
| GET | /api/config | Rack configuration |
| PUT | /api/config/:sec/:lvl | Set single/double rack |
| GET | /api/floor | All floor skids |
| POST | /api/floor | Create floor skid |
| PUT | /api/floor/:id | Update floor skid |
| DELETE | /api/floor/:id | Delete floor skid |
| GET | /api/search?q= | Search products |
| GET | /api/known-products | Autocomplete list |
| GET | /api/export | Export all data as JSON |
| POST | /api/import | Import JSON data |

## Database

SQLite database stored as `warehouse.db` in the project root. To reset:
```bash
rm warehouse.db
npm run seed
```

## Next Steps

- [ ] Excel export
- [ ] Count mode (walk-through verification)
- [ ] Add/delete rack sections from UI
- [ ] SKU master list
- [ ] Admin auth for SKU management
- [ ] Multi-device sync
