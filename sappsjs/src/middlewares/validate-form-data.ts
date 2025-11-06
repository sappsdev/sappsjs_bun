import type { Middleware } from '../types';
import { validateSchema } from '../utils/validate-schema';
import type { FileField, FormDataRules, ValidationRule } from './types';


const extractNumber = (rule: string): number => {
	const match = rule.match(/:(\d+)$/);
	return match ? parseInt(match[1]!, 10) : 0;
};

const extractValue = (rule: string): string => {
	const colonIndex = rule.indexOf(':');
	return colonIndex !== -1 ? rule.slice(colonIndex + 1) : '';
};

const parseMultipartFormData = async (
	request: Request
): Promise<{ fields: Record<string, string | string[]>; files: Record<string, FileField | FileField[]> }> => {
	const contentType = request.headers.get('content-type') || '';
	const boundary = contentType.split('boundary=')[1];

	if (!boundary) {
		throw new Error('Invalid multipart form data');
	}

	const fields: Record<string, string | string[]> = {};
	const files: Record<string, FileField | FileField[]> = {};

	const decoder = new TextDecoder();
	const reader = request.body?.getReader();

	if (!reader) {
		throw new Error('Request body is null');
	}

	let buffer = new Uint8Array(0);
	const boundaryBytes = new TextEncoder().encode(`--${boundary}`);
	const endBoundaryBytes = new TextEncoder().encode(`--${boundary}--`);

	while (true) {
		const { done, value } = await reader.read();

		if (done) break;

		const newBuffer = new Uint8Array(buffer.length + value.length);
		newBuffer.set(buffer);
		newBuffer.set(value, buffer.length);
		buffer = newBuffer;

		while (true) {
			const boundaryIndex = findBoundary(buffer, boundaryBytes);

			if (boundaryIndex === -1) break;

			const nextBoundaryIndex = findBoundary(
				buffer.slice(boundaryIndex + boundaryBytes.length),
				boundaryBytes
			);

			if (nextBoundaryIndex === -1) break;

			const partEnd = boundaryIndex + boundaryBytes.length + nextBoundaryIndex;
			const part = buffer.slice(boundaryIndex + boundaryBytes.length, partEnd);

			await processPart(part, fields, files, decoder);

			buffer = buffer.slice(partEnd);
		}
	}

	if (buffer.length > 0) {
		const endIndex = findBoundary(buffer, endBoundaryBytes);
		if (endIndex !== -1) {
			const part = buffer.slice(0, endIndex);
			await processPart(part, fields, files, decoder);
		}
	}

	return { fields, files };
};

const findBoundary = (buffer: Uint8Array, boundary: Uint8Array): number => {
	for (let i = 0; i <= buffer.length - boundary.length; i++) {
		let match = true;
		for (let j = 0; j < boundary.length; j++) {
			if (buffer[i + j] !== boundary[j]) {
				match = false;
				break;
			}
		}
		if (match) return i;
	}
	return -1;
};

const processPart = async (
	part: Uint8Array,
	fields: Record<string, string | string[]>,
	files: Record<string, FileField | FileField[]>,
	decoder: TextDecoder
): Promise<void> => {
	const headerEndIndex = findHeaderEnd(part);

	if (headerEndIndex === -1) return;

	const headerBytes = part.slice(0, headerEndIndex);
	const bodyBytes = part.slice(headerEndIndex + 4);

	const headers = decoder.decode(headerBytes);
	const dispositionMatch = headers.match(/Content-Disposition: form-data; name="([^"]+)"(?:; filename="([^"]+)")?/);

	if (!dispositionMatch) return;

	const fieldName = dispositionMatch[1]!;
	const filename = dispositionMatch[2];

	if (filename) {
		const contentTypeMatch = headers.match(/Content-Type: ([^\r\n]+)/);
		const contentType = contentTypeMatch ? contentTypeMatch[1]!.trim() : 'application/octet-stream';

		const fileData = bodyBytes.slice(0, -2); // Remover \r\n final
		const file = new File([fileData], filename, { type: contentType });

		const fileField: FileField = {
			file,
			name: filename,
			type: contentType,
			size: file.size,
		};

		if (files[fieldName]) {
			if (Array.isArray(files[fieldName])) {
				(files[fieldName] as FileField[]).push(fileField);
			} else {
				files[fieldName] = [files[fieldName] as FileField, fileField];
			}
		} else {
			files[fieldName] = fileField;
		}
	} else {
		const value = decoder.decode(bodyBytes.slice(0, -2)).trim();

		if (fields[fieldName]) {
			if (Array.isArray(fields[fieldName])) {
				(fields[fieldName] as string[]).push(value);
			} else {
				fields[fieldName] = [fields[fieldName] as string, value];
			}
		} else {
			fields[fieldName] = value;
		}
	}
};

