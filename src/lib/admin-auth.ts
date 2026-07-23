import { useEffect, useState, useCallback } from "react";
import { api, getToken, setToken } from "./api";

export type AdminUser = { email: string; role: string };

const EVENT = "qarwaan:auth-change";

function emit() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

export async function adminLogin(email: string, password: string): Promise<AdminUser> {
  const data = await api<{ token: string; user: AdminUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  emit();
  return data.user;
}

export function adminLogout() {
  setToken(null);
  emit();
}

export function useAdminAuth() {
  const [token, setT] = useState<string | null>(() => getToken());
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(!!getToken());

  useEffect(() => {
    const sync = () => setT(getToken());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    api<{ user: AdminUser }>("/api/auth/me", { auth: true })
      .then((d) => {
        if (!cancelled) setUser(d.user);
      })
      .catch(() => {
        if (!cancelled) {
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const logout = useCallback(() => {
    adminLogout();
  }, []);

  return { token, user, loading, isAuthenticated: !!user, logout };
}
