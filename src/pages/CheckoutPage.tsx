import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api, ApiError, errorMessage } from "../api/client";
import type { Order } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { useCart } from "../cart/CartContext";
import { categoryFromName, ProductArt } from "../components/ProductArt";
import { Alert, CheckoutSteps, Spinner } from "../components/ui";
import { formatPrice, PHONE_PATTERN } from "../lib/format";
import { Field } from "./AuthPage";

export function CheckoutPage() {
  const { user } = useAuth();
  const { cart, loaded, refresh } = useCart();
  const navigate = useNavigate();

  const [recipientName, setRecipientName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loaded) {
    return <Spinner />;
  }
  if (cart.items.length === 0 && !busy) {
    return <Navigate to="/cart" replace />;
  }

  function validate(): Record<string, string> {
    const found: Record<string, string> = {};
    if (!recipientName.trim()) found.recipientName = "Nhập tên người nhận";
    if (!PHONE_PATTERN.test(phone.trim()))
      found.phone = "Số điện thoại Việt Nam 10 số, ví dụ 0912345678";
    if (!address.trim()) found.address = "Nhập địa chỉ giao hàng";
    return found;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    setError("");
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    try {
      const order = await api<Order>("/api/orders", {
        method: "POST",
        body: {
          recipientName: recipientName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          note: note.trim() || null,
        },
      });
      await refresh();
      navigate(`/orders/${order.code}`, {
        replace: true,
        state: { justPlaced: true },
      });
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 409
          ? `Chưa đặt được: ${err.message}. Bạn chỉnh lại giỏ hàng rồi thử lại nhé.`
          : errorMessage(err),
      );
      if (err instanceof ApiError) setErrors(err.fieldErrors);
      await refresh().catch(() => undefined);
      setBusy(false);
    }
  }

  return (
    <div className="narrow">
      <CheckoutSteps current={1} />
      <h1>Giao đến đâu?</h1>

      <div className="split">
        <form onSubmit={handleSubmit} className="form" noValidate>
          <Field label="Người nhận" error={errors.recipientName}>
            <input
              autoComplete="name"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
            />
          </Field>
          <Field label="Số điện thoại" error={errors.phone}>
            <input
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="0912345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>
          <Field label="Địa chỉ" error={errors.address}>
            <textarea
              rows={3}
              autoComplete="street-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </Field>
          <Field label="Ghi chú (không bắt buộc)" error={errors.note}>
            <input
              value={note}
              maxLength={500}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: giao giờ hành chính"
            />
          </Field>

          <Alert>{error}</Alert>
          <button type="submit" className="button button-wide" disabled={busy}>
            {busy ? "Đang đặt hàng" : `Đặt hàng, ${formatPrice(cart.total)}`}
          </button>
          <p className="muted small">
            Hàng được giữ cho bạn ngay khi đặt. Bước sau là quét mã QR để chuyển
            khoản.
          </p>
        </form>

        <aside className="receipt">
          <h2>Đơn của bạn</h2>
          <Link to="/cart" className="link-button quiet">
            Sửa giỏ hàng
          </Link>
          <ul className="receipt-lines">
            {cart.items.map((line) => (
              <li key={line.productId}>
                <ProductArt
                  name={line.name}
                  categorySlug={categoryFromName(line.name)}
                  className="art-mini"
                />
                <span>
                  {line.name}
                  <small className="muted"> × {line.quantity}</small>
                </span>
                <span>{formatPrice(line.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <div className="total-row">
            <span>Tổng</span>
            <strong>{formatPrice(cart.total)}</strong>
          </div>
        </aside>
      </div>
    </div>
  );
}
