export interface BloodlineClientOptions {
  apiUrl: string;
  wsUrl?: string;
}

export class BloodlineClient {
  readonly apiUrl: string;
  readonly wsUrl: string;
  protected _token?: string;

  constructor(apiUrl: string, wsUrl?: string);
  constructor(options: BloodlineClientOptions);
  constructor(apiUrlOrOptions: string | BloodlineClientOptions, wsUrl?: string) {
    if (typeof apiUrlOrOptions === 'object') {
      this.apiUrl = apiUrlOrOptions.apiUrl.replace(/\/$/, '');
      this.wsUrl = (apiUrlOrOptions.wsUrl ?? apiUrlOrOptions.apiUrl).replace(/\/$/, '');
    } else {
      this.apiUrl = apiUrlOrOptions.replace(/\/$/, '');
      this.wsUrl = (wsUrl ?? apiUrlOrOptions).replace(/\/$/, '');
    }
  }

  setToken(token: string): void {
    this._token = token;
  }

  clearToken(): void {
    this._token = undefined;
  }

  protected async fetch<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.apiUrl}${path.startsWith('/') ? path : `/${path}`}`;

    const optHeaders = options.headers;
    const mergedHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(optHeaders instanceof Headers
        ? Object.fromEntries(optHeaders.entries())
        : (optHeaders as Record<string, string> | undefined)),
    };
    if (this._token) {
      mergedHeaders['Authorization'] = `Bearer ${this._token}`;
    }

    const { headers: _discardedHeaders, ...restOptions } = options;

    const res = await fetch(url, {
      ...restOptions,
      headers: mergedHeaders,
    });

    if (!res.ok) {
      const body = await res.text();
      let err: Error;
      try {
        const json = JSON.parse(body);
        err = new Error(json.error ?? body ?? `HTTP ${res.status}`);
      } catch {
        err = new Error(body || `HTTP ${res.status}`);
      }
      throw err;
    }

    const text = await res.text();
    if (!text) return {} as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(`Invalid JSON response from ${path}: ${text.slice(0, 200)}`);
    }
  }
}
