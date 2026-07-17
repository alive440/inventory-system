import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Suppliers from './pages/Suppliers'
import PurchaseList from './pages/PurchaseList'
import PurchaseNew from './pages/PurchaseNew'
import SalesList from './pages/SalesList'
import SalesNew from './pages/SalesNew'
import Inventory from './pages/Inventory'
import InventoryCheck from './pages/InventoryCheck'
import Logs from './pages/Logs'
import Reports from './pages/Reports'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/purchase" element={<PurchaseList />} />
        <Route path="/purchase/new" element={<PurchaseNew />} />
        <Route path="/sales" element={<SalesList />} />
        <Route path="/sales/new" element={<SalesNew />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/inventory/check" element={<InventoryCheck />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/reports" element={<Reports />} />
      </Route>
    </Routes>
  )
}
