import { Routes, Route, Navigate } from 'react-router-dom'
import AuthPage from './pages/AuthPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ProductsPage from './pages/ProductsPage.jsx'
import CartPage from './pages/CartPage.jsx'
import BuyNowPage from './pages/BuyNowPage.jsx'
import OrderSummary from './pages/OrderSummary.jsx'
import OrderSuccess from './pages/OrderSuccess.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/buy-now" element={<BuyNowPage />} />
      <Route path="/order-summary" element={<OrderSummary />} />
      <Route path="/order-success" element={<OrderSuccess />} />
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  )
}


