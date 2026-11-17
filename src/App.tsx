import { Link, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { RequireAuth } from './components/ui'
import { AdminOrdersPage } from './pages/AdminOrdersPage'
import { AuthPage } from './pages/AuthPage'
import { CartPage } from './pages/CartPage'
import { CatalogPage } from './pages/CatalogPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { OrderPage, OrdersPage } from './pages/OrderPages'
import { ProductPage } from './pages/ProductPage'

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<CatalogPage />} />
        <Route path="products/:slug" element={<ProductPage />} />
        <Route path="login" element={<AuthPage mode="login" />} />
        <Route path="register" element={<AuthPage mode="register" />} />
        <Route path="cart" element={<RequireAuth><CartPage /></RequireAuth>} />
        <Route path="checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
        <Route path="orders" element={<RequireAuth><OrdersPage /></RequireAuth>} />
        <Route path="orders/:code" element={<RequireAuth><OrderPage /></RequireAuth>} />
        <Route path="admin/orders" element={<RequireAuth admin><AdminOrdersPage /></RequireAuth>} />
        <Route path="*" element={
          <div className="empty">
            <h1>Lạc đường rồi</h1>
            <p className="muted">Trang này không có trong tiệm.</p>
            <Link to="/" className="button">Về cửa hàng</Link>
          </div>
        } />
      </Route>
    </Routes>
  )
}
