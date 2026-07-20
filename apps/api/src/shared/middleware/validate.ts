import { z } from "zod";
import { appError } from "../../express/errors";
import { ERROR_CODE } from "../../express/constant";
import expressHandler from "../../express/handler";
import { logger } from "../../logger";

export const validateRequest = (schema: {
  body?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
  params?: z.ZodTypeAny;
}) => {
  return expressHandler({
    method: "get",
    path: "/",
    handler: (req) => {
      try {
        if (schema.body) req.body = schema.body.parse(req.body);

        if (schema.query)
          req.query = schema.query.parse(req.query) as Record<string, any>;
        logger.info(req.body);
        if (schema.params)
          req.params = schema.params.parse(req.params) as Record<string, any>;
        return {};
      } catch (error) {
        if (error instanceof z.ZodError) {
          appError("Validation failed", ERROR_CODE.INVLDREQ, {
            code: "SL01",
            details: error.issues
              .map((e) => `${e.path.join(".")}: ${e.message}`)
              .join(", "),
          });
        }
        throw error;
      }
    },
  });
};
