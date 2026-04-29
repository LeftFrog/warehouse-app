import { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError('Invalid email or password.');
    }
  }

  return (
      <div className="login-screen">
        <div className="corner-br"></div>
        <div className="login-container">
          <div className="brand">
            <span className="brand-icon">🐸</span>
            <div className="brand-name">easy<span>frogtory</span></div>
            <div className="brand-sub">Warehouse Inventory</div>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-title">Sign In</div>
            <div className="login-desc">Enter your credentials to continue</div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="form-input-wrap">
                <input className="login-input" type="email" id="email" placeholder="you@company.com" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required />
                <span className="input-icon">✉</span>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="form-input-wrap">
                <input className="login-input" type="password" id="password" placeholder="••••••••" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required />
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <span className="input-icon">🔒</span>
                <button className="pw-toggle" id="pw-toggle" type="button">👁</button>
              </div>
            </div>
            <button className="login-button" type="submit">Login</button>
          </form>
          <div className="login-footer">EASYFROGTORY v1.0</div>
        </div>
      </div>
  );
}
