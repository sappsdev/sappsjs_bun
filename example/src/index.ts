import { SappsJS } from "sappsjs";
import { routes } from "@/routes";
import { websockets } from "@/websockets";
import { staticRoutes } from "@/static";

const app = new SappsJS({
	cors: {
		origin: "*",
		methods: ["GET", "POST", "PUT", "DELETE"],
		allowedHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	},
	routes,
	websockets,
  static: staticRoutes
});

const server = await app.serve();
console.log(`🚀 Server running at ${server.url}`);
