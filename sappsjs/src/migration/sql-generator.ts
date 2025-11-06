import type { TableConfig } from '../orm/types';
import type { SchemaChange, ColumnChange } from './types';
import {
	generateCreateTableSQL,
	generateDropTableSQL,
	formatDefaultValue,
	getColumnEnumType,
	generateAddTriggerSQL,
	generateRemoveTriggerSQL
} from './generators';
import { sortSchemasByDependencies, sortSchemasForDrop } from './dependency-graph';
import { generateTypeChangeSQL } from './column-analyzer';

function generateEnumType(
	tableName: string,
	columnName: string,
	values: readonly string[]
): string {
	const enumName = getColumnEnumType(tableName, columnName);
	const enumValues = values.map((v) => `'${v}'`).join(', ');
	return `CREATE TYPE "${enumName}" AS ENUM (${enumValues});`;
}

export function generateMigrationSQL(
	changes: SchemaChange[],
	schemas: Record<string, TableConfig>,
	oldSchemas?: Record<string, TableConfig>
): { up: string; down: string; warnings: string[] } {
	const upStatements: string[] = [];
	const downStatements: string[] = [];
	const warnings: string[] = [];

	const createChanges = changes.filter((c) => c.type === 'create');
	const dropChanges = changes.filter((c) => c.type === 'drop');
	const alterChanges = changes.filter((c) => c.type === 'alter');

	if (createChanges.length > 0) {
		const schemasToCreate = Object.fromEntries(
			createChanges.map((c) => [c.tableName, schemas[c.tableName]]).filter(([_, s]) => s)
		);

		try {
			const sortedSchemas = sortSchemasByDependencies(schemasToCreate);

			for (const schema of sortedSchemas) {
				upStatements.push(generateCreateTableSQL(schema));
				downStatements.unshift(generateDropTableSQL(schema));
			}
		} catch (error) {
			console.error('Error sorting schemas:', error);
			for (const change of createChanges) {
				const schema = schemas[change.tableName];
				if (schema) {
					upStatements.push(generateCreateTableSQL(schema));
					downStatements.unshift(generateDropTableSQL(schema));
				}
			}
		}
	}

	if (dropChanges.length > 0 && oldSchemas) {
		const schemasToDrop = Object.fromEntries(
			dropChanges.map((c) => [c.tableName, oldSchemas[c.tableName]]).filter(([_, s]) => s)
		);

		try {
			const sortedSchemas = sortSchemasForDrop(schemasToDrop);

			for (const schema of sortedSchemas) {
				upStatements.push(generateDropTableSQL(schema));
				downStatements.unshift(generateCreateTableSQL(schema));
			}
		} catch (error) {
			console.error('Error sorting schemas for drop:', error);
			for (const change of dropChanges) {
				const oldSchema = oldSchemas[change.tableName];
				if (oldSchema) {
					upStatements.push(generateDropTableSQL(oldSchema));
					downStatements.unshift(generateCreateTableSQL(oldSchema));
				} else {
					upStatements.push(`DROP TABLE IF EXISTS "${change.tableName}" CASCADE;`);
					downStatements.unshift('-- Cannot recreate dropped table without schema');
				}
			}
		}
	}

	for (const change of alterChanges) {
		if (change.type !== 'alter' || !change.changes) continue;

		const schema = schemas[change.tableName];
		if (!schema) continue;

		for (const colName of change.changes.addedColumns || []) {
			const colConfig = schema.columns[colName];
			if (!colConfig) continue;

			if (colConfig.type === 'ENUM' && 'values' in colConfig && colConfig.values) {
				upStatements.push(generateEnumType(change.tableName, colName, colConfig.values));
				const enumName = getColumnEnumType(change.tableName, colName);
				downStatements.unshift(`DROP TYPE IF EXISTS "${enumName}" CASCADE;`);
			}

			let colType = colConfig.type;
			if (colConfig.type === 'ENUM') {
				colType = `"${getColumnEnumType(change.tableName, colName)}"`;
			}

			let def = `"${colName}" ${colType}`;
			if (colConfig.nullable === false) def += ' NOT NULL';
			if (colConfig.default !== undefined) {
				def += ` DEFAULT ${formatDefaultValue(colConfig.default)}`;
			}
			if (colConfig.unique) def += ' UNIQUE';

			upStatements.push(`ALTER TABLE "${change.tableName}" ADD COLUMN ${def};`);

			if ('onUpdate' in colConfig && colConfig.onUpdate === 'CURRENT_TIMESTAMP') {
				upStatements.push(generateAddTriggerSQL(change.tableName, colName));
				downStatements.unshift(generateRemoveTriggerSQL(change.tableName, colName));
			}

			if (colConfig.type === 'ENUM') {
				downStatements.unshift(`ALTER TABLE "${change.tableName}" DROP COLUMN "${colName}";`);
			} else {
				downStatements.unshift(`ALTER TABLE "${change.tableName}" DROP COLUMN "${colName}";`);
			}
		}

		for (const modification of (change.changes.modifiedColumns as ColumnChange[]) || []) {
			const { columnName, oldConfig, newConfig, changeType } = modification;

			if (changeType === 'mixed') {
				warnings.push(
					`⚠️  Column "${columnName}" in table "${change.tableName}" has multiple changes (type, constraints, references). ` +
						`Consider breaking this into multiple migrations.`
				);
			}

			const typeChanged = oldConfig.type !== newConfig.type;
			const enumValuesChanged =
				oldConfig.type === 'ENUM' &&
				newConfig.type === 'ENUM' &&
				'values' in oldConfig &&
				'values' in newConfig &&
				JSON.stringify(oldConfig.values) !== JSON.stringify(newConfig.values);

			if (typeChanged || enumValuesChanged) {
				if (enumValuesChanged && !typeChanged) {
					const enumName = getColumnEnumType(change.tableName, columnName);
					const oldValues = ('values' in oldConfig ? oldConfig.values : []) as readonly string[];
					const newValues = ('values' in newConfig ? newConfig.values : []) as readonly string[];

					const addedValues = newValues.filter((v) => !oldValues.includes(v));
					const removedValues = oldValues.filter((v) => !newValues.includes(v));

					if (removedValues.length > 0) {
						warnings.push(
							`⚠️  ENUM values removed from "${columnName}" in table "${change.tableName}": ${removedValues.join(', ')}. ` +
								`Existing data with these values will cause migration to fail.`
						);
					}

					const tempEnumName = `${enumName}_new`;
					const enumValuesList = newValues.map((v) => `'${v}'`).join(', ');
					const oldEnumValuesList = oldValues.map((v) => `'${v}'`).join(', ');

					upStatements.push(
						`-- Recreate ENUM type with new values`,
						`CREATE TYPE "${tempEnumName}" AS ENUM (${enumValuesList});`,
						`ALTER TABLE "${change.tableName}" ALTER COLUMN "${columnName}" TYPE "${tempEnumName}" USING "${columnName}"::text::"${tempEnumName}";`,
						`DROP TYPE "${enumName}";`,
						`ALTER TYPE "${tempEnumName}" RENAME TO "${enumName}";`
					);

					downStatements.unshift(
						`-- Revert ENUM type to old values`,
						`CREATE TYPE "${tempEnumName}" AS ENUM (${oldEnumValuesList});`,
						`ALTER TABLE "${change.tableName}" ALTER COLUMN "${columnName}" TYPE "${tempEnumName}" USING "${columnName}"::text::"${tempEnumName}";`,
						`DROP TYPE "${enumName}";`,
						`ALTER TYPE "${tempEnumName}" RENAME TO "${enumName}";`
					);

					if (addedValues.length > 0) {
						warnings.push(
							`ℹ️  ENUM values added to "${columnName}" in table "${change.tableName}": ${addedValues.join(', ')}`
						);
					}
				} else if (
					newConfig.type === 'ENUM' &&
					oldConfig.type !== 'ENUM' &&
					'values' in newConfig &&
					newConfig.values
				) {
					const enumName = getColumnEnumType(change.tableName, columnName);
					const newValues = newConfig.values as readonly string[];
					upStatements.push(generateEnumType(change.tableName, columnName, newValues));
					upStatements.push(
						`ALTER TABLE "${change.tableName}" ALTER COLUMN "${columnName}" TYPE "${enumName}" USING "${columnName}"::text::"${enumName}";`
					);
					downStatements.unshift(
						`ALTER TABLE "${change.tableName}" ALTER COLUMN "${columnName}" TYPE ${oldConfig.type};`,
						`DROP TYPE IF EXISTS "${enumName}" CASCADE;`
					);
					warnings.push(
						`⚠️  Column "${columnName}" in table "${change.tableName}" is being converted to ENUM. Ensure existing data matches the allowed values.`
					);
				} else if (oldConfig.type === 'ENUM' && newConfig.type !== 'ENUM') {
					const enumName = getColumnEnumType(change.tableName, columnName);
					upStatements.push(
						`ALTER TABLE "${change.tableName}" ALTER COLUMN "${columnName}" TYPE ${newConfig.type} USING "${columnName}"::text;`,
						`DROP TYPE IF EXISTS "${enumName}" CASCADE;`
					);
					if ('values' in oldConfig && oldConfig.values) {
						const oldValues = oldConfig.values as readonly string[];
						downStatements.unshift(
							generateEnumType(change.tableName, columnName, oldValues),
							`ALTER TABLE "${change.tableName}" ALTER COLUMN "${columnName}" TYPE "${enumName}" USING "${columnName}"::text::"${enumName}";`
						);
					}
				} else if (typeChanged) {
					const typeChange = generateTypeChangeSQL(
						change.tableName,
						columnName,
						oldConfig.type,
						newConfig.type
					);

					upStatements.push(typeChange.up);
					downStatements.unshift(typeChange.down);

					if (typeChange.warning) {
						warnings.push(typeChange.warning);
					}
				}
			}

			const oldHasOnUpdate = 'onUpdate' in oldConfig && oldConfig.onUpdate === 'CURRENT_TIMESTAMP';
			const newHasOnUpdate = 'onUpdate' in newConfig && newConfig.onUpdate === 'CURRENT_TIMESTAMP';

			if (!oldHasOnUpdate && newHasOnUpdate) {
				upStatements.push(generateAddTriggerSQL(change.tableName, columnName));
				downStatements.unshift(generateRemoveTriggerSQL(change.tableName, columnName));
				warnings.push(
					`ℹ️  Auto-update trigger added to "${columnName}" in table "${change.tableName}". Column will be updated to CURRENT_TIMESTAMP on every row update.`
				);
			} else if (oldHasOnUpdate && !newHasOnUpdate) {
				upStatements.push(generateRemoveTriggerSQL(change.tableName, columnName));
				downStatements.unshift(generateAddTriggerSQL(change.tableName, columnName));
				warnings.push(
					`ℹ️  Auto-update trigger removed from "${columnName}" in table "${change.tableName}".`
				);
			}

			if (oldConfig.nullable !== newConfig.nullable) {
				if (newConfig.nullable === false) {
					upStatements.push(
						`ALTER TABLE "${change.tableName}" ALTER COLUMN "${columnName}" SET NOT NULL;`
					);
					downStatements.unshift(
						`ALTER TABLE "${change.tableName}" ALTER COLUMN "${columnName}" DROP NOT NULL;`
					);
				} else {
					upStatements.push(
						`ALTER TABLE "${change.tableName}" ALTER COLUMN "${columnName}" DROP NOT NULL;`
					);
					downStatements.unshift(
						`ALTER TABLE "${change.tableName}" ALTER COLUMN "${columnName}" SET NOT NULL;`
					);
				}
			}

			if (oldConfig.default !== newConfig.default) {
				if (newConfig.default !== undefined) {
					upStatements.push(
						`ALTER TABLE "${change.tableName}" ALTER COLUMN "${columnName}" SET DEFAULT ${formatDefaultValue(newConfig.default)};`
					);
				} else {
					upStatements.push(
						`ALTER TABLE "${change.tableName}" ALTER COLUMN "${columnName}" DROP DEFAULT;`
					);
				}

				if (oldConfig.default !== undefined) {
					downStatements.unshift(
						`ALTER TABLE "${change.tableName}" ALTER COLUMN "${columnName}" SET DEFAULT ${formatDefaultValue(oldConfig.default)};`
					);
				} else {
					downStatements.unshift(
						`ALTER TABLE "${change.tableName}" ALTER COLUMN "${columnName}" DROP DEFAULT;`
					);
				}
			}

			const oldHasRef = 'references' in oldConfig && oldConfig.references;
			const newHasRef = 'references' in newConfig && newConfig.references;

			if (oldHasRef && !newHasRef) {
				const constraintName = `fk_${change.tableName}_${columnName}`;
				upStatements.push(
					`ALTER TABLE "${change.tableName}" DROP CONSTRAINT IF EXISTS "${constraintName}";`
				);
				downStatements.unshift(
					`ALTER TABLE "${change.tableName}" ADD CONSTRAINT "${constraintName}" ` +
						`FOREIGN KEY ("${columnName}") REFERENCES "${oldConfig.references.table}"("${oldConfig.references.column}");`
				);
			} else if (!oldHasRef && newHasRef) {
				const constraintName = `fk_${change.tableName}_${columnName}`;
				upStatements.push(
					`ALTER TABLE "${change.tableName}" ADD CONSTRAINT "${constraintName}" ` +
						`FOREIGN KEY ("${columnName}") REFERENCES "${newConfig.references.table}"("${newConfig.references.column}");`
				);
				downStatements.unshift(
					`ALTER TABLE "${change.tableName}" DROP CONSTRAINT IF EXISTS "${constraintName}";`
				);
			} else if (
				oldHasRef &&
				newHasRef &&
				JSON.stringify(oldConfig.references) !== JSON.stringify(newConfig.references)
			) {
				const constraintName = `fk_${change.tableName}_${columnName}`;
				upStatements.push(
					`ALTER TABLE "${change.tableName}" DROP CONSTRAINT IF EXISTS "${constraintName}";`,
					`ALTER TABLE "${change.tableName}" ADD CONSTRAINT "${constraintName}" ` +
						`FOREIGN KEY ("${columnName}") REFERENCES "${newConfig.references.table}"("${newConfig.references.column}");`
				);
				downStatements.unshift(
					`ALTER TABLE "${change.tableName}" DROP CONSTRAINT IF EXISTS "${constraintName}";`,
					`ALTER TABLE "${change.tableName}" ADD CONSTRAINT "${constraintName}" ` +
						`FOREIGN KEY ("${columnName}") REFERENCES "${oldConfig.references.table}"("${oldConfig.references.column}");`
				);
			}
		}

		for (const colName of change.changes.removedColumns || []) {
			const oldSchema = oldSchemas?.[change.tableName];
			const oldColConfig = oldSchema?.columns[colName];

			if (
				oldColConfig &&
				'onUpdate' in oldColConfig &&
				oldColConfig.onUpdate === 'CURRENT_TIMESTAMP'
			) {
				upStatements.push(generateRemoveTriggerSQL(change.tableName, colName));
				downStatements.unshift(generateAddTriggerSQL(change.tableName, colName));
			}

			upStatements.push(`ALTER TABLE "${change.tableName}" DROP COLUMN "${colName}";`);

			if (oldColConfig?.type === 'ENUM') {
				const enumName = getColumnEnumType(change.tableName, colName);
				upStatements.push(`DROP TYPE IF EXISTS "${enumName}" CASCADE;`);
			}

			downStatements.unshift(`-- Cannot restore dropped column "${colName}" without backup`);
			warnings.push(
				`⚠️  Column "${colName}" in table "${change.tableName}" will be dropped. Data will be lost permanently.`
			);
		}

		for (const idxName of change.changes.addedIndexes || []) {
			const idx = schema.indexes?.find(
				(i) => (i.name || `idx_${change.tableName}_${i.columns.join('_')}`) === idxName
			);
			if (idx) {
				const cols = idx.columns.map((c) => `"${c}"`).join(', ');
				const unique = idx.unique ? 'UNIQUE ' : '';
				upStatements.push(
					`CREATE ${unique}INDEX IF NOT EXISTS "${idxName}" ON "${change.tableName}" (${cols});`
				);
				downStatements.unshift(`DROP INDEX IF EXISTS "${idxName}";`);
			}
		}

		for (const idxName of change.changes.removedIndexes || []) {
			upStatements.push(`DROP INDEX IF EXISTS "${idxName}";`);
			downStatements.unshift(`-- Cannot restore index "${idxName}" without definition`);
		}
	}

	return {
		up: upStatements.join('\n\n'),
		down: downStatements.join('\n\n'),
		warnings
	};
}
