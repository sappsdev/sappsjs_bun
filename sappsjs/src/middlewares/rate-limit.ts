import type { Middleware } from '../types';

export const rateLimit = (maxRequests: number, windowMs: number): Middleware => {
	const requests = new Map<string, number[]>();

	return async (req, next) => {
		const ip = req.headers.get('x-forwarded-for') || 'unknown';
		const now = Date.now();
		const windowStart = now - windowMs;

		if (!requests.has(ip)) {
			requests.set(ip, []);
		}

		const times = requests.get(ip)!.filter((t) => t > windowStart);

		if (times.length >= maxRequests) {
			return Response.json(
				{ error: 'Too many requests' },
				{
					status: 429,
					headers: { 'Retry-After': Math.ceil(windowMs / 1000).toString() }
				}
			);
		}

		times.push(now);
		requests.set(ip, times);

		return next();
	};
};
