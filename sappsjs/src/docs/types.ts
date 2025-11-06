export interface PropertyInfo {
	type: string;
	format?: string;
	example?: any;
	rules: string[];
}

export interface FormDataPropertyInfo {
	type: string;
	isFile: boolean;
	isMultiple: boolean;
	format?: string;
	rules: string[];
	maxSize?: number;
	minSize?: number;
	mimeTypes?: string[];
	maxFiles?: number;
	minFiles?: number;
}

export interface BodySchema {
	type: 'object';
	required: string[];
	properties: Record<string, PropertyInfo>;
	example: Record<string, any>;
}

export interface FormDataSchema {
	type: 'formdata';
	required: string[];
	properties: Record<string, FormDataPropertyInfo>;
}

export interface QueryParamInfo {
	type: string;
	example: any;
	description?: string;
	optional?: boolean;
}

export interface RouteDoc {
	path: string;
	method: string;
	params?: string[];
	bodySchema?: BodySchema;
	formDataSchema?: FormDataSchema;
	middlewares?: string[];
	requiresBearer?: boolean;
	isPaginated?: boolean;
	queryParams?: Record<string, QueryParamInfo> | null;
	isStream?: boolean;
}

export interface WebSocketDoc {
	path: string;
	middlewares?: string[];
	requiresToken?: boolean;
	handlers: {
		open?: boolean;
		message?: boolean;
		close?: boolean;
		error?: boolean;
		drain?: boolean;
	};
}

export interface DocsData {
	http: RouteDoc[];
	websockets: WebSocketDoc[];
}
