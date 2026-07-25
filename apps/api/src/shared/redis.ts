import { Redis } from "ioredis";
import { logger } from "../logger";
import { env } from "./env";

export class RedisService {
  public redis: Redis;
  private isReady = false;

  constructor() {
    const dbUrl = env.REDIS_URL;
    if (!dbUrl) throw new Error("Misconfigured Redis, halting.");

    this.redis = new Redis(dbUrl);

    this.redis.on("error", (err) => {
      logger.error(`IoRedis connection error: ${err.message}`);
      this.isReady = false;
    });

    this.redis.on("connect", () => {
      logger.info("IoRedis connected!");
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

  async hget<T>(key: string, field: string): Promise<T | null> {
    let data = null;
    try {
      data = await this.redis.hget(key, field);
    } catch (err) {
      if (err instanceof Error)
        logger.error(`IoRedis hget failed: ${err.message}`);
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

  async hset<T>(key: string, field: string, value: T): Promise<number | null> {
    try {
      const stringifiedValue =
        typeof value === "object" ? JSON.stringify(value) : String(value);
      return this.redis.hset(key, field, stringifiedValue);
    } catch (err) {
      if (err instanceof Error)
        logger.error(`IoRedis hset failed: ${err.message}`);
      return null;
    }
  }

  async hincrby(
    key: string,
    field: string,
    increment: number,
  ): Promise<number | null> {
    try {
      const data = await this.redis.hincrby(key, field, increment);
      return data;
    } catch (error) {
      logger.error(`IoRedis hincrby failed: ${error}`);
      return null;
    }
  }

  async hgetall<T extends Record<string, any>>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.hgetall(key);

      if (!data || Object.keys(data).length === 0) {
        return null;
      }

      const parsedData: Record<string, any> = {};
      for (const field in data) {
        try {
          parsedData[field] = JSON.parse(data[field]);
        } catch {
          parsedData[field] = data[field];
        }
      }
      return parsedData as T;
    } catch (err) {
      if (err instanceof Error)
        logger.error(`IoRedis hgetall failed: ${err.message}`);
      return null;
    }
  }

  async expire(key: string, seconds: number): Promise<number | null> {
    try {
      return this.redis.expire(key, seconds);
    } catch (err) {
      if (err instanceof Error)
        logger.error(`IoRedis expire failed: ${err.message}`);
      return null;
    }
  }
}

let _redisInstance: RedisService | null;

export function getRedisInstance(): RedisService {
  if (_redisInstance) return _redisInstance;
  _redisInstance = new RedisService();
  return _redisInstance;
}
