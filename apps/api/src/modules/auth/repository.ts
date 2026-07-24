import { db } from "@parrot/db/src/config";
import {
  users,
  accounts,
  sessions,
  tenants,
  tenantMembers,
  roles,
} from "@parrot/db/src/schema";
import { eq, and, isNotNull, desc } from "drizzle-orm";
import { appError } from "../../express/errors";
import { ERROR_CODE } from "../../express/constant";

export class AuthRepository {
  static async getUserByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  static async createUserWithCredentials(
    name: string,
    email: string,
    passwordHash: string,
  ) {
    return db.transaction(async (tx) => {
      // 1. Create User
      const [newUser] = await tx
        .insert(users)
        .values({ name, email, emailVerified: false })
        .returning();

      // 2. Create Account (link password to user)
      await tx.insert(accounts).values({
        userId: newUser.id,
        provider: "credentials",
        passwordHash,
      });

      return newUser;
    });
  }

  static async verifyUserEmail(email: string) {
    const [user] = await db
      .update(users)
      .set({ emailVerified: true })
      .where(eq(users.email, email))
      .returning();
    return user;
  }

  static async getUserWithPassword(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) return null;

    const [account] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, user.id));

    return { user, account };
  }

  static async createSession(
    userId: string,
    token: string,
    expiresAt: Date,
    ipAddress?: string,
    userAgent?: string,
    activeTenantId?: string | null,
  ) {
    const [session] = await db
      .insert(sessions)
      .values({
        userId,
        token,
        expiresAt,
        ipAddress,
        userAgent,
        activeTenantId,
      })
      .returning();
    return session;
  }

  static async updateActiveSession(token: string, activeTenantId: string) {
    const [latestSession] = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(eq(sessions.token, token));

    if (!latestSession) {
      appError("Unauthorized", ERROR_CODE.NOAUTHERR, { code: "SL07" });
    }

    await db
      .update(sessions)
      .set({ activeTenantId })
      .where(eq(sessions.id, latestSession.id));
  }

  static async getUserTenants(userId: string) {
    return db
      .select({
        id: tenants.id,
        name: tenants.name,
        domain: tenants.domain,
        role: roles.name,
      })
      .from(tenantMembers)
      .innerJoin(tenants, eq(tenantMembers.tenantId, tenants.id))
      .innerJoin(roles, eq(tenantMembers.roleId, roles.id))
      .where(eq(tenantMembers.userId, userId));
  }

  static async getLastActiveTenantId(userId: string) {
    const [session] = await db
      .select({ activeTenantId: sessions.activeTenantId })
      .from(sessions)
      .where(
        and(eq(sessions.userId, userId), isNotNull(sessions.activeTenantId)),
      )
      .orderBy(desc(sessions.createdAt))
      .limit(1);
    return session?.activeTenantId || null;
  }

  static async updatePassword(userId: string, passwordHash: string) {
    const [account] = await db
      .update(accounts)
      .set({ passwordHash })
      .where(eq(accounts.userId, userId))
      .returning();
    return account;
  }
}
