import type { User } from "@/entities/user";
import type { FormDataRules, InferFormData, InferJson, JsonRules } from "sappsjs/types";

export const UserRequestRules = {
	name: [{ rule: "required", message: "Name required" }],
	email: [
		{ rule: "required", message: "Email required" },
		{ rule: "email", message: "Email invalid" },
	],
	password: [{ rule: "required", message: "Contraseña requerida" }],
	image: [],
} as const satisfies JsonRules;

export type UserRequest = InferJson<typeof UserRequestRules>;
export type UserCreateData = Omit<User, "id" | "role" | "image" | "balance" | "created_at" | "updated_at">;
export type UserUpdateData = Omit<User, "id" | "role" | "balance" | "password" | "created_at" | "updated_at">;

export const UserFormRules = {
	name: [{ rule: "required", message: "Name required" }],
	email: [
		{ rule: "required", message: "Email required" },
		{ rule: "email", message: "Email invalid" },
	],
	avatar: [
	  { rule: "required", message: "Avatar is required" },
		{ rule: "file", message: "Single file expected" },
		{ rule: "maxSize:5242880", message: "Max 5MB" },
	],
	documents: [
		{ rule: "files", message: "Multiple files expected" },
		{ rule: "maxFiles:5", message: "Max 5 files" },
		{ rule: "mimeType:application/pdf,image/*", message: "Only PDFs and images" },
	],
} as const satisfies FormDataRules;

export type UserFormData = InferFormData<typeof UserFormRules>;
