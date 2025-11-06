
import { validateFormData, validateJson } from "sappsjs";
import type { Routes } from "sappsjs/types";
import { LoginRequestRules } from "@/types/auth-types";
import { getMe, postLogin } from "@/handlers/auth-handler";
import * as UserHandler from "@/handlers/user-handler";
import { getWelcome } from "@/handlers/i18n-handler";
import { UserFormRules, UserRequestRules } from "@/types/user-types";
import { jwtRoles } from "@/middleware/jwt-roles";

export const routes: Routes = {
	"/auth/login": {
		POST: [[validateJson(LoginRequestRules)], postLogin],
	},
	"/auth/me": {
		GET: [[jwtRoles(["admin", "user"])], getMe],
	},
	"/users": {
		POST: [[validateJson(UserRequestRules)], UserHandler.postUser],
	},
	"/users/uploads": {
		POST: [[validateFormData(UserFormRules)], UserHandler.uploadFiles],
	},
	"/users/paginated": {
		GET: [[], UserHandler.getPaginateUsers],
	},
	"/stream": {
		GET: [[], UserHandler.streamUserUpdates],
	},
  "/users/:id": {
    PUT: [[validateJson(UserRequestRules), jwtRoles(["admin"])], UserHandler.postUser],
    DELETE: [[], UserHandler.deleteUser],
  },
	"/health": {
		GET: () => Response.json({ status: "ok" }),
	},
	"/translation": {
		GET: getWelcome,
	},
};
