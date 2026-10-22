
import { useState, type FormEvent, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "../../../services/authApi";
import "./SignupPage.css";

export default function SignupPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (form.password !== form.confirm_password) {
      setError("رمز عبور و تکرار آن یکسان نیستند.");
      return;
    }

    setLoading(true);

    try {
      const result = await signup({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        password: form.password,
      });

      setSuccess(result.message);

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1200);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "ثبت‌نام انجام نشد. دوباره تلاش کنید.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="signup-page">
      <section className="signup-card">
        <h1 className="signup-title">ایجاد حساب کاربری</h1>

        <p className="signup-subtitle">
          برای ساخت حساب، اطلاعات خود را وارد کنید.
        </p>

        <form className="signup-form" onSubmit={handleSubmit}>
          <div className="signup-name-row">
            <div className="signup-field">
              <label htmlFor="first_name">نام</label>
              <input
                id="first_name"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                autoComplete="given-name"
                required
              />
            </div>

            <div className="signup-field">
              <label htmlFor="last_name">نام خانوادگی</label>
              <input
                id="last_name"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                autoComplete="family-name"
                required
              />
            </div>
          </div>

          <div className="signup-field">
            <label htmlFor="phone">شماره موبایل</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="09123456789"
              autoComplete="tel"
              required
            />
          </div>

          <div className="signup-field">
            <label htmlFor="email">ایمیل (اختیاری)</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="example@email.com"
              autoComplete="email"
            />
          </div>

          <div className="signup-field">
            <label htmlFor="password">رمز عبور</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
            />
            <small>رمز عبور باید حداقل ۱۲ کاراکتر باشد.</small>
          </div>

          <div className="signup-field">
            <label htmlFor="confirm_password">تکرار رمز عبور</label>
            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              value={form.confirm_password}
              onChange={handleChange}
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
            />
          </div>

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          {success && (
            <p className="signup-success" role="status">{success}</p>
          )}

          <button className="signup-button" type="submit" disabled={loading}>
            {loading ? "در حال ایجاد حساب..." : "ایجاد حساب"}
          </button>
        </form>

        <p className="signup-footer">
          قبلاً حساب ساخته‌اید؟ <Link to="/login">وارد شوید</Link>
        </p>
      </section>
    </main>
  );
}
