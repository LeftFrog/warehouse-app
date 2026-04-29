import { useState, useEffect} from "react";

export default function Receiving() {
    const [view, setView] = useState('POView');
    return (
    <div className="container" id="receiving-container">
        <div className="header">
            <div><h1>📦 Receiving <span className="dev-badge">Beta</span></h1></div>
            <button className="new-po-btn">+ New PO</button>
        </div>
    </div>
    );
}