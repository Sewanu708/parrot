import { describe, it, expect, beforeEach, afterEach } from "vitest";
import requestPermission from "./permissions";
import { AppError } from "../../express/errors";
import type { RequestComponents } from "../../express/types";
import { db } from "@parrot/db/src/config";
import {
  users,
  tenants,
  tenantMembers,
  roles,
  permissions,
  rolePermissions,
} from "@parrot/db/src/schema";
import { eq } from "drizzle-orm";
import { ERROR_CODE } from "../../express/constant";

describe("requestPermission Middleware", () => {
  let testUserId: string;
  let testTenantId: string;
  let testRoleId: string;
  let testPermissionId: string;
  let testMemberId: string;

  beforeEach(async () => {
    // 1. Create a User
    const [user] = await db
      .insert(users)
      .values({
        name: "Permission Test User",
        email: `permtest_${Date.now()}@example.com`,
      })
      .returning();
    testUserId = user.id;

    // 2. Create a Tenant
    const [tenant] = await db
      .insert(tenants)
      .values({
        name: "Permission Test Tenant",
      })
      .returning();
    testTenantId = tenant.id;

    // 3. Create a Role
    const [role] = await db
      .insert(roles)
      .values({
        tenantId: testTenantId,
        name: "Test Role",
      })
      .returning();
    testRoleId = role.id;

    // 4. Create a Permission
    const [perm] = await db
      .insert(permissions)
      .values({
        name: "test:action",
        description: "A test permission",
      })
      .onConflictDoUpdate({
        target: permissions.name,
        set: { description: "A test permission" },
      })
      .returning();
    testPermissionId = perm.id;

    // 5. Map the Permission to the Role
    await db
      .insert(rolePermissions)
      .values({
        roleId: testRoleId,
        permissionId: testPermissionId,
      })
      .onConflictDoNothing();

    // 6. Create the Tenant Member
    const [member] = await db
      .insert(tenantMembers)
      .values({
        tenantId: testTenantId,
        userId: testUserId,
        roleId: testRoleId,
      })
      .returning();
    testMemberId = member.id;
  });

  afterEach(async () => {
    // Cleanup
    await db.delete(tenantMembers).where(eq(tenantMembers.id, testMemberId));
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, testRoleId));
    await db.delete(permissions).where(eq(permissions.id, testPermissionId));
    await db.delete(roles).where(eq(roles.id, testRoleId));
    await db.delete(tenants).where(eq(tenants.id, testTenantId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  function makeRequest(memberObj?: any): RequestComponents {
    return {
      body: {},
      query: {},
      params: {},
      headers: {},
      meta: {
        member: memberObj,
      },
      props: {},
      properties: {
        IP: "1.2.3.4",
        baseURL: "/",
        method: "get",
        requestURL: "/test",
        requestURLWithoutQueryStrings: "/test",
        handlerPath: "/test",
        hostname: "localhost",
        userAgent: "test",
      },
    };
  }

  it("should throw an error if member is missing from request meta", async () => {
    const req = makeRequest(undefined);
    const middleware = requestPermission("test:action" as any);

    try {
      await middleware.handler(req, {});
      expect.fail("Expected AppError to be thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).errorCode).toBe(ERROR_CODE.PERMERR);
      expect((err as AppError).message).toContain("You must be assigned a role");
    }
  });

  it("should throw an error if the requested permission does not exist in the database", async () => {
    const req = makeRequest({ roleId: testRoleId });
    const middleware = requestPermission("fake:permission" as any);

    try {
      await middleware.handler(req, {});
      expect.fail("Expected AppError to be thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).errorCode).toBe(ERROR_CODE.PERMERR);
      expect((err as AppError).message).toContain("is not registered");
    }
  });

  it("should throw an error if the member's role does not have the permission", async () => {
    // Create another permission but DO NOT map it to the role
    const [unmappedPerm] = await db
      .insert(permissions)
      .values({ name: "unmapped:action" })
      .onConflictDoUpdate({
        target: permissions.name,
        set: { description: "" },
      })
      .returning();

    const req = makeRequest({ roleId: testRoleId });
    const middleware = requestPermission("unmapped:action" as any);

    try {
      await middleware.handler(req, {});
      expect.fail("Expected AppError to be thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).errorCode).toBe(ERROR_CODE.PERMERR);
      expect((err as AppError).message).toContain("You do not have the required permissions");
    } finally {
      await db.delete(permissions).where(eq(permissions.id, unmappedPerm.id));
    }
  });

  it("should allow the request if the member has the required permission", async () => {
    const req = makeRequest({ roleId: testRoleId });
    const middleware = requestPermission("test:action" as any);

    const result = await middleware.handler(req, {});
    
    // The middleware should return an empty object {} to pass through
    expect(result).toEqual({});
  });
});
