import type { TableConfig } from '../orm/types';
import type { SchemaChange, ColumnChange } from './types';
import { analyzeColumnChange } from './column-analyzer';

function areColumnsEqual(oldCol: any, newCol: any): boolean {
	if (oldCol.type === 'ENUM' && newCol.type === 'ENUM') {
		const oldCopy = { ...oldCol };
		const newCopy = { ...newCol };
		const oldValues = oldCopy.values;
		const newValues = newCopy.values;
		delete oldCopy.values;
		delete newCopy.values;

		if (JSON.stringify(oldCopy) !== JSON.stringify(newCopy)) {
			return false;
		}

		if (!oldValues || !newValues) {
			return oldValues === newValues;
		}

		if (oldValues.length !== newValues.length) {
			return false;
		}

		return oldValues.every((val: string, idx: number) => val === newValues[idx]);
	}

	return JSON.stringify(oldCol) === JSON.stringify(newCol);
}

export function detectChanges(
	oldSchemas: Record<string, TableConfig>,
	newSchemas: Record<string, TableConfig>
): SchemaChange[] {
	const changes: SchemaChange[] = [];

	for (const [tableName, schema] of Object.entries(newSchemas)) {
		if (!oldSchemas[tableName]) {
			changes.push({
				type: 'create',
				tableName
			});
		}
	}

	for (const tableName of Object.keys(oldSchemas)) {
		if (!newSchemas[tableName]) {
			changes.push({
				type: 'drop',
				tableName
			});
		}
	}

	for (const [tableName, newSchema] of Object.entries(newSchemas)) {
		const oldSchema = oldSchemas[tableName];
		if (!oldSchema) continue;

		const addedColumns: string[] = [];
		const removedColumns: string[] = [];
		const modifiedColumns: ColumnChange[] = [];

		for (const [colName, colConfig] of Object.entries(newSchema.columns)) {
			if (!oldSchema.columns[colName]) {
				addedColumns.push(colName);
			} else {
				const oldCol = oldSchema.columns[colName];
				const newCol = colConfig;

				if (!areColumnsEqual(oldCol, newCol)) {
					modifiedColumns.push({
						columnName: colName,
						oldConfig: oldCol,
						newConfig: newCol,
						changeType: analyzeColumnChange(oldCol, newCol)
					});
				}
			}
		}

		for (const colName of Object.keys(oldSchema.columns)) {
			if (!newSchema.columns[colName]) {
				removedColumns.push(colName);
			}
		}

		const oldIndexes = oldSchema.indexes || [];
		const newIndexes = newSchema.indexes || [];
		const addedIndexes: string[] = [];
		const removedIndexes: string[] = [];

		for (const idx of newIndexes) {
			const idxName = idx.name || `idx_${tableName}_${idx.columns.join('_')}`;
			const exists = oldIndexes.some(
				(oldIdx) => (oldIdx.name || `idx_${tableName}_${oldIdx.columns.join('_')}`) === idxName
			);
			if (!exists) {
				addedIndexes.push(idxName);
			}
		}

		for (const idx of oldIndexes) {
			const idxName = idx.name || `idx_${tableName}_${idx.columns.join('_')}`;
			const exists = newIndexes.some(
				(newIdx) => (newIdx.name || `idx_${tableName}_${newIdx.columns.join('_')}`) === idxName
			);
			if (!exists) {
				removedIndexes.push(idxName);
			}
		}

		if (
			addedColumns.length > 0 ||
			removedColumns.length > 0 ||
			modifiedColumns.length > 0 ||
			addedIndexes.length > 0 ||
			removedIndexes.length > 0
		) {
			changes.push({
				type: 'alter',
				tableName,
				changes: {
					addedColumns,
					removedColumns,
					modifiedColumns,
					addedIndexes,
					removedIndexes
				}
			});
		}
	}

	return changes;
}
