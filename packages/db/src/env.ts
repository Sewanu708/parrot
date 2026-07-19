import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../../../.env") });

export const env = createEnv({
  server: {
    DATABASE_URL: z.url().startsWith("postgresql://"),
    REDIS_URL: z.url().startsWith("redis://"),
    ENCRYPTION_KEY: z.string().min(10),
    RESEND_KEY: z.string().startsWith("re_"),
    FRONTEND_URL: z.url(),
    PORT: z.string().optional().default("8080"),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    DEFAULT_FROM_EMAIL: z.email().optional().default("Parrot <noreply@yourdomain.com>")
  },
  
  runtimeEnv: process.env,
  
  emptyStringAsUndefined: true,
});
