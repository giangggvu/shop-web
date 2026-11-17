import { useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ApiError, errorMessage } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { ProductArt } from "../components/ProductArt";
import { Alert } from "../components/ui";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) {
    return <Navigate to={from} replace />;
  }

  const isRegister = mode === "register";

  function validate(): Record<string, string> {
    const found: Record<string, string> = {};
    if (isRegister && !fullName.trim())
      found.fullName = "Cho mình biết tên bạn nhé";
    if (!EMAIL_PATTERN.test(email.trim())) found.email = "Email chưa đúng dạng";
    if (isRegister && (password.length < 8 || password.length > 64))
      found.password = "Mật khẩu cần từ 8 đến 64 ký tự";
    if (!isRegister && !password) found.password = "Nhập mật khẩu";
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
      if (isRegister) await register(fullName.trim(), email.trim(), password);
      else await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401)
        setError("Email hoặc mật khẩu chưa đúng.");
      else if (err instanceof ApiError && err.status === 409)
        setError("Email này đã có tài khoản. Bạn thử đăng nhập nhé.");
      else setError(errorMessage(err));
      if (err instanceof ApiError) setErrors(err.fieldErrors);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <div className="auth-art" aria-hidden="true">
        <ProductArt name="Cà phê Arabica Cầu Đất 250g" categorySlug="ca-phe" />
        <ProductArt name="Trà Thái Nguyên móc câu 200g" categorySlug="tra" />
      </div>
      <div className="auth-card">
        <h1>{isRegister ? "Tạo tài khoản" : "Đăng nhập"}</h1>
        <p className="muted">
          {isRegister
            ? "Để giữ giỏ hàng và xem lại đơn trên mọi thiết bị."
            : "Giỏ hàng và đơn của bạn đang chờ ở đây."}
        </p>

        <form onSubmit={handleSubmit} className="form" noValidate>
          {isRegister && (
            <Field label="Họ và tên" error={errors.fullName}>
              <input
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </Field>
          )}
          <Field label="Email" error={errors.email}>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Mật khẩu" error={errors.password}>
            <input
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>

          <Alert>{error}</Alert>

          <button type="submit" className="button button-wide" disabled={busy}>
            {busy ? "Đang xử lý" : isRegister ? "Tạo tài khoản" : "Đăng nhập"}
          </button>
        </form>

        <p className="muted switch">
          {isRegister ? "Đã có tài khoản? " : "Chưa có tài khoản? "}
          <Link to={isRegister ? "/login" : "/register"} state={location.state}>
            {isRegister ? "Đăng nhập" : "Đăng ký"}
          </Link>
        </p>
      </div>
    </div>
  );
}

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className={`field ${error ? "field-error" : ""}`}>
      <span>{label}</span>
      {children}
      {error && <small>{error}</small>}
    </label>
  );
}
