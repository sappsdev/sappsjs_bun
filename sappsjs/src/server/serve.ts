import { DocsGenerator } from '../docs/generator';
import { CorsHandler } from './cors';
import { mimeTypes } from './static';
import { join, extname, resolve } from 'path';

import type {
	EnhancedRequest,
	MethodHandler,
	MethodHandlers,
	Middleware,
	RouteHandler,
	Routes,
	SappsConfig,
	StaticConfig,
	StaticRoute,
	StaticRoutes,
	WebSocket,
	WebSocketHandler,
	WebSockets
} from './types';

export class SappsJS {
	private port: number;
	private hostname: string;
	private development: boolean;
	private globalMiddlewares: Middleware[];
	private routes?: Routes;
	private corsHandler?: CorsHandler;
	private webSockets?: WebSockets;
	private static?: StaticRoutes;
	private notFound?: Response;
	private server?: any;
	private docsPath: string = './out/__docs.html';

	constructor(config: SappsConfig) {
		this.port = config.port || 3000;
		this.hostname = config.hostname || '0.0.0.0';
		this.development = config.development || false;
		this.globalMiddlewares = config.globalMiddlewares || [];
		this.routes = config.routes;
		this.webSockets = config.websockets;
		this.static = config.static;
		this.notFound = config.notFound;

		if (config.cors === true) {
			this.corsHandler = new CorsHandler();
			this.globalMiddlewares.unshift(this.corsHandler.middleware);
		} else if (config.cors && typeof config.cors === 'object') {
			this.corsHandler = new CorsHandler(config.cors);
			this.globalMiddlewares.unshift(this.corsHandler.middleware);
		}
	}

	private parseQueryParams(url: URL): Record<string, string> {
		const query: Record<string, string> = {};
		url.searchParams.forEach((value, key) => {
			query[key] = value;
		});
		return query;
	}

	private addRequestUtilities(req: EnhancedRequest): void {
		Object.defineProperties(req, {
			ip: {
				get() {
					return (
						req.headers.get('x-forwarded-for')?.split(',')?.[0]?.trim() ||
						req.headers.get('x-real-ip')?.trim() ||
						'127.0.0.1'
					);
				},
				enumerable: true
			},
			bearerToken: {
				get() {
					const auth = req.headers.get('Authorization');
					return auth?.startsWith('Bearer ') ? auth.slice(7) : null;
				},
				enumerable: true
			},
			userAgent: {
				get() {
					return req.headers.get('user-agent') || 'Unknown';
				},
				enumerable: true
			}
		});
	}

	private async executeMiddlewares(
		req: EnhancedRequest,
		middlewares: Middleware[],
		finalHandler: () => Promise<Response>
	): Promise<Response> {
		let index = 0;

		const next = async (): Promise<Response> => {
			if (index >= middlewares.length) {
				return finalHandler();
			}

			const middleware = middlewares[index++];
			return middleware!(req, next);
		};

		return next();
	}

	private parseMethodHandler(handler: MethodHandler): [Middleware[], RouteHandler] {
		if (Array.isArray(handler)) {
			return [handler[0], handler[1]];
		}
		return [[], handler];
	}

	private parseWebSocketHandler(handler: WebSocket): [Middleware[], WebSocketHandler] {
		if (Array.isArray(handler)) {
			return [handler[0], handler[1]];
		}

		return [[], handler];
	}

	private parseStaticHandler(handler: StaticRoute): [Middleware[], StaticConfig] {
		if (Array.isArray(handler)) {
			return [handler[0], handler[1]];
		}
		return [[], handler];
	}

	private getMimeType(filepath: string): string {
		const ext = extname(filepath).toLowerCase();
		return mimeTypes[ext] || 'application/octet-stream';
	}

	private async serveStaticFile(filePath: string, config: StaticConfig): Promise<Response | null> {
		try {
			const file = Bun.file(filePath);
			const exists = await file.exists();

			if (!exists) {
				return null;
			}

			const mimeType = this.getMimeType(filePath);
			const headers: Record<string, string> = {
				'Content-Type': mimeType
			};

			if (config.maxAge !== undefined) {
				headers['Cache-Control'] = config.immutable
					? `public, max-age=${config.maxAge}, immutable`
					: `public, max-age=${config.maxAge}`;
			}

			return new Response(file, { headers });
		} catch (error) {
			return null;
		}
	}

