import { useMemo, useState } from "react";
import { useAuth } from "./authState";

const isValidEmail = (value) => {
  const email = String(value || "").trim();
  if (!email || email.includes(" ") || email.includes("..")) return false;
  if (email.startsWith(".") || email.endsWith(".")) return false;
  const atIndex = email.indexOf("@");
  if (atIndex <= 0 || atIndex !== email.lastIndexOf("@")) return false;
  const localPart = email.slice(0, atIndex);
  const domainPart = email.slice(atIndex + 1);
  if (!localPart || !domainPart) return false;
  if (localPart.startsWith(".") || localPart.endsWith(".")) return false;
  if (domainPart.startsWith(".") || domainPart.endsWith(".")) return false;
  if (!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(localPart)) return false;
  const domainSegments = domainPart.split(".");
  if (domainSegments.length < 2) return false;
  if (domainSegments.some((segment) => segment.length < 2 || !/^[A-Za-z0-9-]+$/.test(segment))) return false;
  const tld = domainSegments[domainSegments.length - 1];
  return /^[A-Za-z]{2,}$/.test(tld);
};

const isStrongPassword = (value) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(String(value || ""));

function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState(window.location.pathname === "/register" ? "register" : "login");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const emailError = useMemo(() => {
    if (!form.email) return "";
    return isValidEmail(form.email) ? "" : "Invalid email address.";
  }, [form.email]);

  const passwordError = useMemo(() => {
    if (!form.password) return "";
    return isStrongPassword(form.password)
      ? ""
      : "Password must contain:\n• At least 8 characters\n• One uppercase letter\n• One lowercase letter\n• One number\n• One special character";
  }, [form.password]);

  const confirmPasswordError = useMemo(() => {
    if (mode !== "register" || !form.confirmPassword) return "";
    return form.password === form.confirmPassword ? "" : "Passwords do not match.";
  }, [form.confirmPassword, form.password, mode]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (mode === "register") {
      if (!isValidEmail(form.email)) {
        setError("Invalid email address.");
        return;
      }
      if (!isStrongPassword(form.password)) {
        setError("Password must contain:\n• At least 8 characters\n• One uppercase letter\n• One lowercase letter\n• One number\n• One special character");
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setBusy(true);
    try {
      if (mode === "register") {
        await register(form);
        setMode("login");
        setError("Registration successful. Please log in.");
      } else {
        await login({ email: form.email, password: form.password });
      }
    } catch (requestError) {
      setError(requestError.message || "Unable to connect to the server. Please make sure the backend is running.");
    } finally { setBusy(false); }
  };

  return <main className="auth-shell">
    <div className="auth-glow auth-glow-one" /><div className="auth-glow auth-glow-two" />
    <section className="auth-brand"><div className="auth-logo">✦</div><h1>DocuMind</h1><p>AI DOCUMENT INTELLIGENCE</p><span>Understand. Analyze. Simplify.</span></section>
    <form className="auth-card" onSubmit={submit}>
      <div className="auth-card-heading"><span>SECURE WORKSPACE</span><h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2><p>{mode === "login" ? "Sign in to continue analyzing your documents." : "Start analyzing your documents with AI."}</p></div>
      {mode === "register" && <label>Full Name<input required placeholder="Your full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>}
      <label>Email<input required type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
      {emailError && <p className="auth-error" role="alert">{emailError}</p>}
      <label>Password<input required type="password" placeholder="At least 8 characters" minLength="8" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
      {passwordError && <p className="auth-error" role="alert">{passwordError}</p>}
      {mode === "register" && <label>Confirm Password<input required type="password" placeholder="Repeat your password" minLength="8" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} /></label>}
      {confirmPasswordError && <p className="auth-error" role="alert">{confirmPasswordError}</p>}
      {error && <p className={error.startsWith("Registration") ? "auth-notice" : "auth-error"} role="alert">{error}</p>}
      <button className="auth-primary" type="submit" disabled={busy}>{busy ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}</button>
      <button className="auth-switch" type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>{mode === "login" ? "Don't have an account? Create Account" : "Already have an account? Sign In"}</button>
      <small className="auth-footnote">Secure AI document workspace</small>
    </form>
  </main>;
}

export default AuthScreen;
