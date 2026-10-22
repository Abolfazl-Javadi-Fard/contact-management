
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../../../services/authApi";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login({ identifier, password });

      sessionStorage.setItem("access_token", result.access_token);
      sessionStorage.setItem("user", JSON.stringify(result.user));

      navigate("/contacts", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "ورود انجام نشد. دوباره تلاش کنید."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <h1 className="login-title">ورود به حساب کاربری</h1>

        <p className="login-subtitle">
          برای ورود، اطلاعات حساب خود را وارد کنید.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="identifier">شماره موبایل یا ایمیل</label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="شماره موبایل یا ایمیل خود را وارد کنید"
              autoComplete="username"
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">رمز عبور</label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="رمز عبور خود را وارد کنید"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <button className="login-button" type="submit" disabled={loading}>
            {loading ? "در حال ورود..." : "ورود"}
          </button>
        </form>

        <p className="login-footer">
          حساب کاربری ندارید؟ <Link to="/signup">ثبت‌نام کنید</Link>
        </p>

        <p className="login-footer">
          اطلاعات حساب خود را با دیگران به اشتراک نگذارید.
        </p>
      </section>
    </main>
  );
}
