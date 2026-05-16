function resolveApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }

  if (typeof window === "undefined") {
    return "http://localhost:4000";
  }

  const { protocol, hostname, host } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:4000";
  }

  return `${protocol}//${host}`;
}

const API_URL = resolveApiBaseUrl();

type APIRequestOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | object | null;
  token?: string | null;
};

export function getApiUrl(path: string): string {
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getStoredProfile(): { walletAddress: string | null; authToken: string | null } {
  if (typeof window === "undefined") {
    return { walletAddress: null, authToken: null };
  }

  return {
    walletAddress: window.localStorage.getItem("bloodline.walletAddress"),
    authToken: window.localStorage.getItem("bloodline.authToken"),
  };
}

export async function fetchAPI<T>(path: string, options: APIRequestOptions = {}): Promise<T> {
  const { body, headers, token, ...rest } = options;
  const isJsonBody =
    body !== undefined &&
    body !== null &&
    typeof body === "object" &&
    !(body instanceof FormData) &&
    !(body instanceof URLSearchParams) &&
    !(body instanceof Blob) &&
    !(body instanceof ArrayBuffer);

  const res = await fetch(getApiUrl(path), {
    ...rest,
    headers: {
      Accept: "application/json",
      ...(isJsonBody ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: isJsonBody ? JSON.stringify(body) : (body as BodyInit | undefined),
    cache: "no-store",
  });

  if (!res.ok) {
    let message = `API ${res.status}: ${res.statusText}`;

    try {
      const payload = (await res.json()) as { error?: string; message?: string };
      message = payload.error ?? payload.message ?? message;
    } catch {
      // Ignore invalid JSON error bodies.
    }

    throw new Error(message);
  }

  return res.json() as Promise<T>;
}
