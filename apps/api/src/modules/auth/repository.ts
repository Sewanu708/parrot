import { db } from "@parrot/db/src/config";
import { users, accounts, sessions } from "@parrot/db/src/schema";
import { eq } from "drizzle-orm";

export class AuthRepository {
  static async getUserByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  static async createUserWithCredentials(
    name: string,
    email: string,
    passwordHash: string
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
    userAgent?: string
  ) {
    const [session] = await db
      .insert(sessions)
      .values({
        userId,
        token,
        expiresAt,
        ipAddress,
        userAgent,
      })
      .returning();
    return session;
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
