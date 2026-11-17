import { useCallback, useEffect, useState } from 'react'
import { api, errorMessage } from '../api/client'
import type { Order, OrderStatus, OrderSummary, Page } from '../api/types'
import { Alert, Spinner, StatusBadge } from '../components/ui'
import { formatDate, formatPrice, STATUS_LABEL } from '../lib/format'

/** The next steps the server allows from each status, mirroring OrderStatus.canMoveTo. */
const NEXT_STEPS: Record<OrderStatus, { status: OrderStatus; label: string; danger?: boolean }[]> = {
  PENDING_PAYMENT: [
    { status: 'PAID', label: 'Đã nhận tiền' },
    { status: 'CANCELLED', label: 'Huỷ', danger: true },
  ],
  PAID: [
    { status: 'SHIPPING', label: 'Giao hàng' },
    { status: 'CANCELLED', label: 'Huỷ, hoàn tiền', danger: true },
  ],
  SHIPPING: [{ status: 'COMPLETED', label: 'Hoàn tất' }],
  COMPLETED: [],
  CANCELLED: [],
}

const FILTERS: (OrderStatus | '')[] = ['', 'PENDING_PAYMENT', 'PAID', 'SHIPPING', 'COMPLETED', 'CANCELLED']

export function AdminOrdersPage() {
  const [status, setStatus] = useState<OrderStatus | ''>('PENDING_PAYMENT')
  const [page, setPage] = useState(0)
  const [result, setResult] = useState<Page<OrderSummary> | null>(null)
  const [error, setError] = useState('')
  const [busyCode, setBusyCode] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      setResult(await api<Page<OrderSummary>>('/api/admin/orders', { query: { status, page, size: 20 } }))
    } catch (err) {
      setError(errorMessage(err))
    }
  }, [status, page])

  useEffect(() => {
    load()
  }, [load])

  async function move(code: string, next: OrderStatus) {
    if (next === 'CANCELLED' && !window.confirm(`Huỷ đơn ${code}? Hàng sẽ được trả lại kho.`)) return
    setBusyCode(code)
    setError('')
    try {
      await api<Order>(`/api/admin/orders/${code}/status`, { method: 'PATCH', body: { status: next } })
      await load()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusyCode('')
    }
  }

  return (
    <div className="admin">
      <h1>Quản lý đơn hàng</h1>
      <p className="muted">
        Khi tiền về tài khoản với nội dung là mã đơn, bấm “Đã nhận tiền” để xác nhận.
      </p>

      <ul className="chips">
        {FILTERS.map((f) => (
          <li key={f || 'all'}>
            <button type="button" className={`chip ${status === f ? 'chip-on' : ''}`}
              onClick={() => { setStatus(f); setPage(0) }}>
              {f ? STATUS_LABEL[f] : 'Tất cả'}
            </button>
          </li>
        ))}
      </ul>

      <Alert>{error}</Alert>
      {!result && !error && <Spinner />}
      {result && result.items.length === 0 && <p className="muted">Không có đơn nào.</p>}

      {result && result.items.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Mã đơn</th><th>Đặt lúc</th><th>Tổng</th><th>Trạng thái</th><th aria-label="Thao tác" /></tr>
            </thead>
            <tbody>
              {result.items.map((order) => (
                <tr key={order.code}>
                  <td className="order-code">{order.code}</td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>{formatPrice(order.total)}</td>
                  <td><StatusBadge status={order.status} /></td>
                  <td className="actions">
                    {NEXT_STEPS[order.status].map((step) => (
                      <button key={step.status} type="button" disabled={busyCode === order.code}
                        className={`button button-small ${step.danger ? 'button-danger' : ''}`}
                        onClick={() => move(order.code, step.status)}>{step.label}</button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result && result.totalPages > 1 && (
        <nav className="pager">
          <button type="button" className="button button-ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>← Trước</button>
          <span className="muted">Trang {page + 1} / {result.totalPages}</span>
          <button type="button" className="button button-ghost" disabled={page + 1 >= result.totalPages} onClick={() => setPage(page + 1)}>Sau →</button>
        </nav>
      )}
    </div>
  )
}
