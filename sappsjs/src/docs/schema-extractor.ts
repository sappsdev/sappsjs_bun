import type { FormDataRules, JsonRules } from '../middlewares/types';

export interface SchemaInfo {
	required: string[];
	properties: Record<string, PropertyInfo>;
}

export interface PropertyInfo {
	type: string;
	format?: string;
	example?: any;
	rules: string[];
}

export interface FormDataSchemaInfo {
	required: string[];
	properties: Record<string, FormDataPropertyInfo>;
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

const extractNumber = (rule: string): number => {
	const match = rule.match(/:(\d+)$/);
	return match ? parseInt(match[1]!, 10) : 0;
};

const extractValue = (rule: string): string => {
	const colonIndex = rule.indexOf(':');
	return colonIndex !== -1 ? rule.slice(colonIndex + 1) : '';
};

export function extractSchemaInfo(rules: JsonRules): SchemaInfo {
	const required: string[] = [];
	const properties: Record<string, PropertyInfo> = {};

	for (const [field, fieldRules] of Object.entries(rules)) {
		const ruleStrings: string[] = [];
		let isRequired = false;
		let type = 'string';
		let format: string | undefined;
		let example: any;

		for (const { rule } of fieldRules) {
			ruleStrings.push(rule);

			if (rule === 'required') {
				isRequired = true;
			} else if (rule === 'email') {
				format = 'email';
				example = 'user@example.com';
			} else if (rule === 'url') {
				format = 'url';
				example = 'https://example.com';
			} else if (rule === 'phone') {
				format = 'phone';
				example = '+1234567890';
			} else if (rule === 'numeric') {
				type = 'number';
				example = 123;
			} else if (rule === 'date') {
				format = 'date';
				example = '2024-01-01';
			} else if (rule === 'creditCard') {
				format = 'creditCard';
				example = '4111111111111111';
			} else if (rule === 'strongPassword') {
				format = 'password';
				example = 'MyP@ssw0rd!';
			} else if (rule.startsWith('min:')) {
				const minLength = parseInt(rule.split(':')[1] || '0', 10);
				if (!example) {
					example = 'a'.repeat(minLength);
				}
			}
		}

		if (isRequired) {
			required.push(field);
		}

		if (!example) {
			example = type === 'number' ? 0 : 'string';
		}

		properties[field] = {
			type,
			format,
			example,
			rules: ruleStrings
		};
	}

	return { required, properties };
}

export function extractFormDataSchemaInfo(rules: FormDataRules): FormDataSchemaInfo {
	const required: string[] = [];
	const properties: Record<string, FormDataPropertyInfo> = {};

	for (const [field, fieldRules] of Object.entries(rules)) {
		const ruleStrings: string[] = [];
		let isRequired = false;
		let isFile = false;
		let isMultiple = false;
		let type = 'string';
		let format: string | undefined;
		let maxSize: number | undefined;
		let minSize: number | undefined;
		let mimeTypes: string[] | undefined;
		let maxFiles: number | undefined;
		let minFiles: number | undefined;

		for (const { rule } of fieldRules) {
			ruleStrings.push(rule);

			if (rule === 'required') {
				isRequired = true;
			} else if (rule === 'file') {
				isFile = true;
				type = 'file';
			} else if (rule === 'files') {
				isFile = true;
				isMultiple = true;
				type = 'file';
			} else if (rule.startsWith('maxSize:')) {
				maxSize = extractNumber(rule);
			} else if (rule.startsWith('minSize:')) {
				minSize = extractNumber(rule);
			} else if (rule.startsWith('mimeType:')) {
				mimeTypes = extractValue(rule).split(',').map(t => t.trim());
			} else if (rule.startsWith('maxFiles:')) {
				maxFiles = extractNumber(rule);
			} else if (rule.startsWith('minFiles:')) {
				minFiles = extractNumber(rule);
			} else if (rule === 'email') {
				format = 'email';
			} else if (rule === 'url') {
				format = 'url';
			} else if (rule === 'phone') {
				format = 'phone';
			} else if (rule === 'numeric') {
				type = 'number';
			} else if (rule === 'date') {
				format = 'date';
			}
		}

		if (isRequired) {
			required.push(field);
		}

		properties[field] = {
			type,
			isFile,
			isMultiple,
			format,
			rules: ruleStrings,
			maxSize,
			minSize,
			mimeTypes,
			maxFiles,
			minFiles
		};
	}

	return { required, properties };
}

export function generateExampleFromSchema(rules: JsonRules): Record<string, any> {
	const schema = extractSchemaInfo(rules);
	const example: Record<string, any> = {};

	for (const [field, property] of Object.entries(schema.properties)) {
		example[field] = property.example;
	}

	return example;
}

export function generateSchemaDocumentation(rules: JsonRules): string {
	const schema = extractSchemaInfo(rules);
	let doc = '### Request Body Schema\n\n';

	doc += '| Field | Type | Required | Format | Rules |\n';
	doc += '|-------|------|----------|--------|-------|\n';

	for (const [field, property] of Object.entries(schema.properties)) {
		const isRequired = schema.required.includes(field);
		const format = property.format || '-';
		const rules = property.rules.join(', ') || '-';

		doc += `| ${field} | ${property.type} | ${isRequired ? 'Yes' : 'No'} | ${format} | ${rules} |\n`;
	}

	return doc;
}
