import { AppError, mapErrorToFailureDto } from "../src/http/errors";
import type { ErrorCode } from "../src/http/errors";

describe("AppError (unit)", () => {
  it("NOT_FOUND has status 404", () => {
    const err = new AppError("NOT_FOUND", "Todo not found");
    expect(err.status).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
    expect(err.message).toBe("Todo not found");
  });

  it("UNAUTHENTICATED has status 401", () => {
    const err = new AppError("UNAUTHENTICATED", "Missing token");
    expect(err.status).toBe(401);
    expect(err.code).toBe("UNAUTHENTICATED");
  });

  it("FORBIDDEN has status 403", () => {
    const err = new AppError("FORBIDDEN");
    expect(err.status).toBe(403);
    expect(err.message).toBe("FORBIDDEN");
  });

  it("VALIDATION_ERROR has status 400", () => {
    const err = new AppError("VALIDATION_ERROR", "title is required");
    expect(err.status).toBe(400);
  });

  it("INTERNAL has status 500", () => {
    const err = new AppError("INTERNAL");
    expect(err.status).toBe(500);
  });

  it("preserves details", () => {
    const err = new AppError("UNAUTHENTICATED", "Token expired", {
      subCode: "TOKEN_EXPIRED",
    });
    expect(err.details).toEqual({ subCode: "TOKEN_EXPIRED" });
  });

  it("is instanceof Error", () => {
    const err = new AppError("NOT_FOUND");
    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
  });
});

describe("mapErrorToFailureDto (unit)", () => {
  it("maps AppError to FailureDto with ErrorCode", () => {
    const err = new AppError("NOT_FOUND", "Todo not found");
    const result = mapErrorToFailureDto(err);
    expect(result.status).toBe(404);
    expect(result.body).toEqual({
      success: false,
      error: "NOT_FOUND",
      message: "Todo not found",
    });
  });

  it("maps AppError with subCode to FailureDto with code field", () => {
    const err = new AppError("UNAUTHENTICATED", "Token expired", {
      subCode: "TOKEN_EXPIRED",
    });
    const result = mapErrorToFailureDto(err);
    expect(result.status).toBe(401);
    expect(result.body).toEqual({
      success: false,
      error: "UNAUTHENTICATED",
      code: "TOKEN_EXPIRED",
      message: "Token expired",
    });
  });

  it("maps unknown Error to INTERNAL 500", () => {
    const result = mapErrorToFailureDto(new Error("boom"));
    expect(result.status).toBe(500);
    expect(result.body).toEqual({
      success: false,
      error: "INTERNAL",
      message: "Internal error",
    });
  });

  it("maps non-Error to INTERNAL 500", () => {
    const result = mapErrorToFailureDto("string error");
    expect(result.status).toBe(500);
    expect(result.body.error).toBe("INTERNAL");
  });
});
