import { Redis } from "ioredis";
import { env } from "@parrot/db/src/env";
import { logger } from "../logger";

export class RedisService {
  public redis: Redis;
  private isReady = false; // Track connection status

  constructor() {
    const dbUrl = env.REDIS_URL;
    if (!dbUrl) throw new Error("Misconfigured Redis, halting.");

    this.redis = new Redis(dbUrl);

    this.redis.on("error", (err) => {
      logger.error(`IoRedis connection error: ${err.message}`);
      this.isReady = false;
    });

    this.redis.on("connect", () => {
      // logger.info("IoRedis connected!");
      this.isReady = true;
    });

    this.redis.on("reconnecting", (delay: number) => {
      // logger.warn(`IoRedis reconnecting... next retry in ${delay}ms`);
    });

    this.redis.on("end", () => {
      logger.warn("IoRedis connection ended.");
      this.isReady = false;
    });
  }

  async destroy() {
    try {
      await this.redis.quit();
    } catch (err) {
      logger.error({ err }, "IoRedis quit failed");
    }
  }

  async get<T>(key: string): Promise<T | null> {
    let data = null;
    if (!this.isReady) {
      return null;
    }

    try {
      data = await this.redis.get(key);
    } catch (err) {
      if (err instanceof Error)
        logger.error(`IoRedis get failed: ${err.message}`);
    }

    if (data === null) {
      return null;
    }

    try {
      return JSON.parse(data) as T;
    } catch {
      return data as T;
    }
  }

  async del(key: string): Promise<number> {
    if (!this.isReady) {
      return 0;
    }
    try {
      return this.redis.del(key);
    } catch (err) {
      if (err instanceof Error)
        logger.error(`IoRedis del failed: ${err.message}`);
      return 0;
    }
  }

  async set<T>(
    key: string,
    value: T,
    opts?: { ttl?: number },
  ): Promise<"OK" | T | null> {
    if (!this.isReady) {
      return null;
    }

    try {
      const stringifiedValue =
        typeof value === "object" ? JSON.stringify(value) : String(value);
      if (opts?.ttl) {
        await this.redis.set(key, stringifiedValue, "PX", opts.ttl);
      } else {
        await this.redis.set(key, stringifiedValue);
      }
    } catch (err) {
      if (err instanceof Error)
        logger.error(`IoRedis set failed: ${err.message}`);
      return null;
    }

    return "OK";
  }
}

// Export a singleton instance
export const redisClient = new RedisService();
