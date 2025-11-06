import { UserTable, type User, type UserCreateData, type UserUpdateData, type UserWithSessions } from "@/entities/user";
import { query, transaction, transactionWithSavepoints } from "sappsjs/orm";
import type { PaginatedResponse, PaginationOptions } from "sappsjs/types";

export async function insertUser(data: UserCreateData): Promise<User> {
	return await query(UserTable).insert(data);
}

export async function findUsers(): Promise<User[]> {
	return await query(UserTable).orderBy("created_at", "DESC").execute();
}

export async function findPaginateUsers(
	options: PaginationOptions
): Promise<[User[], PaginatedResponse]> {
	const qb = query(UserTable);

	qb.select("id", "name", "email", "created_at", "updated_at");

	if (options.search) {
		qb.search(options.search, ["email", "name"]);
	}

	if (options.sortBy && options.sortOrder) {
		qb.orderBy(options.sortBy, options.sortOrder as "ASC" | "DESC");
	}

	return await qb.paginate(Number(options.page), Number(options.pageSize));
}

export async function findUsersWithSessions(): Promise<UserWithSessions[]> {
	return await query(UserTable)
		.with("sessions")
		.orderBy("created_at", "DESC")
		.execute();
}

export async function findUserById(id: string): Promise<User | null> {
	return await query(UserTable).where("id", id).first();
}

export async function findUserByIdWithSessions(id: string) {
	return await query(UserTable).with("sessions").where("id", id).first();
}

export async function updateUser(id: string, data: UserUpdateData): Promise<User> {
	const [updated] = await query(UserTable).where("id", id).update(data);
	return updated!;
}

export async function deleteUser(id: string): Promise<boolean> {
	return await query(UserTable).where("id", id).delete();
}

export async function findUserByEmail(email: string): Promise<User | null> {
	return await query(UserTable).where("email", email).first();
}

async function transferBalance() {
	try {
		await transaction(async (tx) => {
			await tx.queryRaw("accounts").where("id", 1).update({ balance: -100 });

			await tx.queryRaw("accounts").where("id", 2).update({ balance: 100 });

			console.log("Transferencia completada");
		});
	} catch (error) {
		console.error("Error en transferencia:", error);
	}
}

async function createUserWithProfile() {
	return await transaction(async (tx) => {
		const user = await tx.query(UserTable).insert({
			name: "Juan",
			email: "juan@example.com",
		});

		const profile = await tx.queryRaw("profiles").insert({
			user_id: user.id,
			bio: "Mi biografía",
			avatar_url: "https://example.com/avatar.jpg",
		});

		await tx.queryRaw("audit_logs").insert({
			action: "user_created",
			user_id: user.id,
			data: JSON.stringify({ user, profile }),
		});

		return { user, profile };
	});
}

async function complexOrderProcessing() {
	return await transactionWithSavepoints(async (tx) => {
		const order = await tx.queryRaw("orders").insert({
			user_id: 1,
			total: 150.0,
			status: "pending",
		});

		await tx.savepoint("items_sp", async (sp) => {
			const items = [
				{ order_id: order.id, product_id: 1, quantity: 2, price: 50 },
				{ order_id: order.id, product_id: 2, quantity: 1, price: 50 },
			];

			for (const item of items) {
				await sp.query("order_items").insert(item);
				await sp.query("products").where("id", item.product_id).update({ stock: -item.quantity });
			}
		});

		await tx.savepoint("payment_sp", async (sp) => {
			const payment = await sp.query("payments").insert({
				order_id: order.id,
				amount: order.total,
				status: "processing",
			});

			if (Math.random() > 0.8) {
				throw new Error("Pago rechazado");
			}

			await sp.query("payments").where("id", payment.id).update({ status: "completed" });
		});

		await tx.queryRaw("orders").where("id", order.id).update({ status: "completed" });

		return order;
	});
}

async function batchUpdateWithPartialRollback() {
	return await transactionWithSavepoints(async (tx) => {
		const userIds = [1, 2, 3, 4, 5];
		const results = [];

		for (const userId of userIds) {
			try {
				await tx.savepoint(`user_${userId}`, async (sp) => {
					const updated = await sp
						.query(UserTable)
						.where("id", userId)
						.update({ last_updated: new Date() });

					const user = await sp.query(UserTable).where("id", userId).first();

					if (user.email.includes("invalid")) {
						throw new Error("Email inválido");
					}

					results.push({ userId, status: "success" });
				});
			} catch (error) {
				results.push({ userId, status: "failed", error: (error as Error).message });
			}
		}

		return results;
	});
}
