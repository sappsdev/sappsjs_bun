export type ValidationRuleType =
	| 'email'
	| 'required'
	| `min:${number}`
	| `max:${number}`
	| 'url'
	| 'phone'
	| `pattern:${string}`
	| 'alphanumeric'
	| 'numeric'
	| 'alpha'
	| `matches:${string}`
	| `custom:${string}`
	| 'strongPassword'
	| 'creditCard'
	| 'date'
	| `minWords:${number}`
	| `maxWords:${number}`;

export interface ValidationRule {
	rule: ValidationRuleType;
	message: string;
}

export interface JsonRules {
	[field: string]: ValidationRule[];
}

type IsRequired<Rules extends readonly ValidationRule[]> = Rules extends readonly [
	infer First extends ValidationRule,
	...infer Rest extends ValidationRule[]
]
	? First['rule'] extends 'required'
		? true
		: IsRequired<Rest>
	: false;

type InferFieldType<Rules extends readonly ValidationRule[]> = Rules extends readonly [
	infer First extends ValidationRule,
	...infer Rest extends ValidationRule[]
]
	? First['rule'] extends 'numeric'
		? number
		: First['rule'] extends
					| 'email'
					| 'url'
					| 'phone'
					| 'alpha'
					| 'alphanumeric'
					| 'strongPassword'
					| 'creditCard'
					| 'date'
			? string
			: First['rule'] extends
						| `min:${number}`
						| `max:${number}`
						| `pattern:${string}`
						| `minWords:${number}`
						| `maxWords:${number}`
				? string
				: First['rule'] extends `matches:${string}`
					? string
					: InferFieldType<Rest>
	: string;

type InferField<Rules extends readonly ValidationRule[]> =
	IsRequired<Rules> extends true ? InferFieldType<Rules> : InferFieldType<Rules> | undefined;

export type InferJson<T extends JsonRules> = {
	-readonly [K in keyof T]: InferField<T[K]>;
};

export interface FileField {
	file: File;
	name: string;
	type: string;
	size: number;
}

export type FileValidationRuleType =
	| 'file'
	| 'files'
	| `maxSize:${number}`
	| `minSize:${number}`
	| `mimeType:${string}`
	| `maxFiles:${number}`
	| `minFiles:${number}`;

export interface FormDataValidationRule {
		rule: ValidationRule['rule'] | FileValidationRuleType;
		message: string;
}

export interface FormDataRules {
		[field: string]: FormDataValidationRule[];
}

type IsFileField<Rules extends readonly any[]> = Rules extends readonly [
	infer First,
	...infer Rest
]
	? First extends { rule: 'file' | 'files' | `maxSize:${number}` | `minSize:${number}` | `mimeType:${string}` }
		? true
		: IsFileField<Rest>
	: false;

type IsMultipleFiles<Rules extends readonly any[]> = Rules extends readonly [
	infer First,
	...infer Rest
]
	? First extends { rule: 'files' }
		? true
		: IsMultipleFiles<Rest>
	: false;

type IsRequiredForm<Rules extends readonly any[]> = Rules extends readonly [
	infer First,
	...infer Rest
]
	? First extends { rule: 'required' }
		? true
		: IsRequiredForm<Rest>
	: false;

type InferFormDataField<Rules extends readonly any[]> =
	IsFileField<Rules> extends true
		? IsMultipleFiles<Rules> extends true
			? FileField[]
			: FileField
		: string;

type InferFormDataFieldWithRequired<Rules extends readonly any[]> =
	IsRequiredForm<Rules> extends true
		? InferFormDataField<Rules>
		: InferFormDataField<Rules> | undefined;

export type InferFormData<T extends FormDataRules> = {
	-readonly [K in keyof T]: InferFormDataFieldWithRequired<T[K]>;
};
