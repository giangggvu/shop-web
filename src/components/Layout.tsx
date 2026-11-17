import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { errorMessage, subscribeSlow } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { useCart } from '../cart/CartContext'
import { formatPrice } from '../lib/format'
import { categoryFromName, ProductArt } from './ProductArt'
import { QuantityInput } from './ui'

export function Layout() {
  const { user, logout } = useAuth()
  const { cart, openDrawer, closeDrawer } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const [slow, setSlow] = useState(false)

  useEffect(() => subscribeSlow(setSlow), [])
  useEffect(() => closeDrawer(), [location.pathname, closeDrawer])

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand" aria-label="Lá và Hạt, trang chủ">
            <svg viewBox="0 0 32 32" className="brand-mark" aria-hidden="true">
              <path d="M16 3c-7 6-9 13-6 20 1.5 3.5 4.5 6 6 6s4.5-2.5 6-6c3-7 1-14-6-20z" fill="currentColor" />
              <path d="M16 8v20" stroke="var(--paper)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Lá &amp; Hạt
          </Link>
          <nav className="nav" aria-label="Chính">
            <NavLink to="/" end>Cửa hàng</NavLink>
            {user && <NavLink to="/orders">Đơn của tôi</NavLink>}
            {user?.role === 'ADMIN' && <NavLink to="/admin/orders">Quản lý đơn</NavLink>}
          </nav>
          <div className="nav-right">
            {user ? (
              <button type="button" className="link-button quiet" onClick={handleLogout}>Đăng xuất</button>
            ) : (
              <NavLink to="/login" className="quiet-link">Đăng nhập</NavLink>
            )}
            <button type="button" className="cart-button" onClick={() => (user ? openDrawer() : navigate('/login'))}
              aria-label={`Mở giỏ hàng, ${cart.itemCount} món`}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8zm3 0V7a4 4 0 0 1 8 0v1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
              Giỏ
              <span className={`cart-count ${cart.itemCount > 0 ? 'has-items' : ''}`}>{cart.itemCount}</span>
            </button>
          </div>
        </div>
      </header>

      {slow && (
        <div className="wake-notice" role="status">
          Máy chủ đang khởi động lại sau khi nghỉ. Lần đầu có thể mất đến một phút.
        </div>
      )}

      <main className="page">
        <Outlet />
      </main>

      <footer className="footer">
        <p>Lá &amp; Hạt là cửa hàng mẫu trong portfolio của Hương Giang. Không giao hàng thật, đừng chuyển tiền thật nhé.</p>
      </footer>

      <CartDrawer />
    </div>
  )
}

function CartDrawer() {
  const { cart, drawerOpen, lastAddedId, closeDrawer, update, remove } = useCart()
  const panelRef = useRef<HTMLDivElement>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!drawerOpen) return
    panelRef.current?.focus()
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && closeDrawer()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawerOpen, closeDrawer])

  async function run(productId: number, action: () => Promise<void>) {
    setBusyId(productId)
    setError('')
    try {
      await action()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className={`drawer ${drawerOpen ? 'drawer-open' : ''}`} inert={!drawerOpen}>
      <div className="drawer-scrim" onClick={closeDrawer} />
      <div className="drawer-panel" role="dialog" aria-modal="true" aria-label="Giỏ hàng" tabIndex={-1} ref={panelRef}>
        <div className="drawer-head">
          <h2>Giỏ hàng</h2>
          <button type="button" className="icon-button" onClick={closeDrawer} aria-label="Đóng giỏ hàng">✕</button>
        </div>

        {cart.items.length === 0 ? (
          <p className="muted drawer-empty">Giỏ còn trống. Chọn vài món trên kệ nhé.</p>
        ) : (
          <>
            {error && <p className="drawer-error">{error}</p>}
            <ul className="drawer-lines">
              {cart.items.map((line) => (
                <li key={line.productId} className={line.productId === lastAddedId ? 'just-added' : ''}>
                  <ProductArt name={line.name} categorySlug={categoryFromName(line.name)} className="art-thumb" />
                  <div>
                    <Link to={`/products/${line.slug}`} className="line-name">{line.name}</Link>
                    <p className="muted small">{formatPrice(line.unitPrice)}</p>
                    <div className="drawer-line-actions">
                      <QuantityInput size="small" value={line.quantity} max={line.stock} disabled={busyId === line.productId}
                        onChange={(next) => run(line.productId, () => update(line.productId, next))} />
                      <button type="button" className="link-button quiet" disabled={busyId === line.productId}
                        onClick={() => run(line.productId, () => remove(line.productId))}>Bỏ</button>
                    </div>
                  </div>
                  <strong className="line-total">{formatPrice(line.lineTotal)}</strong>
                </li>
              ))}
            </ul>
            <div className="drawer-foot">
              <div className="total-row"><span>Tạm tính</span><strong>{formatPrice(cart.total)}</strong></div>
              <Link to="/checkout" className="button button-wide">Đặt hàng</Link>
              <Link to="/cart" className="button button-ghost button-wide">Xem cả giỏ</Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
