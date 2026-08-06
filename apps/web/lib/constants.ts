export const ROUTES = {
  HOME: "/",
  AUTH: {
    LOGIN: "/auth/login",
    SIGNUP: "/auth/signup",
  },
  ONBOARDING: {
    WORKSPACE: "/create-workspace",
  },
  DASHBOARD: {
    ROOT: "/dashboard",
    INBOX: "/dashboard/inbox",
    CONTACTS: "/dashboard/contacts",
    AUTOMATIONS: "/dashboard/automations",
    SETTINGS: {
      ROOT: "/dashboard/settings",
      CHANNELS: "/dashboard/settings/channels",
    },
  },
} as const;

export const UI_CONSTANTS = {
  MAX_UPLOAD_SIZE_MB: 5,
  TYPING_TIMEOUT_MS: 2000,
  TOAST_DURATION_MS: 5000,
} as const;

export const THEME = {
  COLORS: {
    PRIMARY: "#37352f",
    BRAND_DEFAULT: "#4f46e5",
  },
} as const;

export const SETTINGS_NAV_ITEMS = [
  { name: "Workspace", tab: "workspace" },
  { name: "Properties", tab: "properties" },
  { name: "Canned Responses", tab: "canned_responses" },
] as const;
