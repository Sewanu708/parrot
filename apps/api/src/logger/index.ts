import pino from "pino";
import { LOG_TYPE, pinoConfig } from "./config";

const pinoLogger = pino({
  ...pinoConfig,
  formatters: {
    ...pinoConfig.formatters,
  },
});

type Logger = {
  type: (typeof LOG_TYPE)[keyof typeof LOG_TYPE];
  data: any;
  optionalKey?: string;
};

function _log({ type, data, optionalKey }: Logger) {
  const safeData =
    data !== null && typeof data === "object" ? data : { message: data };

  (pinoLogger as Record<string, any>)[type](safeData, String(optionalKey));
}

export const logger = (data: unknown, optionalKey?: string) =>
  _log({ type: LOG_TYPE.LOG, data, optionalKey });

logger.info = (data: unknown, optionalKey?: string) =>
  _log({ type: LOG_TYPE.INFO, data, optionalKey });

logger.warn = (data: unknown, optionalKey?: string) =>
  _log({ type: LOG_TYPE.WARN, data, optionalKey });

logger.error = (data: unknown, optionalKey?: string) =>
  _log({ type: LOG_TYPE.ERROR, data, optionalKey });
