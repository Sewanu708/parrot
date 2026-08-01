import { z } from "zod";

export const CreateTenantSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  propertyName: z.string().min(2, "Property Name must be at least 2 characters").max(100),
  domain: z.string().max(255).optional(),
  supportEmail: z.string().email().optional(),
  brandColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color format").optional(),
  logoUrl: z.string().url().optional(),
});

export type CreateTenantDto = z.infer<typeof CreateTenantSchema>;

export const UpdateTenantSchema = CreateTenantSchema.partial();

export type UpdateTenantDto = z.infer<typeof UpdateTenantSchema>;

export interface TenantDto {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  defaultPropertyId?: string;
}

export const UpdatePropertySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  domain: z.string().max(255).optional(),
  supportEmail: z.string().email().optional(),
  brandColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color format").optional(),
  logoUrl: z.string().url().optional(),
  timezone: z.string().optional(),
});

export type UpdatePropertyDto = z.infer<typeof UpdatePropertySchema>;

export interface PropertyDto {
  id: string;
  tenantId: string;
  name: string;
  domain: string | null;
  supportEmail: string | null;
  brandColor: string | null;
  logoUrl: string | null;
  timezone: string;
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

