import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { api, ApiError, errorMessage } from "../api/client";
import type { Order, OrderSummary, Page } from "../api/types";
import { categoryFromName, ProductArt } from "../components/ProductArt";
import {
  Alert,
  CheckoutSteps,
  OrderTimeline,
  Spinner,
  StatusBadge,
} from "../components/ui";
import { formatDate, formatPrice } from "../lib/format";

export function OrdersPage() {
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<Page<OrderSummary> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Page<OrderSummary>>("/api/orders", { query: { page, size: 10 } })
      .then(setResult)
      .catch((err) => setError(errorMessage(err)));
  }, [page]);

  if (error) return <Alert>{error}</Alert>;
  if (!result) return <Spinner />;

  if (result.items.length === 0) {
    return (
      <div className="empty">
        <h1>Bạn chưa đặt đơn nào</h1>
        <p className="muted">
          Đơn đầu tiên sẽ hiện ở đây, kèm mã QR để chuyển khoản.
        </p>
        <Link to="/" className="button">
          Ra kệ hàng
        </Link>
      </div>
    );
  }

  return (
    <div className="narrow">
      <h1>Đơn của tôi</h1>
      <ul className="order-list">
        {result.items.map((order) => (
          <li key={order.code}>
            <Link to={`/orders/${order.code}`} className="order-row">
              <span className="order-code">{order.code}</span>
              <span className="muted">{formatDate(order.createdAt)}</span>
              <StatusBadge status={order.status} />
              <strong>{formatPrice(order.total)}</strong>
            </Link>
          </li>
        ))}
      </ul>
      {result.totalPages > 1 && (
        <nav className="pager" aria-label="Phân trang">
          {Array.from({ length: result.totalPages }, (_, i) => (
            <button
              key={i}
              type="button"
              className={`page-dot ${i === page ? "page-now" : ""}`}
              aria-current={i === page ? "page" : undefined}
              onClick={() => setPage(i)}
            >
              {i + 1}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

export function OrderPage() {
  const { code = "" } = useParams();
  const location = useLocation();
  const justPlaced =
    (location.state as { justPlaced?: boolean } | null)?.justPlaced ?? false;

  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState("");

  const load = useCallback(async () => {
    try {
      setOrder(await api<Order>(`/api/orders/${encodeURIComponent(code)}`));
      setError("");
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 404
          ? "Không có đơn nào mang mã này trong tài khoản của bạn."
          : errorMessage(err),
      );
    }
  }, [code]);

  useEffect(() => {
    load();
  }, [load]);

  async function recheck() {
    setChecking(true);
    await load();
    setChecking(false);
  }

  async function cancel() {
    if (!window.confirm("Huỷ đơn này? Hàng sẽ được trả lại kho.")) return;
    setBusy(true);
    try {
      setOrder(
        await api<Order>(`/api/orders/${encodeURIComponent(code)}/cancel`, {
          method: "POST",
        }),
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function copy(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(""), 1500);
    } catch {}
  }

  if (!order) return error ? <Alert>{error}</Alert> : <Spinner />;

  const payment = order.payment;
  const waiting = order.status === "PENDING_PAYMENT";

  return (
    <div className="narrow">
      {waiting && justPlaced && <CheckoutSteps current={2} />}
      {!justPlaced && (
        <Link to="/orders" className="back">
          Tất cả đơn
        </Link>
      )}

      <header className="order-head">
        <h1>
          {waiting && justPlaced
            ? "Còn một bước: chuyển khoản"
            : `Đơn ${order.code}`}
        </h1>
        <p className="muted">
          Mã đơn <span className="order-code">{order.code}</span>, đặt lúc{" "}
          {formatDate(order.createdAt)}
          {order.paidAt && `, thanh toán lúc ${formatDate(order.paidAt)}`}
        </p>
      </header>

      <OrderTimeline status={order.status} />
      <Alert>{error}</Alert>

      <div className="split">
        <section>
          {payment && (
            <div className="pay">
              <div className="qr-frame">
                <img
                  src={payment.qrImageUrl}
                  alt={`Mã VietQR chuyển ${formatPrice(payment.amount)} cho đơn ${order.code}`}
                  className="qr"
                />
              </div>
              <div className="pay-copy">
                <h2>Quét mã bằng app ngân hàng</h2>
                <p className="muted small">
                  Số tiền và nội dung đã điền sẵn. Nếu chuyển tay, nhớ ghi đúng
                  nội dung để shop nhận ra đơn.
                </p>
                <dl className="pay-details">
                  <div>
                    <dt>Số tiền</dt>
                    <dd>
                      <strong>{formatPrice(payment.amount)}</strong>
                    </dd>
                  </div>
                  <div>
                    <dt>Nội dung</dt>
                    <dd>
                      <strong className="order-code">
                        {payment.transferContent}
                      </strong>
                      <button
                        type="button"
                        className="copy"
                        onClick={() => copy("note", payment.transferContent)}
                      >
                        {copied === "note" ? "Đã chép" : "Chép"}
                      </button>
                    </dd>
                  </div>
                  <div>
                    <dt>Số tài khoản</dt>
                    <dd>
                      {payment.accountNo}
                      <button
                        type="button"
                        className="copy"
                        onClick={() => copy("acc", payment.accountNo)}
                      >
                        {copied === "acc" ? "Đã chép" : "Chép"}
                      </button>
                    </dd>
                  </div>
                  {payment.accountName && (
                    <div>
                      <dt>Chủ tài khoản</dt>
                      <dd>{payment.accountName}</dd>
                    </div>
                  )}
                  <div>
                    <dt>Ngân hàng</dt>
                    <dd>{payment.bankId}</dd>
                  </div>
                </dl>
                <button
                  type="button"
                  className="button button-ghost"
                  onClick={recheck}
                  disabled={checking}
                >
                  {checking ? "Đang kiểm tra" : "Tôi đã chuyển, kiểm tra lại"}
                </button>
              </div>
            </div>
          )}
          {!payment && waiting && (
            <Alert tone="info">
              Shop chưa bật chuyển khoản. Shop sẽ gọi bạn qua số {order.phone}{" "}
              để xác nhận.
            </Alert>
          )}

          <div className="ship-to">
            <h2>Giao đến</h2>
            <p>
              {order.recipientName}, {order.phone}
              <br />
              {order.address}
            </p>
            {order.note && <p className="muted">Ghi chú: {order.note}</p>}
          </div>
        </section>

        <aside className="receipt">
          <h2>Trong đơn</h2>
          <ul className="receipt-lines">
            {order.items.map((line) => (
              <li key={line.productId}>
                <ProductArt
                  name={line.productName}
                  categorySlug={categoryFromName(line.productName)}
                  className="art-mini"
                />
                <span>
                  {line.productName}
                  <small className="muted"> × {line.quantity}</small>
                </span>
                <span>{formatPrice(line.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <div className="total-row">
            <span>Tổng</span>
            <strong>{formatPrice(order.total)}</strong>
          </div>
          {waiting && (
            <button
              type="button"
              className="link-button danger"
              onClick={cancel}
              disabled={busy}
            >
              Huỷ đơn này
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}
