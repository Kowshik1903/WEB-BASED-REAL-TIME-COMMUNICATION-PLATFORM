import { useCallback, useEffect, useState } from "react";
import { decodeToken, isTokenValid, tokenStore } from "./api";
import AuthPage from "./components/AuthPage.jsx";
import Chat from "./components/Chat.jsx";

export default function App() {
  const [token, setToken] = useState(() => {
    const t = tokenStore.get();
    return isTokenValid(t) ? t : null;
  });
  const [theme, setTheme] = useState(() => localStorage.getItem("chat_theme") || "system");
  const [sound, setSound] = useState(() => localStorage.getItem("chat_sound") !== "off");

  const username = token ? decodeToken(token)?.username : null;

  useEffect(() => {
    const el = document.documentElement;
    if (theme === "system") el.removeAttribute("data-theme");
    else el.setAttribute("data-theme", theme);
    localStorage.setItem("chat_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("chat_sound", sound ? "on" : "off");
  }, [sound]);

  const handleLogin = useCallback((t) => {
    tokenStore.set(t);
    setToken(t);
  }, []);

  const handleLogout = useCallback(() => {
    tokenStore.clear();
    setToken(null);
  }, []);

  // Server rejected our token (expired after 1h, etc.)
  useEffect(() => {
    const onExpired = () => handleLogout();
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, [handleLogout]);

  // Auto-logout exactly when the token expires.
  useEffect(() => {
    if (!token) return;
    const exp = decodeToken(token)?.exp;
    if (!exp) return;
    const id = setTimeout(handleLogout, Math.max(exp * 1000 - Date.now(), 0));
    return () => clearTimeout(id);
  }, [token, handleLogout]);

  if (!token || !username) return <AuthPage onLogin={handleLogin} />;
  return (
    <Chat
      token={token}
      username={username}
      onLogout={handleLogout}
      theme={theme}
      setTheme={setTheme}
      sound={sound}
      setSound={setSound}
    />
  );
}
