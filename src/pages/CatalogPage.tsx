import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { api, errorMessage } from '../api/client'
import type { Category, Page, Product } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { useCart } from '../cart/CartContext'
import { ProductArt } from '../components/ProductArt'
import { Alert, CardSkeletons } from '../components/ui'
import { formatPrice } from '../lib/format'

const PAGE_SIZE = 12

const PRICE_RANGES = [
  { key: '', label: 'Mọi mức giá' },
  { key: 'lt100', label: 'Dưới 100.000đ', max: 99_999 },
  { key: '100-200', label: 'Từ 100.000đ đến 200.000đ', min: 100_000, max: 200_000 },
  { key: 'gt200', label: 'Trên 200.000đ', min: 200_001 },
] as const

const SORTS = [
  { key: 'newest', label: 'Mới lên kệ' },
  { key: 'price_asc', label: 'Giá thấp trước' },
  { key: 'price_desc', label: 'Giá cao trước' },
] as const

// Drawn from names alone, so the shelf shows at once even while the free server is still waking up.
const SHELF = [
  { name: 'Cà phê Robusta Đắk Lắk 500g', slug: 'ca-phe-robusta-dak-lak-500g', category: 'ca-phe' },
  { name: 'Trà sen hộp 100g', slug: 'tra-sen-hop-100g', category: 'tra' },
  { name: 'Ấm pha trà gốm 300ml', slug: 'am-pha-tra-gom-300ml', category: 'dung-cu-pha-che' },
]

export function CatalogPage() {
  // Filters live in the URL, so a filtered view can be shared or bookmarked.
  const [params, setParams] = useSearchParams()
  const category = params.get('category') ?? ''
  const q = params.get('q') ?? ''
  const price = params.get('price') ?? ''
  const sort = params.get('sort') ?? 'newest'
  const page = Math.max(0, Number(params.get('page') ?? 0) || 0)

  const [categories, setCategories] = useState<Category[]>([])
  const [result, setResult] = useState<Page<Product> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState(q)
  const [lastQ, setLastQ] = useState(q)

  // Keep the search box in step when the URL changes, for example on Back.
  if (q !== lastQ) {
    setLastQ(q)
    setSearch(q)
  }

  useEffect(() => {
    api<Category[]>('/api/categories').then(setCategories).catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    let current = true
    const range = PRICE_RANGES.find((r) => r.key === price)
    api<Page<Product>>('/api/products', {
      query: {
        category, q, sort, page, size: PAGE_SIZE,
        minPrice: range && 'min' in range ? range.min : undefined,
        maxPrice: range && 'max' in range ? range.max : undefined,
      },
    })
      .then((data) => {
        if (!current) return
        setResult(data)
        setError('')
      })
      .catch((err) => current && setError(errorMessage(err)))
      .finally(() => current && setLoading(false))
    return () => {
      current = false
      setLoading(true)
    }
  }, [category, q, price, sort, page])

  function update(changes: Record<string, string>) {
    const next = new URLSearchParams(params)
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)))
    if (!('page' in changes)) next.delete('page')
    setParams(next)
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault()
    update({ q: search.trim() })
  }

  const filtered = Boolean(category || q || price)

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <h1>Trà và cà phê, gói từ nơi trồng.</h1>
          <p>
            Robusta Đắk Lắk, Arabica Cầu Đất, Shan Tuyết Hà Giang, trà ướp sen. Đặt trong hai phút,
            trả tiền bằng một lần quét mã QR.
          </p>
          <a href="#ke-hang" className="button">Xem cả kệ</a>
        </div>
        <div className="shelf" aria-label="Vài món nổi bật">
          {SHELF.map((item, i) => (
            <Link key={item.slug} to={`/products/${item.slug}`} className={`shelf-item shelf-item-${i}`}>
              <ProductArt name={item.name} categorySlug={item.category} />
            </Link>
          ))}
          <div className="shelf-board" aria-hidden="true" />
        </div>
      </section>

      <section id="ke-hang" className="shop">
        <div className="toolbar">
          <div className="tabs" role="tablist" aria-label="Danh mục">
            <button type="button" role="tab" aria-selected={!category} className="tab"
              onClick={() => update({ category: '' })}>Tất cả</button>
            {categories.map((c) => (
              <button key={c.id} type="button" role="tab" aria-selected={category === c.slug} className="tab"
                onClick={() => update({ category: c.slug })}>{c.name}</button>
            ))}
          </div>
          <div className="toolbar-controls">
            <form onSubmit={submitSearch} className="search" role="search">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              <input type="search" aria-label="Tìm theo tên" placeholder="Tìm theo tên, ví dụ robusta" value={search}
                onChange={(e) => setSearch(e.target.value)} />
            </form>
            <select aria-label="Khoảng giá" value={price} onChange={(e) => update({ price: e.target.value })}>
              {PRICE_RANGES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
            <select aria-label="Sắp xếp" value={sort} onChange={(e) => update({ sort: e.target.value })}>
              {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div className="results-meta" aria-live="polite">
          {result && !loading && (
            <p>
              {result.totalItems} món{q && <> khớp “{q}”</>}
              {filtered && <button type="button" className="link-button" onClick={() => setParams(new URLSearchParams())}>Bỏ lọc</button>}
            </p>
          )}
        </div>

        <Alert>{error}</Alert>
        {loading && !error && <CardSkeletons count={result?.items.length || 6} />}

        {!loading && result && result.items.length === 0 && (
          <div className="empty">
            <h2>Kệ này chưa có món nào khớp</h2>
            <p className="muted">Thử bỏ bớt bộ lọc, hoặc tìm bằng một từ ngắn hơn.</p>
            <button type="button" className="button" onClick={() => setParams(new URLSearchParams())}>Xem cả kệ</button>
          </div>
        )}

        {!loading && result && result.items.length > 0 && (
          <ul className="grid">
            {result.items.map((product) => <ProductCard key={product.id} product={product} />)}
          </ul>
        )}

        {!loading && result && result.totalPages > 1 && (
          <nav className="pager" aria-label="Phân trang">
            {Array.from({ length: result.totalPages }, (_, i) => (
              <button key={i} type="button" className={`page-dot ${i === page ? 'page-now' : ''}`}
                aria-current={i === page ? 'page' : undefined} onClick={() => update({ page: String(i) })}>
                {i + 1}
              </button>
            ))}
          </nav>
        )}
      </section>
    </>
  )
}

