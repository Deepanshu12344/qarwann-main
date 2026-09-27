import { useEffect, useState, useCallback } from "react";
import { api, setCsrfToken } from "./api";

export type AdminUser = { email: string; role: string };

const EVENT = "qarwaan:auth-change";

function emit() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

export async function adminLogin(email: string, password: string): Promise<AdminUser> {
  const data = await api<{ csrfToken: string; user: AdminUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setCsrfToken(data.csrfToken);
  emit();
  return data.user;
}

export async function adminLogout() {
  try {
    await api("/api/auth/logout", { method: "POST", auth: true });
  } finally {
    setCsrfToken(null);
  }
  emit();
}

export function useAdminAuth() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api<{ csrfToken: string; user: AdminUser }>("/api/auth/me", { auth: true })
      .then((d) => {
        if (!cancelled) {
          setCsrfToken(d.csrfToken);
          setUser(d.user);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCsrfToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = useCallback(async () => {
    await adminLogout();
  }, []);

  return { user, loading, isAuthenticated: !!user, logout };
}
