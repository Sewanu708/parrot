import pino, { LoggerOptions } from "pino";
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

const pinoConfig: LoggerOptions = {
  level: process.env.PINO_LOG_LEVEL || "log",
  customLevels,
  useOnlyCustomLevels: true,
  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
  },
  messageKey: "label",
  nestedKey: "data",

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

      "*.*.password",
      "*.*.authorization",
      "*.*.token",
      "*.*.apiKey",
      "*.*.api_key",
      "*.*.otp",
    ],
    censor: "************",
  },
};

export { LOG_TYPE, pinoConfig };
