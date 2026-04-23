import { useState } from 'react';

const NAV_ITEMS = [
    { key: 'inventory', label: 'Inventory', icon:'🏭' },
    { key: 'receiving', label: 'Receiving', icon:'📦' }
]

export default function Layout ({activeModule, onModuleChange, children}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div class="app-layout">
            <button className="hamburger" onClink={() => setSidebarOpen(!sidebarOpen)}>☰</button>

            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-title">Warehouse</div>
                <nav>
                    {NAV_ITEMS.map(item => (
                        <button key={item.key} 
                        className={`nav-item ${activeModule == item.key ? 'active' : ''}`}
                        onClick={ () => { onModuleChange(item.key); setSidebarOpen(false);}}>
                            <span className="nav-icon">{item.icon}</span>
                        </button>
                    ))}
                </nav>
            </aside>

            {sidebarOpen && <div className="sidebar-overlay"
            onClick={() => setSidebarOpen(false)}/>}

            <main className="content">{children}</main>
        </div>
    );
}