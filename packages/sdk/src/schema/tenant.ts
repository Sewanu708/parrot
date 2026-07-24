import { z } from "zod";

export const CreateTenantSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  domain: z.string().max(255).optional(),
  supportEmail: z.string().email().optional(),
  brandColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color format").optional(),
  logoUrl: z.string().url().optional(),
});

export type CreateTenantDto = z.infer<typeof CreateTenantSchema>;

export const UpdateTenantSchema = CreateTenantSchema.partial();

export type UpdateTenantDto = z.infer<typeof UpdateTenantSchema>;
