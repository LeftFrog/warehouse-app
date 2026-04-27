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
            <div class="login-desc">Enter your credentials to continue</div>
            <input className="email-input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
            <input className="password-input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <button className="login-button" type="submit">Login</button>
          </form>
        </div>
      </div>
  );
}
