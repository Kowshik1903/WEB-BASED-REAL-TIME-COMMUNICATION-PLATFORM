import { useState } from "react";
import { api } from "../api";
import Icon from "./Icons.jsx";

export default function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  function switchMode(next) {
    setMode(next);
    setError("");
    setPassword("");
    setConfirm("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const name = username.trim();
    if (!name || !password) return setError("Username and password are required.");
    if (isRegister) {
      if (name.length < 3) return setError("Username must be at least 3 characters.");
      if (password.length < 6) return setError("Password must be at least 6 characters.");
      if (password !== confirm) return setError("Passwords do not match.");
    }

    setLoading(true);
    try {
      if (isRegister) await api.register(name, password);
      // Registering signs you straight in
      const { token } = await api.login(name, password);
      onLogin(token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <div className="brand">
          <span className="brand-icon"><Icon name="logo" size={26} /></span>
          <span className="brand-name">Chat Portal</span>
        </div>

        <h1>{isRegister ? "Create your account" : "Welcome back"}</h1>
        <p className="muted">
          {isRegister ? "Pick a username and start chatting in seconds." : "Log in to continue your conversations."}
        </p>

        <div className="seg" role="tablist">
          <button type="button" role="tab" aria-selected={!isRegister} className={!isRegister ? "active" : ""} onClick={() => switchMode("login")}>
            Log in
          </button>
          <button type="button" role="tab" aria-selected={isRegister} className={isRegister ? "active" : ""} onClick={() => switchMode("register")}>
            Sign up
          </button>
        </div>

        {error && <div className="alert" role="alert">{error}</div>}

        <label>
          Username
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
            placeholder="e.g. kowshik"
          />
        </label>

        <label>
          Password
          <div className="pw-wrap">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isRegister ? "new-password" : "current-password"}
              placeholder="••••••••"
            />
            <button type="button" className="icon-btn tiny" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Hide password" : "Show password"}>
              <Icon name={showPw ? "eyeOff" : "eye"} size={20} />
            </button>
          </div>
        </label>

        {isRegister && (
          <label>
            Confirm password
            <input
              type={showPw ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              placeholder="••••••••"
            />
          </label>
        )}

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading && <span className="spinner" aria-hidden="true" />}
          {loading ? "Please wait…" : isRegister ? "Create account" : "Log in"}
        </button>
      </form>
    </div>
  );
}
