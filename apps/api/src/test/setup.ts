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
import { migrate } from "drizzle-orm/node-postgres/migrator";

// Setup global test environment
beforeAll(async () => {
  // Ensure we are strictly connecting to the test database
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "CRITICAL: Tests must run against the parrot_test database to prevent data loss!",
    );
  }
  await migrate(db, {
    migrationsFolder: "../../packages/db/drizzle",
  });
});

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
