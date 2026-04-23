import { act, useState } from "react"
import Layout from "./components/Layout"
import Inventory from "./modules/Inventory"
import "./styles.css"

export default function App() {
  const [activeModule, setActiveModule] = useState('inventory');

  return (<Layout activeModule={activeModule} onModuleChange={setActiveModule}>
    {activeModule == 'inventory' && <Inventory />}
    {activeModule == 'receiving' && <Receiving />}
    </Layout>);
}