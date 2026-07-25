import { describe, it, expect, beforeEach } from "vitest";
import { unauthenticatedLimiter, authenticatedLimiter } from "./limiter";
import { AppError } from "../../express/errors";
import type { RequestComponents } from "../../express/types";
import { getRedisInstance } from "../redis";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a minimal RequestComponents for a given IP and optional user.
 * x-forwarded-for is set so request-ip can extract a real IP from headers.
 */
function makeRequest(
  ip = "1.2.3.4",
  meta: Record<string, any> = {},
): RequestComponents {
  return {
    body: {},
    query: {},
    params: {},
    headers: { "x-forwarded-for": ip },
    meta,
    props: {},
    properties: {
      IP: ip,
      baseURL: "/",
      method: "get",
      requestURL: "/test",
      requestURLWithoutQueryStrings: "/test",
      handlerPath: "/test",
      hostname: "localhost",
      userAgent: "test-agent",
    },
  };
}

/**
 * Exhaust the unauthenticated limiter for a given IP by sending `n` requests.
 * Returns the array of HandlerResults so callers can inspect headers if needed.
 */
async function drainUnauthLimit(ip: string, n: number) {
  const req = makeRequest(ip);
  const results = [];
  for (let i = 0; i < n; i++) {
    results.push(await unauthenticatedLimiter.handler(req, {}));
  }
  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared Redis flush between tests (module-level singleton state lives in Redis)
// ─────────────────────────────────────────────────────────────────────────────

beforeEach(async () => {
  await getRedisInstance().redis.flushdb();
});

// ─────────────────────────────────────────────────────────────────────────────
// unauthenticatedLimiter  (15 req / 60 s window, keyed by IP)
// ─────────────────────────────────────────────────────────────────────────────

describe("unauthenticatedLimiter", () => {
  describe("response headers – allowed requests", () => {
    it("includes X-RateLimit-Limit on every allowed request", async () => {
      const result = await unauthenticatedLimiter.handler(makeRequest(), {});
      const headers = result.augments?.headers as Record<string, unknown>;

      expect(headers["X-RateLimit-Limit"]).toBe(15);
    });

    it("includes X-RateLimit-Remaining on every allowed request", async () => {
      const result = await unauthenticatedLimiter.handler(makeRequest(), {});
      const headers = result.augments?.headers as Record<string, unknown>;

      expect(typeof headers["X-RateLimit-Remaining"]).toBe("number");
      expect(headers["X-RateLimit-Remaining"]).toBeGreaterThanOrEqual(0);
    });

    it("does NOT include Retry-After when the request is allowed", async () => {
      const result = await unauthenticatedLimiter.handler(makeRequest(), {});
      const headers = result.augments?.headers as Record<string, unknown>;

      expect(headers["Retry-After"]).toBeUndefined();
    });

    it("does NOT include X-RateLimit-Reset when the request is allowed", async () => {
      const result = await unauthenticatedLimiter.handler(makeRequest(), {});
      const headers = result.augments?.headers as Record<string, unknown>;

      expect(headers["X-RateLimit-Reset"]).toBeUndefined();
    });

    it("X-RateLimit-Remaining decreases with each subsequent request", async () => {
      const ip = "10.0.0.1";
      const r1 = await unauthenticatedLimiter.handler(makeRequest(ip), {});
      const r2 = await unauthenticatedLimiter.handler(makeRequest(ip), {});

      const h1 = r1.augments?.headers as Record<string, number>;
      const h2 = r2.augments?.headers as Record<string, number>;

      expect(h2["X-RateLimit-Remaining"]).toBeLessThan(h1["X-RateLimit-Remaining"]);
    });
  });

  describe("rate limiting – blocked requests", () => {
    it("throws an AppError after the limit is exhausted", async () => {
      const ip = "10.0.0.2";
      await drainUnauthLimit(ip, 15); // exhaust all 15 slots

      await expect(
        unauthenticatedLimiter.handler(makeRequest(ip), {}),
      ).rejects.toThrow(AppError);
    });

    it("throws with the correct HTTP status (429)", async () => {
      const ip = "10.0.0.3";
      await drainUnauthLimit(ip, 15);

      try {
        await unauthenticatedLimiter.handler(makeRequest(ip), {});
        expect.fail("Expected AppError to be thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).httpStatus).toBe(429);
      }
    });

    it("includes Retry-After in the error context when blocked", async () => {
      const ip = "10.0.0.4";
      await drainUnauthLimit(ip, 15);

      try {
        await unauthenticatedLimiter.handler(makeRequest(ip), {});
        expect.fail("Expected AppError to be thrown");
      } catch (err) {
        const headers = (err as AppError).context?.headers as Record<
          string,
          unknown
        >;
        expect(headers["Retry-After"]).toBeDefined();
      }
    });

    it("includes X-RateLimit-Reset in the error context when blocked", async () => {
      const ip = "10.0.0.5";
      await drainUnauthLimit(ip, 15);

      try {
        await unauthenticatedLimiter.handler(makeRequest(ip), {});
        expect.fail("Expected AppError to be thrown");
      } catch (err) {
        const headers = (err as AppError).context?.headers as Record<
          string,
          unknown
        >;
        expect(headers["X-RateLimit-Reset"]).toBeDefined();
      }
    });

    it("X-RateLimit-Reset in error context is a Unix timestamp in the future", async () => {
      const ip = "10.0.0.6";
      await drainUnauthLimit(ip, 15);

      const nowSecs = Math.floor(Date.now() / 1000);
      try {
        await unauthenticatedLimiter.handler(makeRequest(ip), {});
        expect.fail("Expected AppError to be thrown");
      } catch (err) {
        const headers = (err as AppError).context?.headers as Record<
          string,
          number
        >;
        expect(headers["X-RateLimit-Reset"]).toBeGreaterThan(nowSecs);
      }
    });

    it("different IPs are rate-limited independently", async () => {
      // Exhaust limit for IP A
      await drainUnauthLimit("20.0.0.1", 15);

      // IP B should still be allowed
      const result = await unauthenticatedLimiter.handler(
        makeRequest("20.0.0.2"),
        {},
      );
      const headers = result.augments?.headers as Record<string, unknown>;
      expect(headers["X-RateLimit-Limit"]).toBe(15);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// authenticatedLimiter  (100 req / 60 s window, keyed by userId)
// ─────────────────────────────────────────────────────────────────────────────

describe("authenticatedLimiter", () => {
  describe("missing user", () => {
    it("throws an AppError when userId is absent from meta", async () => {
      await expect(
        authenticatedLimiter.handler(makeRequest("1.2.3.4", {}), {}),
      ).rejects.toThrow(AppError);
    });

    it("throws with status 401 when userId is missing", async () => {
      try {
        await authenticatedLimiter.handler(makeRequest("1.2.3.4", {}), {});
        expect.fail("Expected AppError");
      } catch (err) {
        expect((err as AppError).httpStatus).toBe(401);
      }
    });
  });

  describe("response headers – allowed requests", () => {
    it("includes X-RateLimit-Limit: 100 for authenticated requests", async () => {
      const req = makeRequest("1.2.3.4", { user: { id: "user-abc" } });
      const result = await authenticatedLimiter.handler(req, {});
      const headers = result.headers as Record<string, unknown>;

      expect(headers["X-RateLimit-Limit"]).toBe(100);
    });

    it("includes X-RateLimit-Remaining on allowed requests", async () => {
      const req = makeRequest("1.2.3.4", { user: { id: "user-def" } });
      const result = await authenticatedLimiter.handler(req, {});
      const headers = result.headers as Record<string, unknown>;

      expect(typeof headers["X-RateLimit-Remaining"]).toBe("number");
      expect(headers["X-RateLimit-Remaining"]).toBeGreaterThanOrEqual(0);
    });

    it("does NOT include Retry-After when the request is allowed", async () => {
      const req = makeRequest("1.2.3.4", { user: { id: "user-ghi" } });
      const result = await authenticatedLimiter.handler(req, {});
      const headers = result.headers as Record<string, unknown>;

      expect(headers["Retry-After"]).toBeUndefined();
    });

    it("X-RateLimit-Remaining decreases with each subsequent request", async () => {
      const userId = "user-counter";
      const r1 = await authenticatedLimiter.handler(
        makeRequest("1.2.3.4", { user: { id: userId } }),
        {},
      );
      const r2 = await authenticatedLimiter.handler(
        makeRequest("1.2.3.4", { user: { id: userId } }),
        {},
      );

      const h1 = r1.headers as Record<string, number>;
      const h2 = r2.headers as Record<string, number>;

      expect(h2["X-RateLimit-Remaining"]).toBeLessThan(h1["X-RateLimit-Remaining"]);
    });

    it("different userIds are rate-limited independently", async () => {
      const reqA = makeRequest("1.2.3.4", { user: { id: "user-A" } });
      const reqB = makeRequest("1.2.3.4", { user: { id: "user-B" } });

      // Both should get a full limit
      const rA = await authenticatedLimiter.handler(reqA, {});
      const rB = await authenticatedLimiter.handler(reqB, {});

      const hA = rA.headers as Record<string, number>;
      const hB = rB.headers as Record<string, number>;

      // Each starts with the same remaining count (full 100 - 1 = 99)
      expect(hA["X-RateLimit-Remaining"]).toBe(hB["X-RateLimit-Remaining"]);
    });
  });
});
