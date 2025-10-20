import { Routes, Route, Navigate } from 'react-router-dom'
import AuthPage from './pages/AuthPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ProductsPage from './pages/ProductsPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  )
}


