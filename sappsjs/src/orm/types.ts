export type ColumnType =
	| 'SERIAL'
	| 'VARCHAR'
	| 'TEXT'
	| 'INTEGER'
	| 'BOOLEAN'
	| 'TIMESTAMP'
	| 'DECIMAL'
	| 'JSON'
	| 'JSONB'
	| 'MONEY'
	| 'ENUM';

export type Col = ColumnConfig | ForeignKeyConfig;

export interface ColumnConfig {
	type: ColumnType;
	primaryKey?: boolean;
	unique?: boolean;
	nullable?: boolean;
	default?: string | number | boolean;
	onUpdate?: 'CURRENT_TIMESTAMP';
	index?: boolean;
}

export interface ForeignKeyConfig extends ColumnConfig {
	references: {
		table: string;
		column: string;
	};
}

export interface EnumConfig<T extends string = string> extends ColumnConfig {
	type: 'ENUM';
	values: readonly T[];
	default?: T;
}

export interface IndexConfig {
	columns: string[];
	unique?: boolean;
	name?: string;
}

export interface RelationConfig {
	type: 'one-to-many' | 'many-to-one' | 'many-to-many';
	table: string;
	foreignKey?: string;
	localKey?: string;
}

export type IsSnakeCase<T extends string> = T extends ''
	? true
	: T extends `${infer First}_${infer Rest}`
		? IsSnakeCase<Rest>
		: T extends Lowercase<T>
			? true
			: false;

type SnakeCaseError<T extends string> =
	`⚠ Column name "${T}" must be in snake_case (e.g., "user_id" instead of "userId")`;

export type ValidateSnakeCase<T extends Record<string, any>> = {
	[K in keyof T]: K extends string
		? IsSnakeCase<K> extends true
			? T[K]
			: SnakeCaseError<K>
		: T[K];
};

export interface TableConfig {
	tableName: string;
	columns: Record<string, any>;
	indexes?: IndexConfig[];
	relations?: Record<string, RelationConfig>;
}

export interface ValidatedTableConfig {
	tableName: string;
	columns: Record<string, any>;
	indexes?: IndexConfig[];
	relations?: Record<string, RelationConfig>;
}

type ExtractConfig<T> = T extends { valueOf(): infer C } ? C : T;

type InferColumnType<T> = T extends { type: 'SERIAL' }
	? number
	: T extends { type: 'VARCHAR' | 'TEXT' }
		? string
		: T extends { type: 'INTEGER' }
			? number
			: T extends { type: 'BOOLEAN' }
				? boolean
				: T extends { type: 'TIMESTAMP' }
					? Date
					: T extends { type: 'DECIMAL' }
						? number
						: T extends { type: 'JSON' | 'JSONB' }
							? Record<string, any>
							: T extends { type: 'MONEY' }
								? string
								: T extends { type: 'ENUM'; values: readonly (infer E)[] }
									? E
									: never;

type InferNullable<T, Value> = T extends { nullable: true } ? Value | null : Value;

type InferColumns<T extends TableConfig> = {
	[K in keyof T['columns']]: InferNullable<
		ExtractConfig<T['columns'][K]>,
		InferColumnType<ExtractConfig<T['columns'][K]>>
	>;
};

export type InferTable<T extends TableConfig> = InferColumns<T>;

export type WithRelations<Base, Relations> = Base & Relations;

export type PaginatedResponse = {
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
};

export type PaginationOptions = {
	page?: number;
	pageSize?: number;
	sortBy?: string;
	sortOrder?: 'ASC' | 'DESC';
	search?: string;
};

export type WhereOperator =
	| '='
	| '!='
	| '>'
	| '<'
	| '>='
	| '<='
	| 'LIKE'
	| 'ILIKE'
	| 'IN'
	| 'NOT IN';

export interface WhereCondition {
	field: string;
	operator: WhereOperator;
	value: any;
	connector: 'AND' | 'OR';
}

export interface Relation {
	name: string;
	table: string;
	foreignKey: string;
	localKey: string;
	type: 'hasMany' | 'hasOne' | 'belongsTo';
	orderBy?: string;
}
