import { AppError } from "sappsjs";


import type { PaginationOptions } from "sappsjs/types";


import * as UserRepo from "@/repos/user-repo";
import type { User, UserWithSessions } from "@/entities/user";
import type { UserRegister } from "@/types/user-types";

export async function createUser(body: UserRegister): Promise<User> {
	const existingUser = await UserRepo.findUserByEmail(body.email);
	if (existingUser) {
		throw new AppError("CONFLICT", "Email already exists");
	}

	const hashPassword = await Bun.password.hash(body.password)

	const user = {
		name: body.name,
		email: body.email,
		password: hashPassword,
		role: "user" as const
	};

	return await UserRepo.insertUser(user);
}

export async function listUsers(): Promise<User[]> {
	return await listUsers();
}

export async function paginateUsers(options: PaginationOptions) {
	return await UserRepo.findPaginateUsers(options);
}

export async function listUsersWithSessions(): Promise<UserWithSessions[]> {
	return await UserRepo.findUsersWithSessions();
}

export async function getUserById(id: string): Promise<User> {
	const user = await UserRepo.findUserById(id);
	if (!user) {
		throw new AppError("NOT_FOUND", "User not found");
	}
	return user;
}

export async function getUserByIdWithSessions(id: string): Promise<UserWithSessions> {
	const user = await UserRepo.findUserByIdWithSessions(id);
	if (!user) {
		throw new AppError("NOT_FOUND", "User not found");
	}
	return user;
}

export async function updateUser(id: string, body: UserRegister): Promise<User> {
	const existingUser = await UserRepo.findUserById(id);
	if (!existingUser) {
		throw new AppError("NOT_FOUND", "User not found");
	}

	if (body.email && body.email !== existingUser.email) {
		const emailExists = await UserRepo.findUserByEmail(body.email);
		if (emailExists) {
			throw new AppError("CONFLICT", "Email already exists");
		}
	}

	const user = {
		name: body.name,
		email: body.email,
	};

	const updated = await UserRepo.updateUser(id, user);
	if (!updated) {
		throw new AppError("CONFLICT", "Failed to update user");
	}

	return updated;
}

export async function removeUser(id: string): Promise<void> {
	const deleted = await UserRepo.deleteUser(id);
	if (!deleted) {
		throw new AppError("CONFLICT", "Failed to delete user");
	}
}

export async function getUserByEmail(email: string): Promise<User> {
	const user = await UserRepo.findUserByEmail(email);
	if (!user) {
		throw new AppError("NOT_FOUND", "User not found");
	}
	return user;
}
