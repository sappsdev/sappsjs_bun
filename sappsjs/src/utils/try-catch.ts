import type { AppError } from '../server/response';

export async function tryCatch<T>(
	fn: () => Promise<T>
): Promise<[T | null, AppError | Error | null]> {
	try {
		const data = await fn();
		return [data, null];
	} catch (error) {
		if (process.env.NODE_ENV !== 'production') {
			console.error('Error in tryCatch:', error);
		}
		if ((error as AppError).isAppError === true) {
			return [null, error as AppError];
		}
		const err = error instanceof Error ? error : new Error(String(error));
		return [null, err];
	}
}
