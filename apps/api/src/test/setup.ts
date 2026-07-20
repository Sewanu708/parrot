import { db } from "@parrot/db/src/config";
import {
  users,
  tenants,
  sessions,
  accounts,
  tenantMembers,
} from "@parrot/db/src/schema";
import { getRedisInstance } from "../shared/redis";
import "dotenv/config";

import { execSync } from "child_process";
import { sql } from "drizzle-orm";

// Setup global test environment
beforeAll(async () => {
  // Ensure we are strictly connecting to the test database
  if (!process.env.DATABASE_URL) {
    throw new Error("CRITICAL: Tests must run against the parrot_test database to prevent data loss!");
  }


  // 2. Push the schema to the pristine database
  console.log("Pushing schema to test database...");
  execSync("pnpm --filter @parrot/db push", { 
    stdio: "inherit",
    env: {
      ...process.env,
      // Force it to use the test database URL just in case dotenv tries to override it
      DATABASE_URL: process.env.DATABASE_URL
    }
  });
});

// Delete rows via Drizzle ORM to avoid raw SQL in tests (Option B)
beforeEach(async () => {
  await db.delete(tenantMembers);
  await db.delete(sessions);
  await db.delete(accounts);
  await db.delete(users);
  await db.delete(tenants);

  await getRedisInstance().redis.flushdb();
});

afterAll(async () => {
  await getRedisInstance().destroy();
});
