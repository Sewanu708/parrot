import type { HttpClient } from "../http";
import type { CreateTenantDto, UpdateTenantDto, TenantDto } from "../../schema/tenant";

export class TenantModule {
  constructor(private http: HttpClient) {}

  async create(input: CreateTenantDto) {
    return this.http.post<TenantDto>("/tenants", input);
  }

  async get(tenantId: string) {
    return this.http.get<TenantDto>(`/tenants/${tenantId}`);
  }

  async update(tenantId: string, input: UpdateTenantDto) {
    return this.http.patch<TenantDto>(`/tenants/${tenantId}`, input);
  }
}

