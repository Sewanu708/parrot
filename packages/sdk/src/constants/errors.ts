export const ERROR_CODE = {
  AUTHERR: 'AUTHORIZATION_ERROR',
  NOAUTHERR: 'MISSING_AUTHORIZATION',
  INVLDAUTHTOKEN: 'INVALID_AUTH_TOKEN',
  INACTIVEACCT: 'INACTIVE_ACCOUNT',
  EXPIREDTOKEN: 'EXPIRED_TOKEN',
  INVLDREQ: 'INVALID_REQUEST',
  PERMERR: 'PERMISSION_ERROR',
  LIMITERR: 'LIMIT_ERROR',
  FEEERR: 'FEE_ERROR',
  NOTFOUND: 'RESOURCE_NOT_FOUND',
  APPERR: 'APPLICATION_ERROR',
  HTTPREQERR: 'INTERNAL_REQ_ERROR',
  DUPLRCRD: 'DUPLICATE_RECORD',
  VALIDATIONERR: 'VALIDATION_ERROR',
  INVLDDATA: 'INVALID_REQUEST_DATA',
  RTLIMERR: 'RATE_LIMIT_ERROR',
} as const;

export type ErrorCodeKey = keyof typeof ERROR_CODE;
export type ErrorCodeValue = (typeof ERROR_CODE)[ErrorCodeKey];

export const ERROR_STATUS_CODE_MAPPING = {
  AUTHORIZATION_ERROR: 401,
  MISSING_AUTHORIZATION: 401,
  INVALID_AUTH_TOKEN: 401,
  INACTIVE_ACCOUNT: 401,
  EXPIRED_TOKEN: 401,
  PERMISSION_ERROR: 401,
  INVALID_REQUEST: 400,
  LIMIT_ERROR: 403,
  FEE_ERROR: 403,
  RESOURCE_NOT_FOUND: 404,
  DUPLICATE_RECORD: 409,
  APPLICATION_ERROR: 500,
  RATE_LIMIT_ERROR: 429,
} as const;

export const HTTPStatusCode = {
  /** HTTP 200 OK */
  HTTP_200_OK: 200,
  /** HTTP 201 Created */
  HTTP_201_CREATED: 201,
  /** HTTP 204 No Content */
  HTTP_204_NO_CONTENT: 204,
  /** HTTP 400 Bad Request */
  HTTP_400_BAD_REQUEST: 400,
  /** HTTP 401 Unauthorized */
  HTTP_401_UNAUTHORIZED: 401,
  /** HTTP 403 Forbidden */
  HTTP_403_FORBIDDEN: 403,
  /** HTTP 500 Server Error */
  HTTP_500_SERVER_ERROR: 500,
} as const;

export const PERMISSIONS = {
  CONVERSATIONS_READ: "conversations:read",
  CONVERSATIONS_WRITE: "conversations:write",
  CONVERSATIONS_ASSIGN: "conversations:assign",
  TICKETS_READ: "tickets:read",
  TICKETS_WRITE: "tickets:write",
  KB_READ: "kb:read",
  KB_WRITE: "kb:write",
  KB_PUBLISH: "kb:publish",
  CANNED_RESPONSES_MANAGE: "canned_responses:manage",
  SETTINGS_MANAGE: "settings:manage",
  TEAM_READ: "team:read",
  TEAM_WRITE: "team:write",
  ROLES_MANAGE: "roles:manage",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

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
  CA01: "An attribute with this key already exists in this workspace.",
  CA02: "Custom attribute not found.",
  CA03: "Custom attribute not found.",
} as const;

export type PublicErrorCode = keyof typeof PUBLIC_ERROR_CODE;

export const AUTH_LOST_CODES: readonly PublicErrorCode[] = ["SL07", "SL08"];
export const WORKSPACE_LOST_CODES: readonly PublicErrorCode[] = ["SL09", "SL10", "SL11"];
export const RESOURCE_LOST_CODES: readonly PublicErrorCode[] = ["SL12", "SL13"];
