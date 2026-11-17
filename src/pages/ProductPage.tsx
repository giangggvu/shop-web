import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { api, ApiError, errorMessage } from '../api/client'
import type { Page, Product } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { useCart } from '../cart/CartContext'
import { labelFor, ProductArt } from '../components/ProductArt'
import { Alert, QuantityInput, Spinner } from '../components/ui'
import { formatPrice } from '../lib/format'

export function ProductPage() {
  const { slug = '' } = useParams()
  const { user } = useAuth()
  const { cart, add } = useCart()
  const navigate = useNavigate()
  const location = useLocation()

  const [product, setProduct] = useState<Product | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [notFound, setNotFound] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let current = true
    api<Product>(`/api/products/${encodeURIComponent(slug)}`)
      .then((data) => {
        if (!current) return
        setProduct(data)
        setNotFound(false)
        setQuantity(1)
        return api<Page<Product>>('/api/products', { query: { category: data.category.slug, size: 4 } })
          .then((page) => current && setRelated(page.items.filter((p) => p.id !== data.id).slice(0, 3)))
      })
      .catch((err) => {
        if (!current) return
        if (err instanceof ApiError && err.status === 404) setNotFound(true)
        else setLoadError(errorMessage(err))
      })
    return () => {
      current = false
    }
  }, [slug])

  if (notFound) {
    return (
      <div className="empty">
        <h1>Món này không còn trên kệ</h1>
        <p className="muted">Có thể sản phẩm đã ngừng bán hoặc đường dẫn bị gõ nhầm.</p>
        <Link to="/" className="button">Về cửa hàng</Link>
      </div>
    )
  }
  if (!product || product.slug !== slug) {
    return loadError ? <Alert>{loadError}</Alert> : <Spinner />
  }

  const { weight } = labelFor(product.name)
  const inCart = cart.items.find((line) => line.productId === product.id)?.quantity ?? 0
  const canAdd = product.stock - inCart

  async function handleAdd() {
    if (!user) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }
    setBusy(true)
    setError('')
    try {
      await add(product!.id, quantity)
      setQuantity(1)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <nav className="crumbs" aria-label="Đường dẫn">
        <Link to="/">Cửa hàng</Link>
        <span aria-hidden="true">/</span>
        <Link to={`/?category=${product.category.slug}`}>{product.category.name}</Link>
      </nav>

      <article className="product">
        <div className="product-stage">
          <ProductArt name={product.name} categorySlug={product.category.slug} />
        </div>

        <div className="product-info">
          <h1>{product.name}</h1>
          <p className="product-price">{formatPrice(product.price)}</p>
          {product.description && <p className="product-desc">{product.description}</p>}

          <dl className="facts">
            <div><dt>Loại</dt><dd>{product.category.name}</dd></div>
            {weight && <div><dt>Quy cách</dt><dd>{weight}</dd></div>}
            <div>
              <dt>Còn lại</dt>
              <dd className={product.stock === 0 ? 'out' : product.stock <= 12 ? 'low' : ''}>
                {product.stock === 0 ? 'Hết hàng' : `${product.stock} sản phẩm`}
              </dd>
            </div>
          </dl>

          {canAdd > 0 ? (
            <div className="buy">
              <QuantityInput value={quantity} max={canAdd} onChange={setQuantity} disabled={busy} />
              <button type="button" className="button button-grow" onClick={handleAdd} disabled={busy}>
                {busy ? 'Đang thêm' : `Thêm vào giỏ, ${formatPrice(product.price * quantity)}`}
              </button>
            </div>
          ) : (
            <p className="muted">
              {product.stock === 0 ? 'Món này tạm hết. Quay lại sau vài hôm nhé.' : `Bạn đã có đủ ${inCart} món trong giỏ, bằng số còn trong kho.`}
            </p>
          )}
          {inCart > 0 && canAdd > 0 && <p className="muted small">Trong giỏ đã có {inCart}.</p>}
          <Alert>{error}</Alert>
        </div>
      </article>

      {related.length > 0 && (
        <section className="related">
          <h2>Cùng kệ {product.category.name.toLowerCase()}</h2>
          <ul className="related-list">
            {related.map((p) => (
              <li key={p.id}>
                <Link to={`/products/${p.slug}`}>
                  <ProductArt name={p.name} categorySlug={p.category.slug} />
                  <span>{p.name}</span>
                  <strong>{formatPrice(p.price)}</strong>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
