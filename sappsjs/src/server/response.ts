import type { ApiResponse, ErrorCode, ResponseOptions, StreamOptions } from './types';

const statusCodes: Record<ErrorCode, number> = {
	VALIDATION_ERROR: 400,
	NOT_FOUND: 404,
	CONFLICT: 409,
	UNAUTHORIZED: 401,
	INTERNAL_SERVER_ERROR: 500
};

export function ResponseJson<T>(
	data: T,
	status: number = 200,
	options?: ResponseOptions
): Response {
	const body: ApiResponse<T> = {
		success: true,
		data,
		metadata: {
			timestamp: new Date().toISOString(),
			...options?.metadata
		}
	};

	if (options?.pagination) {
		body.pagination = options.pagination;
	}

	return Response.json(body, {
		status,
		headers: options?.headers
	});
}

export const ResponseError = <T>(
	appError: AppError | Error,
	options?: ResponseOptions
): Response => {
	const isAppError = (appError as AppError).isAppError === true;
	const typedError = appError as AppError;

	const status = isAppError ? statusCodes[typedError.code] || 500 : 500;
	const message = isAppError ? appError.message : 'Internal Server Error';
	const code = isAppError ? typedError.code : 'INTERNAL_SERVER_ERROR';
	const details = isAppError ? typedError.details : undefined;

	const body: ApiResponse<T> = {
		success: false,
		error: {
			message,
			code,
			details
		},
		metadata: {
			timestamp: new Date().toISOString(),
			...options?.metadata
		}
	};

	return Response.json(body, {
		status,
		headers: options?.headers
	});
};

export async function respond<T>(
	fn: () => Promise<T>,
	options?: ResponseOptions
): Promise<Response> {
	try {
		const data = await fn();
		return ResponseJson(data, 200, options);
	} catch (error) {
		if (process.env.NODE_ENV !== 'production') {
			console.error('Error in respond:', error);
		}
		if ((error as AppError).isAppError === true) {
			return ResponseError(error as AppError, options);
		}
		const err = error instanceof Error ? error : new Error(String(error));
		return ResponseError(err, options);
	}
}

export async function respondPaginated<T>(
	fn: () => Promise<[T, any]>,
	options?: Omit<ResponseOptions, 'pagination'>
): Promise<Response> {
	try {
		const [data, pagination] = await fn();
		return ResponseJson(data, 200, { ...options, pagination });
	} catch (error) {
		if (process.env.NODE_ENV !== 'production') {
			console.error('Error in respondPaginated:', error);
		}
		if ((error as AppError).isAppError === true) {
			return ResponseError(error as AppError, options);
		}
		const err = error instanceof Error ? error : new Error(String(error));
		return ResponseError(err, options);
	}
}

export async function respondStream(
	fn: (controller: ReadableStreamDirectController) => Promise<void> | void,
	options?: StreamOptions
): Promise<Response> {
	const stream = new ReadableStream({
		type: 'direct',
		async pull(controller) {
			try {
				await fn(controller);
			} catch (error) {
				if (process.env.NODE_ENV !== 'production') {
					console.error('Error in respondStream:', error);
				}

				const errorMessage = error instanceof Error ? error.message : 'Stream error occurred';

				controller.write(
					`data: ${JSON.stringify({
						error: errorMessage,
						code: 'STREAM_ERROR'
					})}\n\n`
				);

				if (options?.onError) {
					const err = error instanceof Error ? error : new Error(String(error));
					options.onError(err);
				}

				controller.close();
			}
		}
	});

	const headers = new Headers({
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		Connection: 'keep-alive',
		...options?.headers
	});

	return new Response(stream, { headers });
}

export async function respondStreamWithCleanup(
	fn: (controller: ReadableStreamDirectController, signal: AbortSignal) => Promise<void> | void,
	req: Request,
	options?: StreamOptions
): Promise<Response> {
	return respondStream(async (controller) => {
		const cleanup = () => {
			if (options?.onClose) {
				options.onClose();
			}
			controller.close();
		};

		req.signal.addEventListener('abort', cleanup);

		try {
			await fn(controller, req.signal);
		} finally {
			req.signal.removeEventListener('abort', cleanup);
		}
	}, options);
}

export class AppError {
	public readonly message: string;
	public readonly code: ErrorCode;
	public readonly details?: Record<string, any>;
	public readonly isAppError = true;

	constructor(code: ErrorCode, message: string, details?: Record<string, any>) {
		this.message = message;
		this.code = code;
		this.details = details;
	}
}
