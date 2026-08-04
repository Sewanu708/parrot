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
  SL12: "Property not found.",
  SL13: "Conversation not found.",
  SL14: "Failed to send message.",
  CR01: "You don't have permission to create shared canned responses.",
  CR02: "Canned response not found.",
  CR03: "You don't have permission to edit shared canned responses.",
  CR04: "You can only edit your own personal canned responses.",
  CR05: "You don't have permission to make responses shared.",
  CR06: "Canned response not found.",
  CR07: "You don't have permission to delete shared canned responses.",
  CR08: "You can only delete your own personal canned responses.",
} as const;

export type PublicErrorCode = keyof typeof PUBLIC_ERROR_CODE;

