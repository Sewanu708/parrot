import { RequestComponents, HandlerResult, HandlerFunction } from "../../express/types";
import { appError } from "../../express/errors";
import { ERROR_CODE } from "../../express/constant";
import { db } from "@parrot/db/src/config";
import { sessions, users } from "@parrot/db/src/schema";
import { eq } from "drizzle-orm";

export const requireAuth: HandlerFunction = async (req: RequestComponents): Promise<HandlerResult> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    appError("Missing or invalid authorization header", ERROR_CODE.NOAUTHERR, { code: "SL07" });
  }

  const token = authHeader.split(" ")[1];

  const [session] = await db.select().from(sessions).where(eq(sessions.token, token));
  if (!session || !session.isActive || session.expiresAt < new Date()) {
    appError("Session expired or invalid", ERROR_CODE.EXPIREDTOKEN, { code: "SL08" });
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.userId));
  if (!user) {
    appError("User not found", ERROR_CODE.AUTHERR, { code: "SL05" });
  }

  // Inject user and session into req.meta for downstream handlers
  return {
    augments: {
      meta: {
        ...req.meta,
        user,
        session
      }
    }
  };
};
