import { PublicErrorCode } from "../constants/errors";

export interface ParrotClientOptions {
  baseUrl?: string;
  token?: string;
  tenantId?: string;
  getToken?: () => Promise<string | undefined> | string | undefined;
  getTenantId?: () => Promise<string | undefined> | string | undefined;
  headers?: Record<string, string>;
  fetchFn?: typeof fetch;
}

export interface ApiResponse<T = any> {
  status: "success" | "error";
  message?: string;
  data?: T;
  errors?: {
    code?: string;
    message?: string;
    publicCode?: PublicErrorCode;
    details?: string;
  };
}

export class ParrotApiError extends Error {
  readonly __brand = "Parrot" as const;
  public readonly status: number;
  public readonly publicCode?: PublicErrorCode;
  public readonly errorCode?: string;
  public readonly details?: string;

  constructor(
    status: number,
    message: string,
    publicCode?: PublicErrorCode,
    errorCode?: string,
    details?: string,
  ) {
    super(message);
    this.name = "ParrotApiError";
    this.status = status;
    this.publicCode = publicCode;
    this.errorCode = errorCode;
    this.details = details;
  }
}

export class HttpClient {
  private baseUrl: string;
  private token?: string;
  private tenantId?: string;
  private getTokenFn?: () => Promise<string | undefined> | string | undefined;
  private getTenantIdFn?: () => Promise<string | undefined> | string | undefined;
  private customHeaders: Record<string, string>;
  private fetchFn: typeof fetch;

  constructor(options: ParrotClientOptions = {}) {
    const rawUrl =
      options.baseUrl ||
      (typeof process !== "undefined" && process.env
        ? process.env.NEXT_PUBLIC_API_URL || process.env.PARROT_API_URL
        : undefined) ||
      "http://localhost:8080";

    this.baseUrl = rawUrl.replace(/\/$/, "");
    this.token = options.token;
    this.tenantId = options.tenantId;
    this.getTokenFn = options.getToken;
    this.getTenantIdFn = options.getTenantId;
    this.customHeaders = options.headers || {};
    this.fetchFn = options.fetchFn || globalThis.fetch.bind(globalThis);
  }

  setToken(token: string | undefined) {
    this.token = token;
  }

  setTenantId(tenantId: string | undefined) {
    this.tenantId = tenantId;
  }

  async request<T>(
    endpoint: string,
    options: {
      method?: string;
      body?: any;
      query?: Record<string, string | number | undefined>;
      headers?: Record<string, string>;
    } = {},
  ): Promise<ApiResponse<T>> {
    let url = `${this.baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

    if (options.query) {
      const searchParams = new URLSearchParams();
      for (const [key, val] of Object.entries(options.query)) {
        if (val !== undefined) {
          searchParams.append(key, String(val));
        }
      }
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...this.customHeaders,
      ...options.headers,
    };

    const resolvedToken = this.getTokenFn ? await this.getTokenFn() : this.token;
    if (resolvedToken) {
      headers["Authorization"] = `Bearer ${resolvedToken}`;
    }

    const resolvedTenantId = this.getTenantIdFn ? await this.getTenantIdFn() : this.tenantId;
    console.log(`This is tenant ${resolvedTenantId}`)
    if (resolvedTenantId) {
      headers["x-tenant-id"] = resolvedTenantId;
    }

    const response = await this.fetchFn(url, {
      method: options.method || "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const json: ApiResponse<T> = await response.json().catch(() => ({
      status: "error",
      message: "Invalid JSON response from server",
    }));

    if (!response.ok || json.status === "error") {
      throw new ParrotApiError(
        response.status,
        json.message || json.errors?.message || "An API error occurred",
        json.errors?.publicCode,
        json.errors?.code,
        json.errors?.details,
      );
    }

    return json;
  }

  get<T>(
    endpoint: string,
    query?: Record<string, any>,
    headers?: Record<string, string>,
  ) {
    return this.request<T>(endpoint, { method: "GET", query, headers });
  }

  post<T>(endpoint: string, body?: any, headers?: Record<string, string>) {
    return this.request<T>(endpoint, { method: "POST", body, headers });
  }

  patch<T>(endpoint: string, body?: any, headers?: Record<string, string>) {
    return this.request<T>(endpoint, { method: "PATCH", body, headers });
  }

  delete<T>(endpoint: string, headers?: Record<string, string>) {
    return this.request<T>(endpoint, { method: "DELETE", headers });
  }
}
