import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
import { config } from "dotenv";
import { resolve } from "path";

config({
  path: resolve(
    __dirname,
    `../../../${process.env.NODE_ENV === "test" ? ".env.test" : ".env"}`,
  ),
});

export const env = createEnv({
  server: {
    DATABASE_URL: z.url().startsWith("postgresql://"),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },

  runtimeEnv: process.env,

  emptyStringAsUndefined: true,
  skipValidation: process.env.NODE_ENV === "test",
});
