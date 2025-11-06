import { createHmac, randomBytes } from 'crypto';

interface JWTPayload {
	sub: string;
	roles: string[];
	jti: string;
	iat?: number;
	exp?: number;
}

interface JWTOptions {
	sub: string;
	roles: string[];
	expiresIn?: string;
	jti?: string;
}

const JWT_ALGORITHM = 'HS256';
const DEFAULT_EXPIRATION = '24h';

const TIME_UNITS: Record<string, number> = {
	s: 1,
	m: 60,
	h: 3600,
	d: 86400,
	w: 604800
};

const ERRORS = {
	INVALID_EXPIRATION: "Invalid expiration format. Use format like '1h', '30m', '7d'",
	INVALID_TOKEN: 'Invalid token format',
	TOKEN_EXPIRED: 'Token has expired',
	VERIFICATION_FAILED: 'Token verification failed'
} as const;

const parseExpiration = (expiresIn: string): number => {
	const match = expiresIn.match(/^(\d+)([smhdw])$/);

	if (!match || match.length < 3) {
		throw new Error(ERRORS.INVALID_EXPIRATION);
	}

	const [, value, unit] = match;

	if (!value || !unit || !TIME_UNITS[unit]) {
		throw new Error(ERRORS.INVALID_EXPIRATION);
	}

	return parseInt(value, 10) * TIME_UNITS[unit];
};

const generateJTI = (): string => {
	return randomBytes(16).toString('hex');
};

const base64UrlEncode = (data: string | Buffer): string => {
	const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
	return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

const base64UrlDecode = (encoded: string): string => {
	const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
	return Buffer.from(base64, 'base64').toString('utf-8');
};

const signData = (data: string, secret: string): string => {
	const hmac = createHmac('sha256', secret);
	hmac.update(data);
	return base64UrlEncode(hmac.digest());
};

const verifySignature = (data: string, signature: string, secret: string): boolean => {
	const expectedSignature = signData(data, secret);
	return signature === expectedSignature;
};

const createJWTParts = (payload: JWTPayload): { header: string; payload: string } => {
	const header = {
		alg: JWT_ALGORITHM,
		typ: 'JWT'
	};

	return {
		header: base64UrlEncode(JSON.stringify(header)),
		payload: base64UrlEncode(JSON.stringify(payload))
	};
};

const validateTokenStructure = (token: string): string[] => {
	const parts = token.split('.');
	if (parts.length !== 3) {
		throw new Error(ERRORS.INVALID_TOKEN);
	}
	return parts;
};

const isTokenExpired = (exp?: number): boolean => {
	return exp ? Date.now() / 1000 > exp : false;
};

const validatePayload = (payload: JWTPayload): boolean => {
	return !!(payload.jti && payload.sub && payload.roles);
};

const signJWT = (payload: JWTPayload, secret: string): string => {
	const { header, payload: encodedPayload } = createJWTParts(payload);
	const data = `${header}.${encodedPayload}`;
	const signature = signData(data, secret);
	return `${data}.${signature}`;
};

const verifyJWT = (token: string, secret: string): JWTPayload | null => {
	try {
		const [headerPart, payloadPart, signaturePart] = validateTokenStructure(token);
		const data = `${headerPart}.${payloadPart}`;

		const isValid = verifySignature(data, signaturePart!, secret);

		if (!isValid) {
			return null;
		}

		const payload = JSON.parse(base64UrlDecode(payloadPart!)) as JWTPayload;

		if (isTokenExpired(payload.exp)) {
			return null;
		}

		return payload;
	} catch (error) {
		return null;
	}
};

export const encodeJWT = (options: JWTOptions, secret: string | undefined): string => {
	if (!secret) throw new Error('JWT secret is required');

	const { sub, roles, expiresIn = DEFAULT_EXPIRATION, jti = generateJTI() } = options;

	const now = Math.floor(Date.now() / 1000);
	const expirationSeconds = parseExpiration(expiresIn);
	const exp = now + expirationSeconds;

	const payload: JWTPayload = {
		sub,
		roles,
		jti,
		iat: now,
		exp
	};

	return signJWT(payload, secret);
};

export const decodeJWT = (token: string, secret: string | undefined): JWTPayload | null => {
	if (!secret) throw new Error('JWT secret is required');
	const payload = verifyJWT(token, secret);

	if (!payload || !validatePayload(payload)) {
		return null;
	}

	return payload;
};
