import { findUserByEmail, findUserById } from "@/repos/user-repo";
import type { LoginRequest } from "@/types/auth-types";
import { AppError, encodeJWT } from "sappsjs";

export async function authLogin(body: LoginRequest) {
    const user = await findUserByEmail(body.email);
    if (!user) {
      throw new AppError("UNAUTHORIZED", "User not found")
    }
    const passwordMatch = await Bun.password.verify(body.password, user.password);
    if (!passwordMatch) {
      throw new AppError("UNAUTHORIZED", "Invalid password")
    }

    const token = encodeJWT({ sub : user.id, roles: [user.role], expiresIn: "1m" }, process.env.JWT_SECRET);
    return { token };
}

export async function authMe(userId : string) {
    const user = await findUserById(userId);
    if (!user) {
      throw new AppError("UNAUTHORIZED", "User not found")
    }
    return { id: user.id, email: user.email, role: user.role };
}
