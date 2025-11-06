import { belongsTo, defineTable, text, timestamp, ulid } from "sappsjs/orm";
import type { InferTable } from "sappsjs/types";


export const SessionTable = defineTable({
  tableName: 'sessions',
  columns: {
    id: ulid().primaryKey(),
    name: text().notNull(),
    user_id: ulid().notNull().references('users', 'id'),
    ip_address: text().notNull(),
    token: text().notNull().unique(),
    expires_at: timestamp().defaultNow().notNull(),
    created_at: timestamp().defaultNow().notNull(),
    updated_at: timestamp().defaultNow().onUpdateNow().notNull(),
  },
  relations: {
    user: belongsTo('users', { foreignKey: 'user_id' }),
  },
});

export type Session = InferTable<typeof SessionTable>;
