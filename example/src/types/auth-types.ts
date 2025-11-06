import type { InferJson, JsonRules } from "sappsjs/types";

export type AuthState = {
  userId: string;
  roles: string[];
};

export const LoginRequestRules = {
	email: [
		{ rule: "required", message: "Email requerido" },
		{ rule: "email", message: "Email inválido" },
	],
	password: [{ rule: "required", message: "Contraseña requerida" }],
} as const satisfies JsonRules;

export type LoginRequest = InferJson<typeof LoginRequestRules>;
