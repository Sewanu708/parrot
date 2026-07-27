import pino, { LoggerOptions } from "pino";
import { getRequestContext } from "../shared/utils/global";

const LOG_TYPE = {
  LOG: "log",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
};

const customLevels = {
  log: 20,
  info: 30,
  warn: 40,
  error: 50,
};

const isDev = process.env.NODE_ENV !== "production";

const pinoConfig: LoggerOptions = {
  level: process.env.PINO_LOG_LEVEL || "log",
  customLevels,
  useOnlyCustomLevels: true,

  mixin() {
    const ctx = getRequestContext();
    return ctx
      ? {
          requestId: ctx.requestId,
          ...(ctx.userId && { userId: ctx.userId }),
          ...(ctx.tenantId && { tenantId: ctx.tenantId }),
        }
      : {};
  },


  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
  },

  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
  },
  messageKey: "label",

  ...(isDev && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:HH:MM:ss",
        ignore: "pid,hostname",
      },
    },
  }),

  redact: {
    paths: [
      "password",
      "authorization",
      "token",
      "apiKey",
      "api_key",
      "otp",
      "*.password",
      "*.authorization",
      "*.token",
      "*.apiKey",
      "*.api_key",
      "*.otp",
    ],
    censor: "************",
  },
};

export { LOG_TYPE, pinoConfig };
