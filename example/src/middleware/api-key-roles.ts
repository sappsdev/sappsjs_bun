import { AppError, decodeJWT, respond } from "sappsjs";
import type { Middleware } from "sappsjs/types";

export const apiKeyRoles = (roles: string[]): Middleware => {
  return async (req, next) =>
    respond(async () => {
      const token = req.bearerToken;

      if (!token) {
        throw new AppError("UNAUTHORIZED", "Authorization token is required");
      }

      return next();
    });
};
