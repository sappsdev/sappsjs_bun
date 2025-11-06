import type { IndexConfig, TableConfig } from '../orm/types';

export function formatDefaultValue(value: string | number | boolean): string {
	if (typeof value === 'string') {
		if (value === 'CURRENT_TIMESTAMP' || value.toUpperCase().includes('CURRENT_')) {
			return value;
		}
		return `'${value}'`;
	}
	return String(value);
}

function generateEnumType(
	tableName: string,
	columnName: string,
	values: readonly string[]
): string {
	const enumName = `${tableName}_${columnName}_enum`;
	const enumValues = values.map((v) => `'${v}'`).join(', ');
	return `CREATE TYPE "${enumName}" AS ENUM (${enumValues});`;
}

function getEnumTypeName(tableName: string, columnName: string): string {
	return `${tableName}_${columnName}_enum`;
}

function generateUpdateTrigger(tableName: string, columnName: string): string {
	const functionName = `update_${tableName}_${columnName}`;
	const triggerName = `trigger_update_${tableName}_${columnName}`;

	return `
-- Function to update ${columnName} on row update
CREATE OR REPLACE FUNCTION ${functionName}()
RETURNS TRIGGER AS $$
BEGIN
  NEW."${columnName}" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update ${columnName}
CREATE TRIGGER ${triggerName}
  BEFORE UPDATE ON "${tableName}"
  FOR EACH ROW
  EXECUTE FUNCTION ${functionName}();`.trim();
}

function generateDropTrigger(tableName: string, columnName: string): string {
	const functionName = `update_${tableName}_${columnName}`;
	const triggerName = `trigger_update_${tableName}_${columnName}`;

	return `DROP TRIGGER IF EXISTS ${triggerName} ON "${tableName}";\nDROP FUNCTION IF EXISTS ${functionName}();`;
}

export function generateCreateTableSQL(schema: TableConfig): string {
	const enumStatements: string[] = [];
	const triggerStatements: string[] = [];

	Object.entries(schema.columns).forEach(([name, config]) => {
		if (config.type === 'ENUM' && 'values' in config && config.values) {
			enumStatements.push(generateEnumType(schema.tableName, name, config.values));
		}

		if ('onUpdate' in config && config.onUpdate === 'CURRENT_TIMESTAMP') {
			triggerStatements.push(generateUpdateTrigger(schema.tableName, name));
		}
	});

	const columnDefs = Object.entries(schema.columns)
		.map(([name, config]) => {
			let colType = config.type;

			if (config.type === 'ENUM') {
				colType = `"${getEnumTypeName(schema.tableName, name)}"`;
			}

			let def = `"${name}" ${colType}`;

			if (config.primaryKey) def += ' PRIMARY KEY';
			if (config.unique) def += ' UNIQUE';
			if (config.nullable === false) def += ' NOT NULL';
			if (config.default !== undefined) {
				def += ` DEFAULT ${formatDefaultValue(config.default)}`;
			}

			if ('references' in config && config.references) {
				def += ` REFERENCES "${config.references.table}"("${config.references.column}")`;
			}

			return def;
		})
		.join(',\n  ');

	let sql = '';

	if (enumStatements.length > 0) {
		sql = enumStatements.join('\n') + '\n\n';
	}

	sql += `CREATE TABLE IF NOT EXISTS "${schema.tableName}" (\n  ${columnDefs}\n);`;

	const allIndexes = collectIndexes(schema);

	allIndexes.forEach((idx) => {
		const cols = idx.columns.map((c) => `"${c}"`).join(', ');
		const unique = idx.unique ? 'UNIQUE ' : '';
		sql += `\nCREATE ${unique}INDEX IF NOT EXISTS "${idx.name}" ON "${schema.tableName}" (${cols});`;
	});

	if (triggerStatements.length > 0) {
		sql += '\n\n' + triggerStatements.join('\n\n');
	}

	return sql;
}

export function generateDropTableSQL(schema: TableConfig): string {
	let sql = '';

	Object.entries(schema.columns).forEach(([name, config]) => {
		if ('onUpdate' in config && config.onUpdate === 'CURRENT_TIMESTAMP') {
			sql += generateDropTrigger(schema.tableName, name) + '\n';
		}
	});

	sql = `DROP TABLE IF EXISTS "${schema.tableName}" CASCADE;`;

	Object.entries(schema.columns).forEach(([name, config]) => {
		if (config.type === 'ENUM') {
			const enumName = getEnumTypeName(schema.tableName, name);
			sql += `\nDROP TYPE IF EXISTS "${enumName}" CASCADE;`;
		}
	});

	return sql;
}

export function getColumnEnumType(tableName: string, columnName: string): string {
	return getEnumTypeName(tableName, columnName);
}

export function generateAddTriggerSQL(tableName: string, columnName: string): string {
	return generateUpdateTrigger(tableName, columnName);
}

export function generateRemoveTriggerSQL(tableName: string, columnName: string): string {
	return generateDropTrigger(tableName, columnName);
}

function collectIndexes(schema: TableConfig): IndexConfig[] {
	const indexes: IndexConfig[] = [];
	const autoIndexNames = new Set<string>();

	Object.entries(schema.columns).forEach(([columnName, config]) => {
		if (config.unique && !config.primaryKey) {
			const indexName = `idx_${schema.tableName}_${columnName}`;
			autoIndexNames.add(indexName);
			indexes.push({
				columns: [columnName],
				unique: true,
				name: indexName
			});
		}

		if (config.index) {
			const indexName = `idx_${schema.tableName}_${columnName}`;
			autoIndexNames.add(indexName);
			indexes.push({
				columns: [columnName],
				unique: false,
				name: indexName
			});
		}

		if ('references' in config && config.references) {
			const indexName = `idx_${schema.tableName}_${columnName}_fk`;
			autoIndexNames.add(indexName);
			indexes.push({
				columns: [columnName],
				unique: false,
				name: indexName
			});
		}
	});

	if (schema.indexes && schema.indexes.length > 0) {
		schema.indexes.forEach((idx) => {
			const idxName = idx.name || `idx_${schema.tableName}_${idx.columns.join('_')}`;

			if (!autoIndexNames.has(idxName)) {
				indexes.push({
					...idx,
					name: idxName
				});
			}
		});
	}

	return indexes;
}