	private createStaticHandler(
		basePath: string,
		config: StaticConfig
	): RouteHandler<{
		state: Record<string, any>;
		validJson: Record<string, any>;
		validFormData: Record<string, any>;
		params: Record<string, string>;
		query: Record<string, string>;
	}> {
		return async (req: EnhancedRequest): Promise<Response> => {
			const url = new URL(req.url);
			let pathname = url.pathname;

			if (pathname.startsWith(basePath)) {
				pathname = pathname.slice(basePath.length);
			}

			if (pathname.startsWith('/')) {
				pathname = pathname.slice(1);
			}

			const requestedPath = join(config.path, pathname);

			const fileResponse = await this.serveStaticFile(requestedPath, config);
			if (fileResponse) {
				return fileResponse;
			}

			if (config.index && pathname === '') {
				const indexPath = join(config.path, config.index);
				const indexResponse = await this.serveStaticFile(indexPath, config);
				if (indexResponse) {
					return indexResponse;
				}
			}

			if (config.fallback) {
				const fallbackPath = join(config.path, config.fallback);
				const fallbackResponse = await this.serveStaticFile(fallbackPath, config);
				if (fallbackResponse) {
					return fallbackResponse;
				}
			}

			return this.notFound || Response.json({ error: 'File not found' }, { status: 404 });
		};
	}

	private createRouteHandler(methodHandlers: MethodHandlers): RouteHandler<{
		state: Record<string, any>;
		validJson: Record<string, any>;
		validFormData: Record<string, any>;
		params: Record<string, string>;
		query: Record<string, string>;
	}> {
		return async (req: EnhancedRequest): Promise<Response> => {
			req.state = req.state || {};

			const url = new URL(req.url);
			req.query = url.search ? this.parseQueryParams(url) : {};

			this.addRequestUtilities(req);

			const method = req.method.toUpperCase() as keyof MethodHandlers;

			if (method === 'OPTIONS') {
				return this.executeMiddlewares(req, this.globalMiddlewares, async () => {
					return new Response(null, { status: 204 });
				});
			}

			const handler = methodHandlers[method];

			if (!handler) {
				return Response.json({ error: 'Method not allowed' }, { status: 405 });
			}

			const [methodMiddlewares, actualHandler] = this.parseMethodHandler(handler);

			const allMiddlewares = [...this.globalMiddlewares, ...methodMiddlewares];

			return this.executeMiddlewares(req, allMiddlewares, () =>
				Promise.resolve(actualHandler(req))
			);
		};
	}

	private async generateDocsFile(): Promise<void> {
		try {
			const docsGenerator = new DocsGenerator(this.routes!, this.webSockets);
			const docsHTML = docsGenerator.generateHTML();

			await Bun.write(this.docsPath, docsHTML);

			console.log('📚 Docs file generated at', this.docsPath);
		} catch (error) {
			console.error('Error generating docs file:', error);
		}
	}

	private buildRoutesObject(): Record<
		string,
		| RouteHandler<{
				state: Record<string, any>;
				validJson: Record<string, any>;
				validFormData: Record<string, any>;
				params: Record<string, string>;
				query: Record<string, string>;
		  }>
		| Bun.HTMLBundle
	> {
		const routeHandlers: Record<
			string,
			| RouteHandler<{
					state: Record<string, any>;
					validJson: Record<string, any>;
					validFormData: Record<string, any>;
					params: Record<string, string>;
					query: Record<string, string>;
			  }>
			| Bun.HTMLBundle
		> = {};

		if (this.routes) {
			for (const [path, definition] of Object.entries(this.routes)) {
				const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
				const isMethodHandlers =
					typeof definition === 'object' &&
					definition !== null &&
					Object.keys(definition).some((key) => httpMethods.includes(key));

				if (isMethodHandlers) {
					routeHandlers[path] = this.createRouteHandler(definition as MethodHandlers);
				} else if (typeof definition === 'string') {
					routeHandlers[path] = definition as Bun.HTMLBundle;
				} else {
					routeHandlers[path] = definition as Bun.HTMLBundle;
				}
			}
		}

		if (this.static) {
			for (const [basePath, staticRoute] of Object.entries(this.static)) {
				const [middlewares, config] = this.parseStaticHandler(staticRoute);
				const handler = this.createStaticHandler(basePath, config);

				const allMiddlewares = [...this.globalMiddlewares, ...middlewares];

				routeHandlers[basePath === '/' ? '/*' : `${basePath}/*`] = async (req: EnhancedRequest) => {
					req.state = req.state || {};
					const url = new URL(req.url);
					req.query = url.search ? this.parseQueryParams(url) : {};
					this.addRequestUtilities(req);

					return this.executeMiddlewares(req, allMiddlewares, () => Promise.resolve(handler(req)));
				};
			}
		}

		return routeHandlers;
	}

