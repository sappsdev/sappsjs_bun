
import type { Middleware } from '../server/types';
import { validateSchema } from '../utils/validate-schema';
import type { JsonRules } from './types';

export const validateJson = (schema: JsonRules): Middleware => {
	const middleware: Middleware = async (req, next) => {
		const body = await req.json();

		if (!body) {
			return Response.json({ error: 'Body is required' }, { status: 400 });
		}

		const errors = validateSchema(body, schema);

		if (Object.keys(errors).length > 0) {
			return Response.json({ errors }, { status: 400 });
		}

		req.validJson = body;

		return next();
	};

	(middleware as any).__schema = schema;
	return middleware;
};