function ProductCard({ product }: { product: Product }) {
  const { user } = useAuth()
  const { cart, add } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const inCart = cart.items.find((line) => line.productId === product.id)?.quantity ?? 0
  const soldOut = product.stock === 0
  const maxedOut = !soldOut && inCart >= product.stock

  async function quickAdd() {
    if (!user) {
      navigate('/login', { state: { from: location.pathname + location.search } })
      return
    }
    setBusy(true)
    setError('')
    try {
      await add(product.id, 1)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className={`card ${soldOut ? 'card-soldout' : ''}`}>
      <Link to={`/products/${product.slug}`} className="card-art" tabIndex={-1} aria-hidden="true">
        <ProductArt name={product.name} categorySlug={product.category.slug} />
      </Link>
      <div className="card-body">
        <Link to={`/products/${product.slug}`} className="card-title">{product.name}</Link>
        <div className="card-foot">
          <span className="card-price">{formatPrice(product.price)}</span>
          {soldOut ? (
            <span className="pill pill-out">Hết hàng</span>
          ) : (
            <button type="button" className="add-button" onClick={quickAdd} disabled={busy || maxedOut}
              aria-label={`Thêm ${product.name} vào giỏ`}>
              {busy ? '…' : maxedOut ? 'Đã lấy hết' : inCart > 0 ? `Thêm (${inCart})` : 'Thêm'}
            </button>
          )}
        </div>
        {product.stock > 0 && product.stock <= 12 && <p className="low-stock">Chỉ còn {product.stock}</p>}
        {error && <p className="card-error">{error}</p>}
      </div>
    </li>
  )
}
