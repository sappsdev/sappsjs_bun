import type { IndexConfig, RelationConfig, TableConfig, ValidateSnakeCase } from './types';

export function defineTable<T extends TableConfig>(
	schema: T & { columns: ValidateSnakeCase<T['columns']> }
): T {
	return schema as T;
}

export function index(
	columns: string[],
	options?: { name?: string; unique?: boolean }
): IndexConfig {
	return {
		columns,
		unique: options?.unique,
		name: options?.name
	};
}

export function uniqueIndex(columns: string[], name?: string): IndexConfig {
	return {
		columns,
		unique: true,
		name
	};
}

export function inferForeignKey(tableName: string): string {
	const singular = tableName.endsWith('s') ? tableName.slice(0, -1) : tableName;
	return `${singular}Id`;
}

export function normalizeRelation(
	relation: RelationConfig,
	sourceTable: string
): Required<RelationConfig> {
	return {
		type: relation.type,
		table: relation.table,
		foreignKey: relation.foreignKey || inferForeignKey(sourceTable),
		localKey: relation.localKey || 'id'
	};
}

export function hasMany(table: string, opts?: Partial<Omit<RelationConfig, 'type'>>) {
	return { type: 'one-to-many' as const, table, ...opts };
}

export function belongsTo(table: string, opts?: Partial<Omit<RelationConfig, 'type'>>) {
	return { type: 'many-to-one' as const, table, ...opts };
}

export function manyToMany(table: string, opts?: Partial<Omit<RelationConfig, 'type'>>) {
	return { type: 'many-to-many' as const, table, ...opts };
}
