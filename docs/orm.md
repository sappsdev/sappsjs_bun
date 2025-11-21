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

```typescript
const orders = await query(OrdersTable)
	.whereBetween('created_at', '2024-01-01', '2024-12-31')
	.execute();

const records = await query(RecordsTable)
	.where('status', 'active')
	.orWhereBetween('updated_at', startDate, endDate)
	.execute();

const excluded = await query(ProductsTable).whereNotBetween('price', 10, 100).execute();

const filtered = await query(TransactionsTable)
	.where('user_id', userId)
	.whereBetween('amount', 50, 500)
	.whereBetween('created_at', startDate, endDate)
	.orderBy('created_at', 'DESC')
	.execute();

const users = await query(usersTable).insertMany([
	{ name: 'Alice', email: 'alice@example.com' },
	{ name: 'Bob', email: 'bob@example.com' },
	{ name: 'Charlie', email: 'charlie@example.com' }
]);

// Con puntos geométricos
const locations = await query(locationsTable).insertMany([
	{ name: 'Store A', location: { x: 10.5, y: 20.3 } },
	{ name: 'Store B', location: { x: 15.2, y: 25.8 } }
]);

// Dentro de una transacción
await transaction(async (tx) => {
	const posts = await tx.query(postsTable).insertMany([
		{ title: 'Post 1', content: 'Content 1' },
		{ title: 'Post 2', content: 'Content 2' }
	]);
});
```
