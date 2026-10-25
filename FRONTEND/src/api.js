export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const TOKEN_KEY = "chat_token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

// Decode the JWT payload (no verification — the server does that).
export function decodeToken(token) {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(payload)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function isTokenValid(token) {
  const p = token && decodeToken(token);
  return !!(p && p.username && (!p.exp || p.exp * 1000 > Date.now()));
}

async function request(path, { method = "GET", body, token } = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Cannot reach the server. Is the backend running?");
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && token) {
      window.dispatchEvent(new Event("auth:expired"));
    }
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  register: (username, password) =>
    request("/api/auth/register", { method: "POST", body: { username, password } }),
  login: (username, password) =>
    request("/api/auth/login", { method: "POST", body: { username, password } }),
  users: (token) => request("/api/auth/users", { token }),
  messages: (token, withUser) =>
    request(`/api/messages/${encodeURIComponent(withUser)}`, { token }),
  sendMessage: (token, receiver, message) =>
    request("/api/messages", { method: "POST", token, body: { receiver, ...message } }),
};
