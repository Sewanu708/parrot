import { describe, it, expect, vi, afterEach } from "vitest";
import { RateLimiter, Throttle } from "./throttle";
import type { RedisService } from "../redis";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Build a minimal RedisService mock. Override individual methods as needed. */
function makeRedis(
  overrides: Partial<Pick<RedisService, "hgetall" | "hincrby" | "expire">> = {},
): RedisService {
  return {
    hgetall: vi.fn().mockResolvedValue(null),
    hincrby: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
    ...overrides,
  } as unknown as RedisService;
}

/** Compute the hash field key RateLimiter uses for the *current* minute. */
function currentWindowKey(id: string): string {
  const now = new Date();
  return `${id}${now.toDateString()}:${now.getHours()}:${now.getMinutes()}`;
}

/** Compute the hash field key RateLimiter uses for the *previous* minute. */
function prevWindowKey(id: string): string {
  const now = new Date();
  const currentMinute = now.getMinutes();
  const currentHour = now.getHours();
  const prevMinute = currentMinute === 0 ? 59 : currentMinute - 1;
  const prevHour = currentMinute === 0 ? currentHour - 1 : currentHour;
  return `${id}${now.toDateString()}:${prevHour}:${prevMinute}`;
}

/** Build a primary RateLimiter that always rejects (simulates Redis down). */
function makeFailingPrimary(): RateLimiter {
  return {
    allowRequest: vi.fn().mockRejectedValue(new Error("Redis unavailable")),
  } as unknown as RateLimiter;
}

// ─────────────────────────────────────────────────────────────────────────────
// RateLimiter
// ─────────────────────────────────────────────────────────────────────────────

