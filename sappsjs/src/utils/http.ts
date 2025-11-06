export function getClientIp(req: Request): string {
	const forwarded = req.headers.get('x-forwarded-for')?.split(',')?.[0]?.trim();
	const realIp = req.headers.get('x-real-ip')?.trim();
	return forwarded || realIp || '127.0.0.1';
}

export function getBearerToken(req: Request): string | null {
	const token = req.headers.get('Authorization')?.replace('Bearer ', '');
	if (!token) return null;
	return token;
}

export function getUserAgent(req: Request): string {
	return req.headers.get('user-agent') || 'Unknown';
}
