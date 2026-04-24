import { useEffect, useState } from "react"
import Layout from "./components/Layout"
import Inventory from "./modules/Inventory"
import "./styles.css"
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from './firebase.js';
import LoginForm from "./components/LoginForm.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState('inventory');

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <LoginForm />;

  return (<Layout activeModule={activeModule} onModuleChange={setActiveModule}>
    {activeModule == 'inventory' && <Inventory />}
    {activeModule == 'receiving' && <Receiving />}
    </Layout>);
}