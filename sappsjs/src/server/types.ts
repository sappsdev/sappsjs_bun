import type { PaginatedResponse } from '../types';

export type Middleware = (req: EnhancedRequest, next: () => Promise<Response>) => Promise<Response>;

export interface RouteHandlerConfig {
	validJson?: Record<string, any>;
	validFormData?: Record<string, any>;
	state?: Record<string, any>;
	params?: Record<string, string>;
	query?: Record<string, any>;
}

export interface EnhancedRequest<
	TState = Record<string, any>,
	TValidJson = Record<string, any>,
	TValidFormData = Record<string, any>,
	TParams = Record<string, string>,
	TQuery = Record<string, any>
> extends Request {
	params: TParams;
	validJson: TValidJson;
	validFormData: TValidFormData;
	state: TState;
	query: TQuery;

	readonly ip: string;
	readonly bearerToken: string | null;
	readonly userAgent: string;
}

export type RouteHandler<C extends RouteHandlerConfig = {}> = (
	req: EnhancedRequest<C['state'], C['validJson'], C['validFormData'], C['params'], C['query']>
) => Response | Promise<Response>;

export type MethodHandler = RouteHandler<any> | [Middleware[], RouteHandler<any>];

export type MethodHandlers = Partial<
	Record<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS', MethodHandler>
>;

export type RouteDefinition = MethodHandlers | Bun.HTMLBundle;

export type Routes = Record<string, RouteDefinition>;

export interface CorsOptions {
	origin?: string | string[] | ((origin: string) => boolean);
	methods?: string[];
	allowedHeaders?: string[];
	exposedHeaders?: string[];
	credentials?: boolean;
	maxAge?: number;
}

export interface WebSocketHandler {
	message?: (ws: any, message: string | ArrayBuffer | Uint8Array) => void | Promise<void>;
	open?: (ws: any) => void | Promise<void>;
	close?: (ws: any, code: number, message: string) => void | Promise<void>;
	error?: (ws: any, error: Error) => void | Promise<void>;
	drain?: (ws: any) => void | Promise<void>;
}

export type WebSocket = WebSocketHandler | [Middleware[], WebSocketHandler];

export interface WebSocketGlobalConfig {
	perMessageDeflate?: boolean | object;
	idleTimeout?: number;
	maxPayloadLength?: number;
	backpressureLimit?: number;
	closeOnBackpressureLimit?: boolean;
	sendPings?: boolean;
	publishToSelf?: boolean;
}

export type WebSockets = Record<string, WebSocket> & {
	__global?: WebSocketGlobalConfig;
};

export interface StaticConfig {
	path: string;
	fallback?: string;
	index?: string;
	maxAge?: number;
	immutable?: boolean;
}

export type StaticRoute = StaticConfig | [Middleware[], StaticConfig];

export type StaticRoutes = Record<string, StaticRoute>;

export interface SappsConfig {
	port?: number;
	hostname?: string;
	development?: boolean;
	cors?: CorsOptions | boolean;
	globalMiddlewares?: Middleware[];
	routes?: Routes;
	websockets?: WebSockets;
	static?: StaticRoutes;
	notFound?: Response;
}

export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	pagination?: PaginatedResponse;
	error?: ErrorDetails;
	metadata?: ResponseMetadata;
}

export type ErrorCode =
	| 'VALIDATION_ERROR'
	| 'NOT_FOUND'
	| 'CONFLICT'
	| 'UNAUTHORIZED'
	| 'INTERNAL_SERVER_ERROR';

export interface ErrorDetails {
	message: string;
	code?: ErrorCode;
	details?: Record<string, any>;
}

export interface ResponseMetadata {
	timestamp?: string;
	requestId?: string;
	[key: string]: any;
}

export interface ResponseHeaders {
	[key: string]: string;
}

export interface ResponseOptions {
	pagination?: PaginatedResponse;
	headers?: ResponseHeaders;
	metadata?: ResponseMetadata;
}

export interface StreamOptions extends Omit<ResponseOptions, 'pagination'> {
	onClose?: () => void;
	onError?: (error: Error) => void;
}
