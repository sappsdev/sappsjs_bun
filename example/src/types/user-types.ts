import type { User } from "@/entities/user";
import type { FormDataRules, InferFormData, InferJson, JsonRules } from "sappsjs/types";

export const UserRegisterRules = {
	name: [{ rule: "required", message: "Name required" }],
	email: [
		{ rule: "required", message: "Email required" },
		{ rule: "email", message: "Email invalid" },
	],
	password: [{ rule: "required", message: "Contraseña requerida" }],
	image: [],
} as const satisfies JsonRules;

export type UserRegister = InferJson<typeof UserRegisterRules>;

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
