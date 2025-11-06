import type { MethodHandlers, Middleware, Routes, WebSockets } from '../server/types';
import { generateHTMLTemplate } from './html-template';
import { extractFormDataSchemaInfo, extractSchemaInfo, generateExampleFromSchema } from './schema-extractor';
import type { DocsData, RouteDoc, WebSocketDoc } from './types';

export class DocsGenerator {
	constructor(
		private readonly routes?: Routes,
		private readonly websockets?: WebSockets
	) {}

	private extractValidationSchema(middlewares: Middleware[]): any | null {
		const middleware = middlewares.find((m) => (m as any).__schema) as any;
		return middleware?.__schema ?? null;
	}

	private extractFormDataSchema(middlewares: Middleware[]): any | null {
		const middleware = middlewares.find((m) => (m as any).__formSchema) as any;
		return middleware?.__formSchema ?? null;
	}

	private hasBearerToken(middlewares: Middleware[]): boolean {
		return middlewares.some((m) => {
			const str = m.toString();
			return str.includes('req.bearerToken') || str.includes('bearerToken');
		});
	}

	private hasQueryToken(middlewares: Middleware[]): boolean {
		return middlewares.some((m) => {
			const str = m.toString();
			return str.includes('req.query.token') || str.includes('query.token');
		});
	}

	private getMiddlewareName(middleware: Middleware): string {
		if ((middleware as any).__schema) return 'validateJson';
		if ((middleware as any).__formSchema) return 'validateFormData';

		const str = middleware.toString();
		if (str.includes('req.bearerToken') || str.includes('bearerToken')) return 'bearerToken';

		return middleware.name && middleware.name !== 'anonymous' ? middleware.name : 'anonymous';
	}

	private getPaginationSchema(handler: any): Record<string, any> | null {
		const str = handler.toString();
		if (!str.includes('PaginationOptions') && !str.includes('respondPaginated')) return null;

		return {
			page: { type: 'number', example: 1, description: 'Page number' },
			pageSize: { type: 'number', example: 10, description: 'Items per page' },
			sort: { type: 'string', example: 'createdAt', description: 'Sort field', optional: true },
			order: {
				type: 'string',
				example: 'asc',
				description: 'Sort order (asc/desc)',
				optional: true
			},
			search: { type: 'string', example: '', description: 'Search text', optional: true }
		};
	}

	private isStreamEndpoint(handler: any): boolean {
		const str = handler.toString();
		return str.includes('respondStream') || str.includes('respondStreamWithCleanup');
	}

	private extractParams(path: string): string[] {
		return path.match(/:(\w+)/g)?.map((m) => m.slice(1)) ?? [];
	}

	private extractRouteInfo(path: string, handlers: MethodHandlers): RouteDoc[] {
		return Object.entries(handlers).map(([method, handler]) => {
			const doc: RouteDoc = {
				path,
				method,
				params: this.extractParams(path)
			};

			const middlewares: Middleware[] = Array.isArray(handler) ? handler[0] : [];

			if (middlewares.length) {
				doc.middlewares = middlewares.map((m) => this.getMiddlewareName(m));
			}

			const validationSchema = this.extractValidationSchema(middlewares);
			if (validationSchema) {
				const schemaInfo = extractSchemaInfo(validationSchema);
				doc.bodySchema = {
					type: 'object',
					required: schemaInfo.required,
					properties: schemaInfo.properties,
					example: generateExampleFromSchema(validationSchema)
				};
			}

			const formDataSchema = this.extractFormDataSchema(middlewares);
			if (formDataSchema) {
				const formSchemaInfo = extractFormDataSchemaInfo(formDataSchema);
				doc.formDataSchema = {
					type: 'formdata',
					required: formSchemaInfo.required,
					properties: formSchemaInfo.properties
				};
			}

			doc.requiresBearer = this.hasBearerToken(middlewares);

			const pagination = this.getPaginationSchema(handler);
			if (pagination) {
				doc.isPaginated = true;
				doc.queryParams = pagination;
			}

			doc.isStream = this.isStreamEndpoint(handler);

			return doc;
		});
	}

	private extractWebSocketInfo(): WebSocketDoc[] {
		if (!this.websockets) return [];

		const wsDocs: WebSocketDoc[] = [];

		for (const [path, config] of Object.entries(this.websockets)) {
			if (path === '__global') continue;

			const doc: WebSocketDoc = {
				path,
				handlers: {
					open: false,
					message: false,
					close: false,
					error: false,
					drain: false
				}
			};

			let middlewares: Middleware[] = [];
			let handlers: any = config;

			if (Array.isArray(config)) {
				middlewares = config[0];
				handlers = config[1];
			}

			if (middlewares.length) {
				doc.middlewares = middlewares.map((m) => this.getMiddlewareName(m));
				doc.requiresToken = this.hasQueryToken(middlewares);
			}

			if (handlers.open) doc.handlers.open = true;
			if (handlers.message) doc.handlers.message = true;
			if (handlers.close) doc.handlers.close = true;
			if (handlers.error) doc.handlers.error = true;
			if (handlers.drain) doc.handlers.drain = true;

			wsDocs.push(doc);
		}

		return wsDocs;
	}

	generateHTML(): string {
		const httpDocs: RouteDoc[] = Object.entries(this.routes!)
			.filter(
				([, def]) =>
					typeof def === 'object' && ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].some((m) => m in def)
			)
			.flatMap(([path, def]) => this.extractRouteInfo(path, def as MethodHandlers));

		const wsDocs = this.extractWebSocketInfo();

		const docsData: DocsData = {
			http: httpDocs,
			websockets: wsDocs
		};

		return generateHTMLTemplate(docsData);
	}
}
