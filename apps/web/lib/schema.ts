import { z } from "zod";

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Signup form validation schema
 */
export const signupSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type SignupFormData = z.infer<typeof signupSchema>;

/**
 * Create Workspace form validation schema
 */
export const createWorkspaceSchema = z.object({
  name: z.string().min(2, "Workspace name must be at least 2 characters"),
  propertyName: z.string().min(2, "Property name must be at least 2 characters"),
  domain: z.string().optional(),
  supportEmail: z
    .string()
    .email("Please enter a valid support email address")
    .optional()
    .or(z.literal("")),
  brandColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Please select a valid hex color")
    .optional(),
  logoUrl: z.string().url().optional(),
});

export type CreateWorkspaceFormData = z.infer<typeof createWorkspaceSchema>;

export const GeneralSettingsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  domain: z.string().max(255).optional().or(z.literal("")),
  supportEmail: z.email("Invalid email").optional().or(z.literal("")),
});

export type GeneralSettingsFormData = z.infer<typeof GeneralSettingsSchema>;

export const CannedResponseFormSchema = z.object({
  shortcut: z
    .string()
    .min(1, "Shortcut is required")
    .max(50, "Shortcut must be 50 characters or less")
    .regex(/^[a-zA-Z0-9_-]+$/, "Only letters, numbers, hyphens, and underscores allowed"),
  content: z.string().min(1, "Response content is required"),
  visibility: z.enum(["shared", "personal"]),
});

export type CannedResponseFormData = z.infer<typeof CannedResponseFormSchema>;