import express, { NextFunction } from "express";
import { Request, Response } from "express";
import { logger } from "../logger";
import { env } from "node:process";
import { HTTPStatusCode } from "./constant";
import cors from "cors";
import { getClientIp } from "request-ip";
import { AppError } from "./errors";

import type {
  HttpMethod,
  RequestProperties,
  RequestComponents,
  RequestAugments,
  HandlerResult,
  ResponseComponents,
  HandlerConfiguration,
  HandlerExecutionContext,
  ErrorDetail,
} from "./types";

export type {
  HandlerConfiguration,
  HandlerFunction,
  HandlerResult,
  RequestComponents,
  RequestProperties,
  RequestAugments,
  ResponseComponents,
  HttpMethod,
} from "./types";

function createServer(serverConfig: { port?: number; enableCors?: boolean }) {
  const app = express();

  const { port = 8080, enableCors } = serverConfig;

  app.use(express.json()); // for parsing application/json

  if (enableCors) {
    app.use(cors());
  }

  const handlerHelpers: Record<string, any> = {};
  handlerHelpers["http_statuses"] = HTTPStatusCode;

  const LOG_APP_REQUEST = parseInt(env.LOG_APP_REQUEST ?? "0", 10);

  function createRequestLog(request: Request) {
    return {
      requestURL: request.originalUrl,
      _url: request.url,
      body: request.body,
      query: request.query,
      headers: request.headers,
    };
  }

  function addHandler(handlerConfiguration: HandlerConfiguration) {
    const { method, path, props } = handlerConfiguration;
    app[method](
      path,
      async (expressRequest: Request, expressResponse: Response) => {
        const requestComponents: RequestComponents = {
          body: {},
          query: {},
          params: {},
          headers: {},
          meta: {},
          props: props || {},
          properties: {} as RequestProperties,
        };
        const responseComponents: ResponseComponents = {
          statusCode: 0,
          body: {
            message: "",
            status: "",
          },
          headers: {},
        };

        try {
          const middlewares = handlerConfiguration.middlewares || [];
          const { body, query, params, headers } = expressRequest;
          const meta = {};

          if (LOG_APP_REQUEST) {
            logger.info(
              createRequestLog(expressRequest),
              `${String(method)} ${path} `,
            );
          }

          const properties: RequestProperties = {
            IP: getClientIp(expressRequest),
            baseURL: expressRequest.baseUrl,
            method: expressRequest.method.toLowerCase() as HttpMethod,
            requestURL: expressRequest.originalUrl,
            requestURLWithoutQueryStrings: expressRequest.path,
            handlerPath: path,
            hostname: expressRequest.hostname,
            userAgent: expressRequest.headers["user-agent"] || "",
          };

          requestComponents.body = body;
          requestComponents.query = query as Record<string, string>;
          requestComponents.params = params as Record<string, string>;
          requestComponents.headers = headers;
          requestComponents.meta = meta;
          requestComponents.properties = properties;

          let middlewareExecutionContext: HandlerExecutionContext = {
            augments: {},
            result: { data: null },
          };

          for (const middleware of middlewares) {
            if (middlewareExecutionContext.shouldSkipOtherMiddlewares) {
              break;
            }

            if (middlewareExecutionContext.shouldSkipNextMiddleware) {
              middlewareExecutionContext.shouldSkipNextMiddleware = false;
              continue;
            }

            // reset
            middlewareExecutionContext = {
              augments: {},
              result: { data: null },
            };

            const middlewareExecutionResult: HandlerResult =
              await middleware.handler(requestComponents, handlerHelpers);

            if (middlewareExecutionResult.skipOtherMiddlewares) {
              middlewareExecutionContext.shouldSkipOtherMiddlewares = true;
            }

            if (middlewareExecutionResult.skipNextMiddleware) {
              middlewareExecutionContext.shouldSkipNextMiddleware = true;
            }

            const middlewareAugments: RequestAugments =
              middlewareExecutionResult.augments || {};

            if (middlewareAugments.meta) {
              requestComponents.meta = {
                ...requestComponents.meta,
                ...middlewareAugments.meta,
              };
            }

            if (middlewareAugments.body) {
              requestComponents.body = {
                ...requestComponents.body,
                ...middlewareAugments.body,
              };
            }

            if (middlewareAugments.query) {
              requestComponents.query = {
                ...requestComponents.query,
                ...middlewareAugments.query,
              };
            }

            if (middlewareAugments.params) {
              requestComponents.params = {
                ...requestComponents.params,
                ...middlewareAugments.params,
              };
            }

            if (middlewareAugments.headers) {
              requestComponents.headers = {
                ...requestComponents.headers,
                ...middlewareAugments.headers,
              } as RequestComponents["headers"];
            }

            if (middlewareExecutionResult.endHandlerChain) {
              middlewareExecutionContext.shouldEndRequest = true;
              middlewareExecutionContext.result = middlewareExecutionResult;
              break;
            }
          }

          let result: HandlerResult;
          if (!middlewareExecutionContext.shouldEndRequest) {
            result = await handlerConfiguration.handler(
              requestComponents,
              handlerHelpers,
            );
          } else {
            result = middlewareExecutionContext.result;
          }

          responseComponents.statusCode = result.status || 200;
          responseComponents.body.status = "success";
          responseComponents.body.message = result.message || "";
          responseComponents.body.data = result.data || {};
          responseComponents.headers = result.headers || {};

          for (const header in responseComponents.headers) {
            expressResponse.setHeader(
              header,
              responseComponents.headers[header],
            );
          }

          expressResponse
            .status(responseComponents.statusCode)
            .json(responseComponents.body);
        } catch (error) {
          if (error instanceof AppError) {
            responseComponents.statusCode = error.httpStatus;
            responseComponents.body.status = "error";

            responseComponents.body.errors = {} as ErrorDetail;

            responseComponents.body.errors.code = error.errorCode;

            responseComponents.body.errors.message = error.message;
            if (error.details) {
              responseComponents.body.errors.details = error.details;
            }

            responseComponents.body.errors.publicCode =
              error.publicCode ?? "SL00";

            logger.error(
              {
                errorCode: error.errorCode,
                publicCode: error.publicCode,
                context: error.context,
                path,
                method,
              },
              `AppError: ${error.httpStatus} ${method} ${path}`,
            );
          } else {
            responseComponents.statusCode = 500;
            responseComponents.body.status = "error";
            responseComponents.body.message = "An unexpected error occurred";
            responseComponents.body.errors = {} as ErrorDetail;
            // add a public code for internal errors
            responseComponents.body.errors.publicCode = "SL00";
            ("An unexpected error occurred");
            logger.error(
              { error, path, method },
              `UnhandledError: 500 ${method} ${path}`,
            );
          }

          expressResponse
            .set(responseComponents.headers)
            .status(responseComponents.statusCode)
            .json(responseComponents.body);
        } finally {
          if (typeof handlerConfiguration.onResponseEnd == "function") {
            try {
              handlerConfiguration.onResponseEnd(
                requestComponents,
                responseComponents,
              );
            } catch (e) {
              logger.error(e, `onResponseEnd error`);
            }
          }
        }
      },
    );
  }

  function executeRequest(
    request: Request,
    response: Response,
    nextFunction: NextFunction,
  ) {
    return app(request, response, nextFunction);
  }

  function startServer() {
    app.use((req, res) => {
      res.status(404).json({
        status: "error",
        message: "Resource not found.",
      });
    });
    app.use((err: any, req: Request, res: Response) => {
      logger.error(err, "global-500-error");
      res.status(500).json({
        status: "error",
        message: "Some error occurred",
      });
    });
    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
    });
  }

  return {
    addHandler,
    startServer,
    executeRequest,
    getApp: () => app,
  };
}

export { createServer };
