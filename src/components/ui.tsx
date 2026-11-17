import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { OrderStatus } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { STATUS_LABEL } from "../lib/format";

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`status status-${status.toLowerCase()}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Alert({
  children,
  tone = "error",
}: {
  children: ReactNode;
  tone?: "error" | "success" | "info";
}) {
  if (!children) return null;
  return (
    <div
      className={`alert alert-${tone}`}
      role={tone === "error" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}

export function Spinner({ label = "Đang tải" }: { label?: string }) {
  return (
    <div className="spinner" role="status">
      <span className="spinner-dot" aria-hidden="true" />
      {label}
    </div>
  );
}

export function CardSkeletons({ count }: { count: number }) {
  return (
    <ul className="grid" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="card card-skeleton">
          <div className="sk sk-art" />
          <div className="card-body">
            <div className="sk sk-line" />
            <div className="sk sk-line sk-short" />
          </div>
        </li>
      ))}
    </ul>
  );
}

const CHECKOUT_STEPS = ["Giỏ hàng", "Giao hàng", "Thanh toán"];

export function CheckoutSteps({ current }: { current: 0 | 1 | 2 }) {
  return (
    <ol className="steps" aria-label="Các bước đặt hàng">
      {CHECKOUT_STEPS.map((label, i) => (
        <li
          key={label}
          className={
            i < current ? "step-done" : i === current ? "step-now" : ""
          }
          aria-current={i === current ? "step" : undefined}
        >
          <span className="step-dot">{i < current ? "✓" : i + 1}</span>
          {label}
        </li>
      ))}
    </ol>
  );
}

const TIMELINE: { status: OrderStatus; label: string }[] = [
  { status: "PENDING_PAYMENT", label: "Đã đặt" },
  { status: "PAID", label: "Đã thanh toán" },
  { status: "SHIPPING", label: "Đang giao" },
  { status: "COMPLETED", label: "Đã nhận hàng" },
];

export function OrderTimeline({ status }: { status: OrderStatus }) {
  if (status === "CANCELLED") {
    return (
      <p className="timeline-cancelled">
        Đơn đã huỷ. Hàng đã được trả lại kho.
      </p>
    );
  }
  const reached = TIMELINE.findIndex((step) => step.status === status);
  return (
    <ol className="timeline" aria-label="Tiến trình đơn hàng">
      {TIMELINE.map((step, i) => (
        <li
          key={step.status}
          className={i <= reached ? "reached" : ""}
          aria-current={i === reached ? "step" : undefined}
        >
          <span className="timeline-dot" aria-hidden="true" />
          {step.label}
        </li>
      ))}
    </ol>
  );
}

export function RequireAuth({
  children,
  admin = false,
}: {
  children: ReactNode;
  admin?: boolean;
}) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }
  if (admin && user.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export function QuantityInput({
  value,
  max,
  onChange,
  disabled,
  size = "normal",
}: {
  value: number;
  max: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  size?: "normal" | "small";
}) {
  const limit = Math.max(1, Math.min(max, 99));
  return (
    <div className={`qty qty-${size}`}>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= 1}
        aria-label="Bớt một"
      >
        −
      </button>
      <span aria-live="polite">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= limit}
        aria-label="Thêm một"
      >
        +
      </button>
    </div>
  );
}
