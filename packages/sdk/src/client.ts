export interface BloodlineClientOptions {
  apiUrl: string;
  wsUrl?: string;
}

export class BloodlineClient {
  readonly apiUrl: string;
  readonly wsUrl: string;
  private _token?: string;

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
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (this._token) {
      headers['Authorization'] = `Bearer ${this._token}`;
    }

    const res = await fetch(url, {
      ...options,
      headers: { ...headers, ...options.headers },
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
    return JSON.parse(text) as T;
  }
}
