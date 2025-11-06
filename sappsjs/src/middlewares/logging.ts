import type { Middleware } from "../types";

export const logging: Middleware = async (req, next) => {
	const start = performance.now();
	const url = new URL(req.url);
	console.log(`[${new Date().toISOString()}] ${req.method} ${url.pathname}`);

	const response = await next();

	const duration = performance.now() - start;
	console.log(`  └─ ${response.status} (${duration.toFixed(2)}ms)`);

	return response;
};
