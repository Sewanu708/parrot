import { z } from "zod";

export const SignupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type SignupInput = z.infer<typeof SignupSchema>;

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export const ResendVerificationSchema = z.object({
  email: z.string().email("Invalid email address"),
});
export type ResendVerificationInput = z.infer<typeof ResendVerificationSchema>;

export interface SuccessResponse {
  message: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  tenants: {
    id: string;
    name: string;
    domain: string | null;
    logoUrl: string | null;
  }[];
  lastActiveTenantId: string | null;
}

export interface BaseApiResponse<T = any> {
  status: "success" | "error";
  message: string;
  data?: T;
  errors?: {
    code: string;
    message: string;
    details?: string;
    publicCode?: string;
  };
}
