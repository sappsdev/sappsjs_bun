import type { ColumnConfig, ForeignKeyConfig, TableConfig } from '../orm/types';

export function normalizeColumn(col: any): ColumnConfig | ForeignKeyConfig {
	if (col && typeof col === 'object' && 'valueOf' in col && typeof col.valueOf === 'function') {
		return col.valueOf();
	}
	return col;
}

export function normalizeSchema(schema: any): TableConfig {
	if (!schema || typeof schema !== 'object') return schema;

	if (!schema.tableName) {
		throw new Error('Schema must have a tableName property');
	}

	if (!schema.columns || typeof schema.columns !== 'object') {
		throw new Error(`Schema "${schema.tableName}" must have a columns property`);
	}

	return {
		...schema,
		columns: Object.fromEntries(
			Object.entries(schema.columns).map(([key, col]) => [key, normalizeColumn(col)])
		)
	};
}

export function extractDependencies(schema: TableConfig): string[] {
	const dependencies: string[] = [];

	Object.entries(schema.columns).forEach(([columnName, config]) => {
		if ('references' in config && config.references) {
			const ref = config.references;

			if (!ref.table) {
				throw new Error(
					`Invalid foreign key reference in table "${schema.tableName}", column "${columnName}".\n` +
						`   Reference must have a "table" property.`
				);
			}

			const referencedTable = ref.table;

			if (referencedTable !== schema.tableName) {
				dependencies.push(referencedTable);
			}
		}
	});

	return [...new Set(dependencies)];
}
