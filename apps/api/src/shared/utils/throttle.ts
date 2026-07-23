import { RedisService } from "../redis";

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfter?: number; // seconds until next request is allowed
  resetAt?: number; // unix timestamp when the window resets
}

class RateLimiter {
  private _hashStore: Record<string, string> = {};
  constructor(
    private _redis: RedisService,
    private window: number,
    private numberOfRequest: number,
  ) {}

  private async _load_data(id: string) {
    const data = await this._redis.hgetall(id);
    this._hashStore = (data as Record<string, string>) || {};
  }

  async allowRequest(id: string, cost: number = 1): Promise<RateLimitResult> {
    const now = new Date();
    const currentMinute = now.getMinutes();
    const currentHour = now.getHours();
    const prevMinute = currentMinute === 0 ? 59 : currentMinute - 1;
    const prevHour = currentMinute === 0 ? currentHour - 1 : currentHour;

    const previousWindow = `${id}${new Date().toDateString()}:${prevHour}:${prevMinute}`;
    const currentWindow = `${id}${new Date().toDateString()}:${currentHour}:${currentMinute}`;

    await this._load_data(id);
    // check hashstore for id
    const prevReqCount = Number(this._hashStore[previousWindow] ?? 0);
    const currentReqCount = Number(this._hashStore[currentWindow] ?? 0);

    // elasped time
    const elaspedTime = now.getSeconds();
    // this is the portion still overlapping -> current time at 45. window is 60, 15 minutes still overlapping (1-45/60) 25%
    const overlap = 1 - elaspedTime / this.window;
    const effectiveReqCount = prevReqCount * overlap + currentReqCount;
    const resp = effectiveReqCount >= this.numberOfRequest;
    const remaining = this.numberOfRequest - effectiveReqCount;
    const resetAt = Math.floor(
      new Date(
        now.getFullYear(), now.getMonth(), now.getDate(),
        currentHour, currentMinute + 1, 0, 0,
      ).getTime() / 1000,
    );
    const resetAfter = this.window - elaspedTime;
    if (!resp) {
      await this._redis.hincrby(id, currentWindow, cost);
      // Set the hash to expire in 120 seconds to clean up old entries
      await this._redis.expire(id, this.window * 2);
    }
    return {
      allowed: !resp,
      limit: this.numberOfRequest,
      remaining: Math.max(0, remaining),
      resetAt: resp ? resetAt : undefined,
      retryAfter: resp ? resetAfter : undefined,
    };
  }
}

class Throttle {
  private localCounts = new Map<string, { count: number; resetAt: number }>();
  constructor(
    private primary: RateLimiter,
    private window: number,
    private numberOfRequest: number,
  ) {}

  async consume(key: string, cost: number): Promise<RateLimitResult> {
    try {
      return await this.primary.allowRequest(key, cost);
    } catch (error) {
      // something might be wrong with redis
      return this.localConsume(key, cost);
    }
  }

  private localConsume(key: string, cost: number): RateLimitResult {
    // now in seconds
    const now = Math.floor(Date.now() / 1000);
    // get data from local mem
    let data = this.localCounts.get(key);
    if (!data || now >= data.resetAt) {
      data = {
        count: 0,
        resetAt: this.window + now,
      };
    }

    data.count += cost;

    // divide limit across servers -> assuming we have only 2 active running nodes
    const localLimit = Math.max(1, Math.floor(this.numberOfRequest / 2));
    this.localCounts.set(key, data);
    return {
      allowed: data.count <= localLimit,
      remaining: Math.max(0, localLimit - data.count),
      limit: localLimit,
      resetAt: data.resetAt,
    };
  }
}

export { Throttle , RateLimiter};