const findHeaderEnd = (buffer: Uint8Array): number => {
	const pattern = new Uint8Array([13, 10, 13, 10]);

	for (let i = 0; i <= buffer.length - pattern.length; i++) {
		let match = true;
		for (let j = 0; j < pattern.length; j++) {
			if (buffer[i + j] !== pattern[j]) {
				match = false;
				break;
			}
		}
		if (match) return i;
	}

	return -1;
};

const validateFileField = (
	fieldName: string,
	fileData: FileField | FileField[] | undefined,
	rules: Array<{ rule: string; message: string }>
): string | null => {
	for (const { rule, message } of rules) {
		if (rule === 'required') {
			if (!fileData) return message;
		} else if (rule === 'file') {
			if (fileData && Array.isArray(fileData)) {
				return 'Expected single file, got multiple files';
			}
		} else if (rule === 'files') {
			if (fileData && !Array.isArray(fileData)) {
				return 'Expected multiple files, got single file';
			}
		} else if (rule.startsWith('maxSize:') && fileData) {
			const maxSize = extractNumber(rule);
			const files = Array.isArray(fileData) ? fileData : [fileData];

			for (const file of files) {
				if (file.size > maxSize) {
					return message;
				}
			}
		} else if (rule.startsWith('minSize:') && fileData) {
			const minSize = extractNumber(rule);
			const files = Array.isArray(fileData) ? fileData : [fileData];

			for (const file of files) {
				if (file.size < minSize) {
					return message;
				}
			}
		} else if (rule.startsWith('mimeType:') && fileData) {
			const allowedTypes = extractValue(rule).split(',').map(t => t.trim());
			const files = Array.isArray(fileData) ? fileData : [fileData];

			for (const file of files) {
				if (!allowedTypes.some(type => {
					if (type.endsWith('/*')) {
						return file.type.startsWith(type.slice(0, -1));
					}
					return file.type === type;
				})) {
					return message;
				}
			}
		} else if (rule.startsWith('maxFiles:') && fileData) {
			const maxFiles = extractNumber(rule);
			if (Array.isArray(fileData) && fileData.length > maxFiles) {
				return message;
			}
		} else if (rule.startsWith('minFiles:') && fileData) {
			const minFiles = extractNumber(rule);
			if (Array.isArray(fileData) && fileData.length < minFiles) {
				return message;
			}
		}
	}

	return null;
};

export const validateFormData = (schema: FormDataRules): Middleware => {
	const middleware: Middleware = async (req, next) => {
		try {
			const { fields, files } = await parseMultipartFormData(req);

			const errors: Record<string, string> = {};
			const validatedData: Record<string, any> = {};

			for (const [fieldName, fieldRules] of Object.entries(schema)) {
				const isFileField = fieldRules.some(
					r => r.rule === 'file' || r.rule === 'files' || r.rule.startsWith('maxSize:') ||
					     r.rule.startsWith('minSize:') || r.rule.startsWith('mimeType:')
				);

				if (isFileField) {
					const fileData = files[fieldName];
					const error = validateFileField(fieldName, fileData, fieldRules);

					if (error) {
						errors[fieldName] = error;
					} else if (fileData) {
						validatedData[fieldName] = fileData;
					}
				} else {
					const fieldValue = fields[fieldName];
					const bodyForValidation = { [fieldName]: fieldValue };

					const textFieldRules = fieldRules.filter(r => {
						const rule = r.rule;
						return !rule.startsWith('maxSize:') &&
						       !rule.startsWith('minSize:') &&
						       !rule.startsWith('mimeType:') &&
						       !rule.startsWith('maxFiles:') &&
						       !rule.startsWith('minFiles:') &&
						       rule !== 'file' &&
						       rule !== 'files';
					}) as ValidationRule[];

					const fieldErrors = validateSchema(bodyForValidation, { [fieldName]: textFieldRules });

					if (Object.keys(fieldErrors).length > 0) {
						errors[fieldName] = fieldErrors[fieldName]!;
					} else if (fieldValue !== undefined) {
						validatedData[fieldName] = fieldValue;
					}
				}
			}

			if (Object.keys(errors).length > 0) {
				return Response.json({ errors }, { status: 400 });
			}

			req.validFormData = validatedData;

			return next();
		} catch (error) {
			return Response.json(
				{ error: 'Invalid form data', details: error instanceof Error ? error.message : 'Unknown error' },
				{ status: 400 }
			);
		}
	};

	(middleware as any).__formSchema = schema;
	return middleware;
};
