
import { boolean, defineTable, hasMany, text, timestamp, ulid, belongsTo } from "sappsjs/orm";
import type { InferTable } from "sappsjs/types";

export const PostTable = defineTable({
  tableName: 'posts',
  columns: {
    id: ulid().primaryKey(),
    title: text().notNull(),
    content: text().notNull(),
    user_id: text().notNull().references('users', 'id'),
    published: boolean().default(false).notNull(),
    created_at: timestamp().defaultNow().notNull(),
  },
  relations: {
    user: belongsTo('users', { foreignKey: 'user_id' }),
    comments: hasMany('comments'),
  },
});

export type Post = InferTable<typeof PostTable>;
