```typescript
import { defineSchema, hasMany } from '../orm';
import type { InferSchema } from '../orm/types';

export const UserSchema = defineSchema({
	tableName: 'users',
	columns: {
		id: { type: 'SERIAL', primaryKey: true },
		email: { type: 'VARCHAR', unique: true, nullable: false },
		name: { type: 'VARCHAR', nullable: false },
		bio: { type: 'TEXT', nullable: true },
		createdAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
	},
	relations: {
		posts: hasMany('posts')
	}
});
```

```typescript
import { defineSchema, hasMany } from 'sappsjs';
import type { InferSchema } from 'sappsjs';

export const PostSchema = defineSchema({
	tableName: 'posts',
	columns: {
		id: { type: 'SERIAL', primaryKey: true },
		title: { type: 'VARCHAR', nullable: false },
		content: { type: 'TEXT', nullable: false },
		userId: {
			type: 'INTEGER',
			nullable: false,
			references: { table: 'users', column: 'id' }
		},
		slug: { type: 'VARCHAR', unique: true },
		published: { type: 'BOOLEAN', default: 'false', index: true },
		createdAt: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
	},
	indexes: [
		{ columns: ['userId', 'createdAt'] },
		{ columns: ['published', 'createdAt'], name: 'idx_posts_published_date' }
	],
	relations: {
		author: belongsTo('users', { foreignKey: 'userId' }),
		comments: hasMany('comments')
	}
});

export type User = InferSchema<typeof UserSchema>;
export type Post = InferSchema<typeof PostSchema>;
```

```typescript
const user = await query('users').upsert({ id: '123', name: 'Juan', email: 'juan@mail.com' }, 'id');

const user = await query('users').upsert(
	{ email: 'maria@mail.com', name: 'Maria', role: 'admin' },
	'email'
);

const subscription = await query('subscriptions').upsert(
	{ user_id: '123', plan: 'premium', active: true },
	['user_id', 'plan']
);

const product = await query('products').upsert(
	{ sku: 'ABC123', name: 'Product', stock: 50, price: 100 },
	'sku',
	['stock', 'price']
);

await transaction(async (tx) => {
	const result = await tx
		.query('orders')
		.upsert({ order_number: 'ORD-001', status: 'completed' }, 'order_number');
	return result;
});
```

```typescript
const user = await query<User>(USERS_TABLE)
	.where('name', 'ILIKE', '%jhon%')
	.where('status', true)
	.first();

const user = await query<User>(USERS_TABLE)
	.where('name', 'ILIKE', '%jhon%')
	.where('status', true)
	.first();

const user = await query<User>(USERS_TABLE)
	.where('name', 'LIKE', '%jhon%')
	.where('status', true)
	.first();

const users = await query<User>(USERS_TABLE)
	.where('name', 'ILIKE', '%jhon%')
	.where('status', true)
	.execute();

const users = await query<User>(USERS_TABLE)
	.where('name', 'ILIKE', '%jhon%')
	.orWhere('email', 'ILIKE', '%jhon%')
	.where('status', true)
	.execute();
```

```typescript
const users = await query<User>(USERS_TABLE)
	.where('age', '>', 18)
	.where('status', true)
	.where('role', 'IN', ['admin', 'moderator'])
	.execute();

const users = await query<User>(USERS_TABLE)
	.search('jhon', ['name', 'email'])
	.where('status', true)
	.execute();

const users = await query<User>(USERS_TABLE)
	.where('name', 'ILIKE', '%jhon%')
	.where('status', true)
	.orderBy('created_at', 'DESC')
	.limit(10)
	.execute();
```
