import { defineTable, hasMany, text, timestamp, ulid, enums, decimal } from "sappsjs/orm";
import type { InferTable, WithRelations } from "sappsjs/types";
import type { Session } from "./session";

export const UserTable = defineTable({
	tableName: "users",
	columns: {
		id: ulid().primaryKey(),
		name: text().notNull(),
		email: text().notNull().unique(),
		password: text().notNull(),
		balance: decimal().default(0).notNull(),
		role: enums("user", "admin", "agent").default("user").notNull(),
		image: text().nullable(),
		created_at: timestamp().defaultNow().notNull(),
		updated_at: timestamp().defaultNow().onUpdateNow().notNull(),
	},
	relations: {
		sessions: hasMany("sessions"),
	},
});

export type User = InferTable<typeof UserTable>;
export type UserWithSessions = WithRelations<User, { sessions: Session[] }>;
export type UserCreateData = Omit<User, "id" | "balance" | "image" | "created_at" | "updated_at">;
export type UserUpdateData = Pick<User, "name" | "email">;
