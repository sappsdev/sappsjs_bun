import type { ColumnConfig, ForeignKeyConfig } from '../orm/types';
import type { ColumnChange } from './types';

function areEnumValuesEqual(
	oldValues: readonly string[] | undefined,
	newValues: readonly string[] | undefined
): boolean {
	if (!oldValues || !newValues) return oldValues === newValues;
	if (oldValues.length !== newValues.length) return false;
	return oldValues.every((val, idx) => val === newValues[idx]);
}

export function analyzeColumnChange(
	oldConfig: ColumnConfig | ForeignKeyConfig,
	newConfig: ColumnConfig | ForeignKeyConfig
): ColumnChange['changeType'] {
	const typeChanged = oldConfig.type !== newConfig.type;

	let enumValuesChanged = false;
	if (oldConfig.type === 'ENUM' && newConfig.type === 'ENUM') {
		const oldValues =
			'values' in oldConfig ? (oldConfig.values as readonly string[] | undefined) : undefined;
		const newValues =
			'values' in newConfig ? (newConfig.values as readonly string[] | undefined) : undefined;
		enumValuesChanged = !areEnumValuesEqual(oldValues, newValues);
	}

	const oldHasRef = 'references' in oldConfig && oldConfig.references;
	const newHasRef = 'references' in newConfig && newConfig.references;
	const referenceChanged =
		oldHasRef !== newHasRef ||
		(oldHasRef &&
			newHasRef &&
			JSON.stringify(oldConfig.references) !== JSON.stringify(newConfig.references));

	const constraintChanged =
		oldConfig.primaryKey !== newConfig.primaryKey ||
		oldConfig.unique !== newConfig.unique ||
		oldConfig.nullable !== newConfig.nullable ||
		oldConfig.default !== newConfig.default ||
		oldConfig.index !== newConfig.index;

	const effectiveTypeChange = typeChanged || enumValuesChanged;

	if (
		(effectiveTypeChange && (referenceChanged || constraintChanged)) ||
		(referenceChanged && constraintChanged)
	) {
		return 'mixed';
	}
	if (effectiveTypeChange) return 'type';
	if (referenceChanged) return 'reference';
	return 'constraint';
}

export function isTypeConversionSafe(fromType: string, toType: string): boolean {
	const safeConversions: Record<string, string[]> = {
		INTEGER: ['DECIMAL', 'TEXT', 'VARCHAR'],
		DECIMAL: ['TEXT', 'VARCHAR'],
		VARCHAR: ['TEXT'],
		BOOLEAN: ['TEXT', 'VARCHAR', 'INTEGER'],
		TIMESTAMP: ['TEXT', 'VARCHAR'],
		SERIAL: ['INTEGER', 'DECIMAL', 'TEXT', 'VARCHAR']
	};

	return safeConversions[fromType]?.includes(toType) || false;
}

export function generateTypeChangeSQL(
	tableName: string,
	columnName: string,
	oldType: string,
	newType: string
): { up: string; down: string; warning?: string } {
	const isSafe = isTypeConversionSafe(oldType, newType);

	let up = '';
	let down = '';
	let warning = '';

	if (!isSafe) {
		warning = `⚠️  WARNING: Converting ${columnName} from ${oldType} to ${newType} may cause data loss or errors. Consider manual migration.`;

		if (newType === 'INTEGER' || newType === 'DECIMAL') {
			up = `-- WARNING: This conversion may fail if data is not numeric
ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" TYPE ${newType} USING "${columnName}"::${newType};`;
		} else {
			up = `-- WARNING: This conversion may cause data loss
ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" TYPE ${newType} USING "${columnName}"::${newType};`;
		}
	} else {
		up = `ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" TYPE ${newType} USING "${columnName}"::${newType};`;
	}

	down = `ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" TYPE ${oldType} USING "${columnName}"::${oldType};`;

	return { up, down, warning };
}
