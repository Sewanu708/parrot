import { RequestComponents, HandlerResult } from "../../express/types";
import { appError } from "../../express/errors";
import { ERROR_CODE } from "../../express/constant";
import { db } from "@parrot/db/src/config";
import { sessions, users } from "@parrot/db/src/schema";
import { eq } from "drizzle-orm";
import expressHandler from "../../express/handler";
import { decodeJWT, getRequestContext } from "../utils/global";
import { logger } from "../../logger";

export const requireAuth = expressHandler({
  path: "*",
  method: "get",
  handler: async (req: RequestComponents): Promise<HandlerResult> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      appError(
        "Missing or invalid authorization header",
        ERROR_CODE.NOAUTHERR,
        { code: "SL07" },
      );
    }

    const token = authHeader.split(" ")[1];

    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, token));
    if (!session || !session.isActive || session.expiresAt < new Date()) {
      appError("Session expired or invalid", ERROR_CODE.EXPIREDTOKEN, {
        code: "SL08",
      });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId));
    if (!user) {
      appError("User not found", ERROR_CODE.AUTHERR, { code: "SL05" });
    }

    const store = getRequestContext();
    if (store) {
      store.userId = user.id;
    }

    // Inject user and session into req.meta for downstream handlers
    return {
      augments: {
        meta: {
          ...req.meta,
          user,
          session,
        },
      },
    };
  },
});

// for endpoints like /get messages. This token is required. else, it's assumed on the widget side that it's a new conversation.
// btw, if /get messages cant be called if there's no conversation id.

export const requireVisitorAuth = expressHandler({
  path: "*",
  method: "get",
  handler: async (req: RequestComponents): Promise<HandlerResult> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      appError(
        "Missing or invalid authorization header",
        ERROR_CODE.NOAUTHERR,
        { code: "SL07" },
      );
    }

    const token = authHeader.split(" ")[1];
    const payload = decodeJWT(token) as {
      conversationId: string;
      visitorId: string;
    };
    if (!payload) {
      appError(
        "Missing or invalid authorization header",
        ERROR_CODE.NOAUTHERR,
        { code: "SL07" },
      );
    }
    if (payload.conversationId !== req.params.conversationId) {
      appError(
        "Missing or invalid authorization header",
        ERROR_CODE.NOAUTHERR,
        { code: "SL07" },
      );
    }

    return {
      augments: {
        meta: {
          ...req.meta,
          visitor: payload,
        },
      },
    };
  },
});

// if the visitor is new, there's no auth header. as such we check the origin against the property's registered origins. if there's any match, we create a jwt token that'd be attached to all other reuquest

export const optionalVisitorAuth = expressHandler({
  path: "*",
  method: "get",
  handler: async (req: RequestComponents): Promise<HandlerResult> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { augments: {} };
    }

    try {
      const token = authHeader.split(" ")[1];
      const payload = decodeJWT(token) as {
        conversationId: string;
        visitorId: string;
      };

      return {
        augments: {
          meta: {
            ...req.meta,
            visitor: payload,
          },
        },
      };
    } catch (err) {
      return { augments: {} };
    }
  },
});
