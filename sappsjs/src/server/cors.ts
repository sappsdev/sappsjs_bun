import type { CorsOptions, Middleware } from './types';

export const DEFAULT_CORS_OPTIONS: CorsOptions = {
	origin: '*',
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization'],
	exposedHeaders: [],
	credentials: false,
	maxAge: 86400
};

export class CorsHandler {
	private options: CorsOptions;

	constructor(options?: CorsOptions) {
		this.options = { ...DEFAULT_CORS_OPTIONS, ...options };
	}

	private isOriginAllowed(origin: string): boolean {
		const allowedOrigins = this.options.origin;

		if (allowedOrigins === '*') return true;

		if (typeof allowedOrigins === 'function') {
			return allowedOrigins(origin);
		}

		if (Array.isArray(allowedOrigins)) {
			return allowedOrigins.includes(origin);
		}

		return allowedOrigins === origin;
	}

	private getAllowOriginHeader(requestOrigin: string): string {
		const allowedOrigins = this.options.origin;

		if (allowedOrigins === '*') {
			return '*';
		}

		if (typeof allowedOrigins === 'function' || Array.isArray(allowedOrigins)) {
			return requestOrigin;
		}

		return allowedOrigins!;
	}

	middleware: Middleware = async (req, next) => {
		const origin = req.headers.get('origin') || '';
		const isAllowed = this.isOriginAllowed(origin);

		if (req.method === 'OPTIONS') {
			const headers = new Headers();

			if (isAllowed) {
				headers.set('Access-Control-Allow-Origin', this.getAllowOriginHeader(origin));
				headers.set('Access-Control-Allow-Methods', (this.options.methods || []).join(', '));
				headers.set('Access-Control-Allow-Headers', (this.options.allowedHeaders || []).join(', '));

				if (this.options.credentials) {
					headers.set('Access-Control-Allow-Credentials', 'true');
				}

				if (this.options.maxAge) {
					headers.set('Access-Control-Max-Age', this.options.maxAge.toString());
				}

				return new Response(null, {
					status: 204,
					headers
				});
			}

			return new Response(null, { status: 403 });
		}

		const response = await next();

		if (!isAllowed || !origin) return response;

		const newHeaders = new Headers(response.headers);

		newHeaders.set('Access-Control-Allow-Origin', this.getAllowOriginHeader(origin));

		if (this.options.exposedHeaders && this.options.exposedHeaders.length > 0) {
			newHeaders.set('Access-Control-Expose-Headers', this.options.exposedHeaders.join(', '));
		}

		if (this.options.credentials) {
			newHeaders.set('Access-Control-Allow-Credentials', 'true');
		}

		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: newHeaders
		});
	};
}
