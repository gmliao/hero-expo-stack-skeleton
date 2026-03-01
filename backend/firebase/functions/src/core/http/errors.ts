import type { FailureDto } from "../../types/api";

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INTERNAL";

const ERROR_STATUS_MAP: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL: 500,
};

export class AppError extends Error {
  public readonly status: number;

  constructor(
    public readonly code: ErrorCode,
    message?: string,
    public readonly details?: unknown,
  ) {
    super(message ?? code);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = "AppError";
    this.status = ERROR_STATUS_MAP[code];
    Error.captureStackTrace?.(this, new.target);
  }
}

export function mapErrorToFailureDto(err: unknown): {
  status: number;
  body: FailureDto;
} {
  if (err instanceof AppError) {
    const body: FailureDto = {
      success: false,
      error: err.code,
      message: err.message,
    };
    if (
      err.details &&
      typeof err.details === "object" &&
      "subCode" in err.details &&
      typeof (err.details as Record<string, unknown>).subCode === "string"
    ) {
      body.code = (err.details as Record<string, unknown>).subCode as string;
    }
    return { status: err.status, body };
  }

  return {
    status: 500,
    body: { success: false, error: "INTERNAL", message: "Internal error" },
  };
}
