import { useState } from 'react'
import { Link } from 'react-router-dom'
import { errorMessage } from '../api/client'
import { useCart } from '../cart/CartContext'
import { categoryFromName, ProductArt } from '../components/ProductArt'
import { Alert, CheckoutSteps, QuantityInput, Spinner } from '../components/ui'
import { formatPrice } from '../lib/format'

export function CartPage() {
  const { cart, loaded, update, remove } = useCart()
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState('')

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

  if (!loaded) {
    return <Spinner />
  }
  if (cart.items.length === 0) {
    return (
      <div className="empty">
        <h1>Giỏ hàng còn trống</h1>
        <p className="muted">Chọn vài món trên kệ, giỏ sẽ được giữ lại kể cả khi bạn đổi máy.</p>
        <Link to="/" className="button">Ra kệ hàng</Link>
      </div>
    )
  }

  const overStock = cart.items.some((line) => line.quantity > line.stock)

  return (
    <div className="narrow">
      <CheckoutSteps current={0} />
      <h1>Giỏ hàng</h1>
      <Alert>{error}</Alert>

      <div className="split">
        <ul className="lines">
          {cart.items.map((line) => (
            <li key={line.productId} className="line">
              <ProductArt name={line.name} categorySlug={categoryFromName(line.name)} className="art-thumb" />
              <div className="line-info">
                <Link to={`/products/${line.slug}`} className="line-name">{line.name}</Link>
                <p className="muted small">{formatPrice(line.unitPrice)} mỗi món</p>
                {line.quantity > line.stock && (
                  <p className="out small">Kho chỉ còn {line.stock}. Giảm số lượng để đặt được.</p>
                )}
                <div className="line-actions">
                  <QuantityInput size="small" value={line.quantity} max={line.stock} disabled={busyId === line.productId}
                    onChange={(next) => run(line.productId, () => update(line.productId, next))} />
                  <button type="button" className="link-button quiet" disabled={busyId === line.productId}
                    onClick={() => run(line.productId, () => remove(line.productId))}>Bỏ khỏi giỏ</button>
                </div>
              </div>
              <strong className="line-total">{formatPrice(line.lineTotal)}</strong>
            </li>
          ))}
        </ul>

        <aside className="receipt">
          <div className="total-row"><span>{cart.itemCount} món</span><strong>{formatPrice(cart.total)}</strong></div>
          <p className="muted small">Phí giao hàng shop báo qua điện thoại sau khi xác nhận đơn.</p>
          {overStock ? (
            <button type="button" className="button button-wide" disabled>Giảm số lượng để tiếp tục</button>
          ) : (
            <Link to="/checkout" className="button button-wide">Điền thông tin giao hàng</Link>
          )}
        </aside>
      </div>
    </div>
  )
}
