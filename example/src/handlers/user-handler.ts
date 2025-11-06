import { respond, respondPaginated, respondStream } from "sappsjs";
import type { PaginationOptions, RouteHandler } from "sappsjs/types";
import { type UserFormData, type UserRegister } from "@/types/user-types";
import * as UserService from "@/services/user-service";
import { qrStreams } from "@/states/qr-state";

export const postUser: RouteHandler<{ validJson: UserRegister }>  = async (req) => {
	return respond(async () => {
		const user = await UserService.createUser(req.validJson);
		const { password, ...userWithoutPassword } = user;
		return userWithoutPassword;
	});
};


export const getPaginateUsers: RouteHandler<{ query: PaginationOptions }> = async (req) => {
  return respondPaginated(async () => {
		return await UserService.paginateUsers(req.query);
  })
};

export const deleteUser: RouteHandler<{ params: { id: string } }> = async (req) => {
  return respond(async () => {
		return await UserService.removeUser(req.params.id);
  })
};
export const uploadFiles: RouteHandler<{ validFormData: UserFormData }> = async (req) => {
  return respond(async () => {
    const formData = req.validFormData
    console.log(formData.avatar)
    Bun.write(`public/${formData.avatar.file.name}`, formData.avatar.file)
		return { ok : "ok"};
  })
};

export const streamUserUpdates: RouteHandler = async (req) => {
  const sessionId = "linea1";

  return respondStream(async (controller) => {
    qrStreams.set(sessionId, controller);

    controller.write(
      `data: ${JSON.stringify({ status: "connected" })}\n\n`
    );

    req.signal.addEventListener("abort", () => {
      qrStreams.delete(sessionId);
      controller.close();
    });
  });
}
