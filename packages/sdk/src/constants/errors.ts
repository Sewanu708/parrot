export const PUBLIC_ERROR_CODE = {
  SL00: "An unknown error occurred",
  SL01: "Validation failed",
  SL02: "Email is already in use",
  SL03: "Invalid credentials provided",
  SL04: "Verification link has expired. Please request a new one.",
  SL05: "User not found",
  SL06: "This email is linked to a different sign-in method.",
  SL07: "Missing or invalid authorization header",
  SL08: "Session expired or invalid",
  SL09: "No active workspace selected. Please select a workspace.",
  SL10: "Workspace not found.",
  SL11: "You do not have access to this workspace.",
} as const;

export type PublicErrorCode = keyof typeof PUBLIC_ERROR_CODE;