	private getWebSocket(pathname: string): {
		middlewares: Middleware[];
		handlers: WebSocketHandler;
	} | null {
		if (!this.webSockets) return null;

		for (const [path, config] of Object.entries(this.webSockets)) {
			if (path !== '__global' && path === pathname) {
				const [middlewares, handlers] = this.parseWebSocketHandler(config as WebSocket);
				return { middlewares, handlers };
			}
		}

		return null;
	}

	private buildWebSocketConfig() {
		if (!this.webSockets) return undefined;

		const globalConfig = (this.webSockets as any).__global || ({} as any);

		return {
			message: async (ws: any, message: any) => {
				const handlers = ws.data?.handlers;
				if (handlers?.message) {
					await handlers.message(ws, message);
				}
			},
			open: async (ws: any) => {
				const handlers = ws.data?.handlers;
				if (handlers?.open) {
					await handlers.open(ws);
				}
			},
			close: async (ws: any, code: number, reason: string) => {
				const handlers = ws.data?.handlers;
				if (handlers?.close) {
					await handlers.close(ws, code, reason);
				}
			},
			error: async (ws: any, error: Error) => {
				const handlers = ws.data?.handlers;
				if (handlers?.error) {
					await handlers.error(ws, error);
				}
			},
			drain: async (ws: any) => {
				const handlers = ws.data?.handlers;
				if (handlers?.drain) {
					await handlers.drain(ws);
				}
			},
			perMessageDeflate: globalConfig.perMessageDeflate,
			idleTimeout: globalConfig.idleTimeout,
			maxPayloadLength: globalConfig.maxPayloadLength,
			backpressureLimit: globalConfig.backpressureLimit,
			closeOnBackpressureLimit: globalConfig.closeOnBackpressureLimit,
			sendPings: globalConfig.sendPings,
			publishToSelf: globalConfig.publishToSelf
		};
	}

	async serve() {
		const routes = this.buildRoutesObject();

		const hasRoutes = this.routes && Object.keys(this.routes).length > 0;
		const hasWebSockets =
			this.webSockets &&
			Object.keys(this.webSockets).filter((key) => key !== '__global').length > 0;

		if (
			(this.development || process.env.NODE_ENV !== 'production') &&
			(hasRoutes || hasWebSockets)
		) {
			console.log('Running in development mode');
			await this.generateDocsFile();

			const absoluteDocsPath = resolve(process.cwd(), this.docsPath);
			const docsModule = await import(absoluteDocsPath);
			routes['/__docs'] = docsModule.default || docsModule;

			console.log(`📚 API Docs available at http://${this.hostname}:${this.port}/__docs`);
		}

		const config: any = {
			port: this.port,
			hostname: this.hostname,
			development: this.development || process.env.NODE_ENV !== 'production',
			routes,
			error: (error: Error) => {
				console.error(error);
				return Response.json(
					{
						error: this.development ? error.message : 'Internal Server Error',
						stack: this.development ? error.stack : undefined
					},
					{ status: 500 }
				);
			}
		};

		if (this.webSockets) {
			config.fetch = async (req: Request, server: any) => {
				const url = new URL(req.url);
				const pathname = url.pathname;

				const upgradeHeader = req.headers.get('upgrade');
				if (upgradeHeader?.toLowerCase() === 'websocket') {
					const wsRoute = this.getWebSocket(pathname);

					if (wsRoute) {
						const enhancedReq = req as EnhancedRequest;
						enhancedReq.query = url.search ? this.parseQueryParams(url) : {};
						enhancedReq.state = {};

						const allMiddlewares = [...this.globalMiddlewares, ...wsRoute.middlewares];

						return await this.executeMiddlewares(enhancedReq, allMiddlewares, async () => {
							const upgraded = server.upgrade(req, {
								data: {
									handlers: wsRoute.handlers,
									state: enhancedReq.state
								}
							});

							if (!upgraded) {
								return new Response('WebSocket upgrade failed', { status: 400 });
							}
							return undefined as any;
						});
					}
				}
				return this.notFound || Response.json({ error: 'Not Found' }, { status: 404 });
			};

			config.websocket = this.buildWebSocketConfig();
		} else {
			config.fetch = async () => {
				return this.notFound || Response.json({ error: 'Not Found' }, { status: 404 });
			};
		}

		this.server = Bun.serve(config);
		return this.server;
	}
}
