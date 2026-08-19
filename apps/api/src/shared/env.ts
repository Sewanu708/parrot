import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
import { config } from "dotenv";
import { resolve } from "path";

const envFile = process.env.NODE_ENV === "test" ? ".env.test" : ".env";

// Load from apps/api/.env if present
config({ path: resolve(__dirname, `../../${envFile}`) });

// Load from root .env if present (4 levels up from apps/api/src/shared)
config({ path: resolve(__dirname, `../../../../${envFile}`) });

export const env = createEnv({
  server: {
    REDIS_URL: z.string().startsWith("redis://"),
    ENCRYPTION_KEY: z.string().min(10),
    RESEND_KEY: z.string().startsWith("re_"),
    FRONTEND_URL: z.string().url(),
    PORT: z.string().optional().default("8080"),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    DEFAULT_FROM_EMAIL: z
      .email()
      .optional()
      .default("Parrot <noreply@yourdomain.com>"),
    WIDGET_CDN_URL: z
      .string()
      .url()
      .optional()
      .default("http://localhost:5173"),
  },

  runtimeEnv: process.env,

  emptyStringAsUndefined: true,
  skipValidation: process.env.NODE_ENV === "test",
});
