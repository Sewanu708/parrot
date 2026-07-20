import request from "supertest";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { server } from "../../../index";
import { db } from "@parrot/db/src/config";
import { users, accounts } from "@parrot/db/src/schema";
import { eq } from "drizzle-orm";
import { AuthRepository } from "../repository";
import { hashPassword, encryptText, generateRandomStr } from "../../../shared/utils/encryption";
import { ONE_DAY } from "../../../shared/constant";
import { getRedisInstance } from "../../../shared/redis";

const app = server.getApp();
const redisClient = getRedisInstance()

vi.mock("../../../notification/email.service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../notification/email.service")>();
  return {
    ...actual,
    EmailService: {
      ...actual.EmailService,
      sendEmail: vi.fn().mockResolvedValue(undefined),
    },
  };
});

describe("Auth Integration Tests", () => {
  describe("POST /auth/signup", () => {
    it("should create a new user and return 201", async () => {
      const payload = {
        name: "Test User",
        email: "testuser@example.com",
        password: "StrongPassword123!",
      };

      const res = await request(app).post("/auth/signup").send(payload).expect(201);

      expect(res.body.status).toBe("success");
      expect(res.body.data).toHaveProperty("userId");

      const [dbUser] = await db.select().from(users).where(eq(users.email, payload.email));
      expect(dbUser).toBeDefined();
      expect(dbUser.emailVerified).toBe(false);
    });

    it("should return an error if the email is already in use", async () => {
      const payload = {
        name: "Test User 2",
        email: "duplicate@example.com",
        password: "StrongPassword123!",
      };

      await request(app).post("/auth/signup").send(payload).expect(201);

      const res = await request(app).post("/auth/signup").send(payload).expect(401);
      expect(res.body.errors.code).toBe("AUTHORIZATION_ERROR");
      expect(res.body.errors.publicCode).toBe("SL02");
    });

    it("should return validation error if required fields are missing", async () => {
      const payload = { email: "no-name@example.com" }; // missing password and name

      const res = await request(app).post("/auth/signup").send(payload).expect(400);
      expect(res.body.status).toBe("error");
    });
  });

  describe("GET /auth/verify-email", () => {
    it("should return error if token is missing", async () => {
      const res = await request(app).get("/auth/verify-email").expect(400);
      expect(res.body.errors.message).toBe("Verification token is missing.");
    });

    it("should return error if token is expired", async () => {
      const email = "expired@example.com";
      const expiresAt = Date.now() - ONE_DAY; // Expired yesterday
      const rawToken = `${generateRandomStr(4)}::${email}::${generateRandomStr(4)}::${expiresAt}`;
      const token = encryptText(rawToken);

      const res = await request(app).get(`/auth/verify-email?token=${token}`).expect(400);
      expect(res.body.errors.publicCode).toBe("SL04");
    });

    it("should return error if user not found", async () => {
      const email = "ghost@example.com";
      const expiresAt = Date.now() + ONE_DAY;
      const rawToken = `${generateRandomStr(4)}::${email}::${generateRandomStr(4)}::${expiresAt}`;
      const token = encryptText(rawToken);

      const res = await request(app).get(`/auth/verify-email?token=${token}`).expect(400);
      expect(res.body.errors.publicCode).toBe("SL05");
    });

    it("should successfully verify a user and allow idempotency", async () => {
      const payload = {
        name: "Verify Me",
        email: "verifyme@example.com",
        password: "Password123!",
      };
      await request(app).post("/auth/signup").send(payload).expect(201);

      const expiresAt = Date.now() + ONE_DAY;
      const rawToken = `${generateRandomStr(4)}::${payload.email}::${generateRandomStr(4)}::${expiresAt}`;
      const token = encryptText(rawToken);

      // First verification succeeds
      const res = await request(app).get(`/auth/verify-email?token=${token}`).expect(200);
      expect(res.body.message).toBe("Email verified successfully.");

      const [dbUser] = await db.select().from(users).where(eq(users.email, payload.email));
      expect(dbUser.emailVerified).toBe(true);

      // Second verification on same token should immediately return 200 (idempotent)
      const res2 = await request(app).get(`/auth/verify-email?token=${token}`).expect(200);
      expect(res2.body.message).toBe("Email is already verified.");
    });
  });

  describe("POST /auth/login", () => {
    beforeEach(async () => {
      // Seed a verified user and an unverified user
      const hashedPass = await hashPassword("ValidPass123");
      const unverified = await AuthRepository.createUserWithCredentials("Unverified", "unverified@example.com", hashedPass);
      const verified = await AuthRepository.createUserWithCredentials("Verified", "verified@example.com", hashedPass);
      await AuthRepository.verifyUserEmail(verified.email);
    });

    it("should return error for invalid email", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({ email: "wrong@example.com", password: "ValidPass123" })
        .expect(401);
      expect(res.body.errors.publicCode).toBe("SL03"); // Invalid credentials
    });

    it("should return error for invalid password", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({ email: "verified@example.com", password: "WrongPassword" })
        .expect(401);
      expect(res.body.errors.publicCode).toBe("SL03");
    });

    it("should return error if email is not verified", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({ email: "unverified@example.com", password: "ValidPass123" })
        .expect(401);
      expect(res.body.errors.message).toBe("Please verify your email before logging in");
    });

    it("should login successfully and return session token, user, and tenants", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({ email: "verified@example.com", password: "ValidPass123" })
        .expect(200);

      expect(res.body.status).toBe("success");
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe("verified@example.com");
      expect(Array.isArray(res.body.data.tenants)).toBe(true);
      expect(res.body.data).toHaveProperty("lastActiveTenantId");
    });
  });

  describe("POST /auth/resend-verification", () => {
    it("should successfully send verification email if unverified", async () => {
      const payload = { name: "Resend", email: "resend@example.com", password: "Password123!" };
      await request(app).post("/auth/signup").send(payload).expect(201);

      const res = await request(app).post("/auth/resend-verification").send({ email: payload.email }).expect(200);
      expect(res.body.message).toBe("Verification email sent.");
    });

    it("should return error if already verified (SL01)", async () => {
      const hashedPass = await hashPassword("ValidPass123");
      const verified = await AuthRepository.createUserWithCredentials("Verified", "already@example.com", hashedPass);
      await AuthRepository.verifyUserEmail(verified.email);

      const res = await request(app).post("/auth/resend-verification").send({ email: "already@example.com" }).expect(400);
      expect(res.body.errors.publicCode).toBe("SL01");
    });

    it("should return success message even if user does not exist (prevent enumeration)", async () => {
      const res = await request(app).post("/auth/resend-verification").send({ email: "ghost2@example.com" }).expect(200);
      expect(res.body.message).toContain("If your email is registered");
    });
  });

  describe("POST /auth/forgot-password", () => {
    it("should return success message even if user does not exist (prevent enumeration)", async () => {
      const res = await request(app).post("/auth/forgot-password").send({ email: "ghost3@example.com" }).expect(200);
      expect(res.body.message).toContain("If your email is registered");
    });

    it("should generate a reset code in redis for a valid user", async () => {
      const hashedPass = await hashPassword("ValidPass123");
      await AuthRepository.createUserWithCredentials("Forgot", "forgot@example.com", hashedPass);

      const res = await request(app).post("/auth/forgot-password").send({ email: "forgot@example.com" }).expect(200);
      expect(res.body.message).toBe("Password reset email sent.");

      // Verify the code exists in redis
      const keys = await redisClient.redis.keys("reset_password:*");
      expect(keys.length).toBe(1);
      const email = await redisClient.redis.get(keys[0]);
      expect(email).toBe("forgot@example.com");
    });
  });

  describe("POST /auth/reset-password", () => {
    it("should return error for invalid or expired reset code", async () => {
      const res = await request(app)
        .post("/auth/reset-password")
        .send({ token: "invalid-code", password: "NewPassword123!" })
        .expect(400);
      expect(res.body.errors.publicCode).toBe("SL01");
    });

    it("should successfully reset password and consume the token", async () => {
      const hashedPass = await hashPassword("ValidPass123");
      const user = await AuthRepository.createUserWithCredentials("Reset", "reset@example.com", hashedPass);

      // Force a token into redis
      await redisClient.redis.set("reset_password:123456", "reset@example.com");

      const res = await request(app)
        .post("/auth/reset-password")
        .send({ token: "123456", password: "BrandNewPassword123!" })
        .expect(200);

      expect(res.body.message).toBe("Password has been successfully reset.");

      // Ensure the token was consumed
      const val = await redisClient.get("reset_password:123456");
      expect(val).toBeNull();

      // Ensure we can login with the NEW password
      await request(app)
        .post("/auth/login")
        .send({ email: "reset@example.com", password: "BrandNewPassword123!" })
        .expect(401); // We didn't verify email, but we should get "Please verify your email" instead of SL03 (Invalid credentials)
      
      const loginAttempt = await request(app).post("/auth/login").send({ email: "reset@example.com", password: "BrandNewPassword123!" });
      expect(loginAttempt.body.errors.message).toBe("Please verify your email before logging in");
    });
  });
});
