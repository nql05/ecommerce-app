import { Prisma } from "@prisma/client";
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
  PrismaClientUnknownRequestError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError,
} from "@prisma/client/runtime/library";

export type ParsedPrismaError = {
  status: number;
  code?: string;
  message: string;
  details?: any;
};

/**
 * Convert a Prisma error (or any error) into a user-friendly object containing
 * an HTTP status code and a readable message. Services/controllers can use
 * this to send consistent responses for database errors.
 */
export function parsePrismaError(error: unknown): ParsedPrismaError {
  // Known Prisma client request errors (constraint violations, not found, etc.)
  if (error instanceof PrismaClientKnownRequestError) {
    const code = error.code;
    const meta = (error as any).meta;

    switch (code) {
      case "P2002":
        // Unique constraint failed
        return {
          status: 409,
          code,
          message: `Unique constraint failed${
            meta?.target ? ` on ${JSON.stringify(meta.target)}` : ""
          }`,
          details: meta,
        };

      case "P2003":
        // Foreign key constraint failed
        return {
          status: 400,
          code,
          message: `Foreign key constraint failed${
            meta?.field_name ? ` on ${meta.field_name}` : ""
          }`,
          details: meta,
        };

      case "P2025":
        // Record to update/delete does not exist
        return {
          status: 404,
          code,
          message: `Record not found: ${error.message}`,
          details: meta,
        };

      default:
        return {
          status: 400,
          code,
          message: error.message ?? "Database error",
          details: meta,
        };
    }
  }

  // Validation errors produced by Prisma client (bad query shape)
  if (error instanceof PrismaClientValidationError) {
    return { status: 400, message: error.message };
  }

  // Unknown request error (connector-level issues)
  if (error instanceof PrismaClientUnknownRequestError) {
    // Try to map common connector messages to user-friendly text
    const msg = (error as any).message ?? String(error);
    if (
      msg.includes("IDENTITY_INSERT") ||
      msg.includes("Cannot insert explicit value for identity column")
    ) {
      return {
        status: 400,
        message:
          "Invalid input: do not provide a value for an identity/auto-increment column (e.g. ProductID) when creating a record.",
        details: { raw: msg },
      };
    }

    return {
      status: 500,
      message: "Database connector error",
      details: { raw: msg },
    };
  }

  // Other Prisma errors
  if (
    error instanceof PrismaClientRustPanicError ||
    error instanceof PrismaClientInitializationError
  ) {
    return { status: 500, message: "Internal database error" };
  }

  // Generic Error fallback
  if (error instanceof Error) {
    const msg = error.message || String(error);

    // Heuristic: map SQL Server identity-insert messages if Prisma wrapped them differently
    if (
      msg.includes("IDENTITY_INSERT") ||
      msg.includes("Cannot insert explicit value for identity column")
    ) {
      return {
        status: 400,
        message:
          "Invalid input: do not provide a value for an identity/auto-increment column (e.g. ProductID) when creating a record.",
        details: { raw: msg },
      };
    }

    return { status: 500, message: msg };
  }

  return { status: 500, message: "Unknown error" };
}

/**
 * Helper to convert and send a consistent response from an Express error handler.
 * Example usage in a controller catch block:
 *
 *   catch (err) {
 *     const parsed = parsePrismaError(err);
 *     return res.status(parsed.status).json({ error: parsed.message, code: parsed.code, details: parsed.details });
 *   }
 */
export function prismaErrorToResponse(err: unknown) {
  const parsed = parsePrismaError(err);
  return parsed;
}

export default { parsePrismaError, prismaErrorToResponse };
