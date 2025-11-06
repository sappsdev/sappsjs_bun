
import { defineTable, text, timestamp, ulid, belongsTo } from "sappsjs/orm";
import type { InferTable } from "sappsjs/types";

export const CommentTable = defineTable({
  tableName: 'comments',
  columns: {
    id: ulid().primaryKey(),
    content: text().notNull(),
    user_id: ulid().notNull().references('users', 'id'),
    post_id: ulid().notNull().references('posts', 'id'),
    created_at: timestamp().defaultNow().notNull(),
  },
  relations: {
    post: belongsTo('posts', { foreignKey: 'post_id' }),
    user: belongsTo('users', { foreignKey: 'user_id' }),
  },
});

export type Comment = InferTable<typeof CommentTable>;
