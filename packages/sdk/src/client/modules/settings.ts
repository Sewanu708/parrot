import type { HttpClient } from "../http";
import type { 
  UpdateBusinessHoursConfigDto, 
  BusinessHourDto, 
  BusinessHourExceptionDto,
  CannedResponseDto,
  CreateCannedResponseDto,
  UpdateCannedResponseDto,
  CustomAttributeDto,
  CreateCustomAttributeDto,
  UpdateCustomAttributeDto
} from "../../schema/settings";

export interface GetBusinessHoursResponse {
  hours: BusinessHourDto[];
  exceptions: BusinessHourExceptionDto[];
}

export class SettingsModule {
  constructor(private http: HttpClient) {}

  async getBusinessHours(propertyId: string) {
    return this.http.get<GetBusinessHoursResponse>(`/properties/${propertyId}/business-hours`);
  }

  async updateBusinessHours(propertyId: string, data: UpdateBusinessHoursConfigDto) {
    return this.http.put<GetBusinessHoursResponse>(`/properties/${propertyId}/business-hours`, data);
  }

  // Canned Responses
  async getCannedResponses() {
    return this.http.get<CannedResponseDto[]>("/settings/canned-responses");
  }

  async createCannedResponse(data: CreateCannedResponseDto) {
    return this.http.post<CannedResponseDto>("/settings/canned-responses", data);
  }

  async updateCannedResponse(id: string, data: UpdateCannedResponseDto) {
    return this.http.patch<CannedResponseDto>(`/settings/canned-responses/${id}`, data);
  }

  async deleteCannedResponse(id: string) {
    return this.http.delete<void>(`/settings/canned-responses/${id}`);
  }

  // Custom Attributes
  async getCustomAttributes() {
    return this.http.get<CustomAttributeDto[]>("/settings/custom-attributes");
  }

  async createCustomAttribute(data: CreateCustomAttributeDto) {
    return this.http.post<CustomAttributeDto>("/settings/custom-attributes", data);
  }

  async updateCustomAttribute(id: string, data: UpdateCustomAttributeDto) {
    return this.http.patch<CustomAttributeDto>(`/settings/custom-attributes/${id}`, data);
  }

  async deleteCustomAttribute(id: string) {
    return this.http.delete<void>(`/settings/custom-attributes/${id}`);
  }
}

