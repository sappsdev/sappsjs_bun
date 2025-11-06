import type { RouteHandler } from "sappsjs/types";
import { type AuthState, type LoginRequest } from "@/types/auth-types";
import { respond } from "sappsjs";
import { authLogin, authMe } from "@/services/auth-service";

export const postLogin: RouteHandler<{ validJson: LoginRequest }> = (req) => {
  return respond(async () => {
    return await authLogin(req.validJson)
  })
};

export const getMe: RouteHandler<{ state: AuthState}> = (req) => {
  return respond(async () => {
    return await authMe(req.state.userId)
  })
};
