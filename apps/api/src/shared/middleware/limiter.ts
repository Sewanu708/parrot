import { RequestComponents, HandlerResult } from "../../express/types";
import { appError } from "../../express/errors";
import { ERROR_CODE } from "../../express/constant";
import * as requestIP from "request-ip";
import { RateLimiter, Throttle } from "../utils/throttle";
import { getRedisInstance } from "../redis";
import expressHandler from "../../express/handler";

const _unauthThrottle = new Throttle(
  new RateLimiter(getRedisInstance(), 60, 15),
  60,
  15,
);
const _authThrottle = new Throttle(
  new RateLimiter(getRedisInstance(), 60, 100),
  60,
  100,
);

export const unauthenticatedLimiter = expressHandler({
  method: "get",
  path: "",
  middlewares: [],
  handler: async (req: RequestComponents): Promise<HandlerResult> => {
    const clientIP = requestIP.getClientIp(req) ?? "unknown";
    const resp = await _unauthThrottle.consume(clientIP, 1);

    const responseHeaders = {
      "X-RateLimit-Limit": resp.limit,
      "X-RateLimit-Remaining": resp.remaining,
      ...(resp.retryAfter !== undefined && { "Retry-After": resp.retryAfter }),
      ...(resp.resetAt !== undefined && { "X-RateLimit-Reset": resp.resetAt }),
    };

    if (!resp.allowed) {
      appError("Too many requests", ERROR_CODE.RTLIMERR, {
        code: "SL08",
        context: { headers: responseHeaders },
      });
    }

    return {
      augments: {
        headers: {
          ...responseHeaders,
        },
        meta: {
          ...req.meta,
        },
      },
    };
  },
});

export const authenticatedLimiter = expressHandler({
  method: "get",
  path: "",
  middlewares: [],
  handler: async (req: RequestComponents): Promise<HandlerResult> => {
    const userId = req.meta.user?.id;

    if (!userId) {
      appError(
        "User authentication is required for this rate limiter.",
        ERROR_CODE.NOAUTHERR,
        { code: "SL07" },
      );
    }

    const resp = await _authThrottle.consume(userId, 1);

    const responseHeaders = {
      "X-RateLimit-Limit": resp.limit,
      "X-RateLimit-Remaining": resp.remaining,
      ...(resp.retryAfter !== undefined && { "Retry-After": resp.retryAfter }),
      ...(resp.resetAt !== undefined && { "X-RateLimit-Reset": resp.resetAt }),
    };

    if (!resp.allowed) {
      appError("Too many requests", ERROR_CODE.RTLIMERR, {
        code: "SL08",
        context: { headers: responseHeaders },
      });
    }

    return { headers: responseHeaders };
  },
});