import { parrotClient } from "./parrot";

export interface AuthSession {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  tenantId?: string;
}

export const authStorage = {
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("parrot_auth_token");
  },

  getTenantId(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("parrot_active_tenant_id");
  },

  getUser(): any | null {
    if (typeof window === "undefined") return null;
    const str = localStorage.getItem("parrot_user");
    return str ? JSON.parse(str) : null;
  },

  setSession(token: string, user: any, tenantId?: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem("parrot_auth_token", token);
    localStorage.setItem("parrot_user", JSON.stringify(user));
    if (tenantId) {
      localStorage.setItem("parrot_active_tenant_id", tenantId);
    }
    parrotClient.setToken(token);
    parrotClient.setTenantId(tenantId);
  },

  setTenantId(tenantId: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem("parrot_active_tenant_id", tenantId);
    parrotClient.setTenantId(tenantId);
  },

  clearSession() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("parrot_auth_token");
    localStorage.removeItem("parrot_user");
    localStorage.removeItem("parrot_active_tenant_id");
    parrotClient.setToken(undefined);
    parrotClient.setTenantId(undefined);
  },

  initClientFromStorage() {
    const token = this.getToken();
    const tenantId = this.getTenantId();
    if (token) parrotClient.setToken(token);
    if (tenantId) parrotClient.setTenantId(tenantId);
  },
};
