import { respond } from "sappsjs";
import type { Middleware } from "sappsjs/types";

export const queryToken: Middleware = async (req, next) =>
  respond(async () => {
    console.log(req.query.token);
    req.state.token = "okkkkkkkkkkkkk";
    return next();
  });