describe("RateLimiter", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("allowRequest – allowed path", () => {
    it("allows a request when there is no prior traffic", async () => {
      const redis = makeRedis(); // hgetall returns null → zero counts
      const rl = new RateLimiter(redis, 60, 15);

      const result = await rl.allowRequest("user1", 1);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(15);
      expect(result.remaining).toBeGreaterThanOrEqual(13);
    });

    it("increments the Redis counter when the request is allowed", async () => {
      const redis = makeRedis();
      const rl = new RateLimiter(redis, 60, 15);

      await rl.allowRequest("user1", 1);

      expect(redis.hincrby).toHaveBeenCalledOnce();
      expect(redis.expire).toHaveBeenCalledOnce();
    });

    it("does not set retryAfter or resetAt on an allowed response", async () => {
      const redis = makeRedis();
      const rl = new RateLimiter(redis, 60, 15);

      const result = await rl.allowRequest("user1", 1);

      expect(result.retryAfter).toBeUndefined();
      expect(result.resetAt).toBeUndefined();
    });

    it("remaining decreases as prior requests accumulate", async () => {
      const redis = makeRedis({
        hgetall: vi.fn().mockResolvedValue({
          [currentWindowKey("user1")]: "10",
        }),
      });
      const rl = new RateLimiter(redis, 60, 15);

      const result = await rl.allowRequest("user1", 1);

      // 5 requests remain in the effective window
      expect(result.remaining).toBeLessThan(15);
      expect(result.remaining).toBeGreaterThanOrEqual(3);
    });
  });

  describe("allowRequest – blocked path", () => {
    it("blocks when current-window count equals the limit", async () => {
      const redis = makeRedis({
        hgetall: vi.fn().mockResolvedValue({
          [currentWindowKey("user1")]: "15",
        }),
      });
      const rl = new RateLimiter(redis, 60, 15);

      const result = await rl.allowRequest("user1", 1);

      expect(result.allowed).toBe(false);
    });

    it("blocks when current-window count exceeds the limit", async () => {
      const redis = makeRedis({
        hgetall: vi.fn().mockResolvedValue({
          [currentWindowKey("user1")]: "30",
        }),
      });
      const rl = new RateLimiter(redis, 60, 15);

      const result = await rl.allowRequest("user1", 1);

      expect(result.allowed).toBe(false);
    });

    it("does NOT increment Redis when blocked", async () => {
      const redis = makeRedis({
        hgetall: vi.fn().mockResolvedValue({
          [currentWindowKey("user1")]: "15",
        }),
      });
      const rl = new RateLimiter(redis, 60, 15);

      await rl.allowRequest("user1", 1);

      expect(redis.hincrby).not.toHaveBeenCalled();
    });

    it("remaining is always >= 0 even far over the limit", async () => {
      const redis = makeRedis({
        hgetall: vi.fn().mockResolvedValue({
          [currentWindowKey("user1")]: "999",
        }),
      });
      const rl = new RateLimiter(redis, 60, 15);

      const result = await rl.allowRequest("user1", 1);

      expect(result.remaining).toBeGreaterThanOrEqual(0);
    });

    it("sets retryAfter and resetAt only when blocked", async () => {
      const redis = makeRedis({
        hgetall: vi.fn().mockResolvedValue({
          [currentWindowKey("user1")]: "15",
        }),
      });
      const rl = new RateLimiter(redis, 60, 15);

      const result = await rl.allowRequest("user1", 1);

      expect(result.retryAfter).toBeDefined();
      expect(result.resetAt).toBeDefined();
    });

    it("resetAt is a Unix timestamp (seconds) in the future", async () => {
      const redis = makeRedis({
        hgetall: vi.fn().mockResolvedValue({
          [currentWindowKey("user1")]: "15",
        }),
      });
      const rl = new RateLimiter(redis, 60, 15);
      const nowSecs = Math.floor(Date.now() / 1000);

      const result = await rl.allowRequest("user1", 1);

      // Should be greater than now and within the next 2 minutes
      expect(result.resetAt).toBeGreaterThan(nowSecs);
      expect(result.resetAt).toBeLessThan(nowSecs + 120);
    });
  });

  describe("allowRequest – sliding window", () => {
    it("reduces effective count using the previous window overlap", async () => {
      // At t=30s into the current minute: overlap = 1 - 30/60 = 0.5
      // prev=10 * 0.5 = 5 effective; current=0 → total=5 < limit(15) → allowed
      vi.useFakeTimers();
      vi.setSystemTime(new Date(new Date().setSeconds(30)));

      const redis = makeRedis({
        hgetall: vi.fn().mockResolvedValue({
          [prevWindowKey("user1")]: "10",
        }),
      });
      const rl = new RateLimiter(redis, 60, 15);

      const result = await rl.allowRequest("user1", 1);

      expect(result.allowed).toBe(true);
    });

    it("blocks when previous window weighted count exceeds the limit", async () => {
      // At t=0s: overlap = 1 - 0/60 = 1.0
      // prev=30 * 1.0 = 30 effective; current=0 → total=30 ≥ limit(15) → blocked
      vi.useFakeTimers();
      vi.setSystemTime(new Date(new Date().setSeconds(0)));

      const redis = makeRedis({
        hgetall: vi.fn().mockResolvedValue({
          [prevWindowKey("user1")]: "30",
        }),
      });
      const rl = new RateLimiter(redis, 60, 15);

      const result = await rl.allowRequest("user1", 1);

      expect(result.allowed).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Throttle
// ─────────────────────────────────────────────────────────────────────────────

describe("Throttle", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("consume – primary (Redis) path", () => {
    it("delegates to the primary RateLimiter on success", async () => {
      const mockAllowRequest = vi.fn().mockResolvedValue({
        allowed: true,
        limit: 15,
        remaining: 14,
      });
      const mockPrimary = {
        allowRequest: mockAllowRequest,
      } as unknown as RateLimiter;
      const throttle = new Throttle(mockPrimary, 60, 15);

      const result = await throttle.consume("key", 1);

      expect(mockAllowRequest).toHaveBeenCalledWith("key", 1);
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(15);
    });

    it("passes the cost argument to the primary", async () => {
      const mockAllowRequest = vi.fn().mockResolvedValue({
        allowed: true,
        limit: 15,
        remaining: 13,
      });
      const throttle = new Throttle(
        { allowRequest: mockAllowRequest } as unknown as RateLimiter,
        60,
        15,
      );

      await throttle.consume("key", 2);

      expect(mockAllowRequest).toHaveBeenCalledWith("key", 2);
    });
  });

  describe("consume – local fallback (Redis down)", () => {
    it("falls back to local counting when the primary throws", async () => {
      const throttle = new Throttle(makeFailingPrimary(), 60, 10);

      const result = await throttle.consume("key", 1);

      expect(result).toBeDefined();
      expect(typeof result.allowed).toBe("boolean");
    });

    it("local limit is half the configured limit (2-node assumption)", async () => {
      const throttle = new Throttle(makeFailingPrimary(), 60, 10);

      const result = await throttle.consume("key", 1);

      // Math.floor(10 / 2) = 5
      expect(result.limit).toBe(5);
    });

    it("allows requests up to the local limit", async () => {
      // numberOfRequest=4 → localLimit = Math.floor(4/2) = 2
      const throttle = new Throttle(makeFailingPrimary(), 60, 4);

      const r1 = await throttle.consume("key", 1); // count=1 ≤ 2 → allowed
      const r2 = await throttle.consume("key", 1); // count=2 ≤ 2 → allowed

      expect(r1.allowed).toBe(true);
      expect(r2.allowed).toBe(true);
    });

    it("blocks once count exceeds the local limit", async () => {
      // numberOfRequest=4 → localLimit=2
      const throttle = new Throttle(makeFailingPrimary(), 60, 4);

      await throttle.consume("key", 1); // count=1
      await throttle.consume("key", 1); // count=2
      const r3 = await throttle.consume("key", 1); // count=3 → blocked

      expect(r3.allowed).toBe(false);
    });

    it("remaining is never negative", async () => {
      const throttle = new Throttle(makeFailingPrimary(), 60, 4);

      await throttle.consume("key", 1);
      await throttle.consume("key", 1);
      const over = await throttle.consume("key", 1); // count=3, localLimit=2

      expect(over.remaining).toBeGreaterThanOrEqual(0);
    });

    it("persists localCounts Map between calls — regression for per-request instantiation bug", async () => {
      // Before the fix, Throttle was instantiated inside the handler on every
      // request, resetting the Map each time. This test would fail in that world.
      const throttle = new Throttle(makeFailingPrimary(), 60, 4); // localLimit=2
      const results: boolean[] = [];

      for (let i = 0; i < 4; i++) {
        const r = await throttle.consume("key", 1);
        results.push(r.allowed);
      }

      // First 2 allowed, next 2 blocked
      expect(results).toEqual([true, true, false, false]);
    });

    it("resets the counter after the window expires", async () => {
      vi.useFakeTimers();
      const throttle = new Throttle(makeFailingPrimary(), 60, 4); // localLimit=2

      // Exhaust the limit
      await throttle.consume("key", 1);
      await throttle.consume("key", 1);
      const blocked = await throttle.consume("key", 1);
      expect(blocked.allowed).toBe(false);

      // Advance past the 60s window
      vi.advanceTimersByTime(61_000);

      const afterReset = await throttle.consume("key", 1);
      expect(afterReset.allowed).toBe(true);
    });

    it("tracks different keys independently", async () => {
      // numberOfRequest=4 → localLimit=2
      const throttle = new Throttle(makeFailingPrimary(), 60, 4);

      // Exhaust key-A
      await throttle.consume("key-A", 1);
      await throttle.consume("key-A", 1);
      const blockedA = await throttle.consume("key-A", 1);

      // key-B should start fresh
      const allowedB = await throttle.consume("key-B", 1);

      expect(blockedA.allowed).toBe(false);
      expect(allowedB.allowed).toBe(true);
    });
  });
});
