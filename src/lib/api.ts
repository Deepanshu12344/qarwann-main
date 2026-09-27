// Centralized client for the QARWAAN Express backend.
// Configure with VITE_API_BASE_URL (e.g. http://localhost:5000).

const ENV_BASE =
  (typeof import.meta !== "undefined" &&
    (import.meta as any).env?.VITE_API_BASE_URL) ||
  "";

export const API_BASE_URL: string =
  (ENV_BASE || "http://localhost:5000").replace(/\/+$/, "");

let csrfToken: string | null = null;

export function getCsrfToken(): string | null {
  return csrfToken;
}

export function setCsrfToken(token: string | null) {
  csrfToken = token;
}

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

type Opts = RequestInit & { auth?: boolean; raw?: boolean };

export async function api<T = any>(path: string, opts: Opts = {}): Promise<T> {
  const { auth, raw, headers, body, ...rest } = opts;
  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(headers as Record<string, string>),
  };
  if (body && !(body instanceof FormData) && !finalHeaders["Content-Type"]) {
    finalHeaders["Content-Type"] = "application/json";
  }
  if (auth && !["GET", "HEAD", "OPTIONS"].includes((rest.method || "GET").toUpperCase())) {
    const csrfToken = getCsrfToken();
    if (csrfToken) finalHeaders["X-CSRF-Token"] = csrfToken;
  }
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const res = await fetch(url, { ...rest, headers: finalHeaders, body, credentials: rest.credentials ?? "include" });
  if (raw) return res as any;
  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : await res.text();
  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && (data.message || data.error)) ||
      (typeof data === "string" && data) ||
      `Request failed (${res.status})`;
    throw new ApiError(msg, res.status, data);
  }
  return data as T;
}

export async function apiBlob(path: string, opts: Opts = {}): Promise<Blob> {
  const res = (await api(path, { ...opts, raw: true })) as unknown as Response;
  if (!res.ok) throw new ApiError(`Request failed (${res.status})`, res.status);
  return await res.blob();
}
