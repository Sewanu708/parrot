import { ERROR_CODE, ERROR_STATUS_CODE_MAPPING } from "./constant";

type ErrorCodeKey = keyof typeof ERROR_CODE;
type ErrorCodeValue = (typeof ERROR_CODE)[ErrorCodeKey];


export type AppErrorOptions = {
  /** Additional context for logging (not sent to client) */
  context?: Record<string, any>;
  details?: string;
  code?: string;
};

// ──────────────────────────────────────────────
//  AppError class
// ──────────────────────────────────────────────

export class AppError extends Error {
  readonly isApplicationError = true;
  readonly errorCode: ErrorCodeValue;
  readonly publicCode?: string;
  readonly context?: Record<string, any>;
  readonly details?: string;
  readonly httpStatus: number;

  constructor(
    message: string,
    errorCode: ErrorCodeValue = ERROR_CODE.APPERR,
    options: AppErrorOptions = {},
  ) {
    super(message);
    this.name = "AppError";
    this.errorCode = errorCode;
    this.publicCode = options.code;
    this.context = options.context;
    this.details = options.details;

    this.httpStatus =
      ERROR_STATUS_CODE_MAPPING[
        errorCode as keyof typeof ERROR_STATUS_CODE_MAPPING
      ] || 500;
  }
}

export function appError(
  message: string,
  errorCode: ErrorCodeValue = ERROR_CODE.APPERR,
  options: AppErrorOptions = {},
): never {
  throw new AppError(message, errorCode, options);
}
