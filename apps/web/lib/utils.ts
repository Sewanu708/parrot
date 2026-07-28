import { ParrotApiError, PUBLIC_ERROR_CODE } from "@parrot/sdk";

// bundler can affect instanceof judgement, as such checking the error class custom brand makes it quite robust
export function isParrotErrorInstance(err: unknown): err is ParrotApiError {
  if (err instanceof ParrotApiError) return true;
  if (
    typeof err == "object" &&
    err !== undefined &&
    err !== null &&
    "__brand" in err &&
    err.__brand == "Parrot"
  ) {
    return true;
  }

  return false;
}

export function ErrorHandler(err: unknown): string {
  if (isParrotErrorInstance(err))
    return PUBLIC_ERROR_CODE[err?.publicCode!] ?? err.message;
  return err instanceof Error
    ? (err.message ?? "An unexpected error occurred")
    : "An unexpected error occurred";
}

export function getParrotPublicCode(err: unknown): string | undefined {
  if (isParrotErrorInstance(err)) {
    return err.publicCode;
  }
  return undefined;
}

