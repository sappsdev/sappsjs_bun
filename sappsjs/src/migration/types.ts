import type { ColumnConfig, ForeignKeyConfig, TableConfig } from '../orm/types';

export interface MigrationSnapshot {
	version: string;
	timestamp: number;
	schemas: Record<string, TableConfig>;
}

export interface MigrationRecord {
	id: number;
	version: string;
	name: string;
	executed_at: string;
}

export interface MigrationFile {
	version: string;
	name: string;
	filePath: string;
	up: string;
	down: string;
}

export interface SchemaChange {
	type: 'create' | 'alter' | 'drop';
	tableName: string;
	changes?: {
		addedColumns?: string[];
		removedColumns?: string[];
		modifiedColumns?: ColumnChange[];
		addedIndexes?: string[];
		removedIndexes?: string[];
	};
}

export interface DependencyGraph {
	[tableName: string]: string[];
}

export interface ColumnChange {
	columnName: string;
	oldConfig: ColumnConfig | ForeignKeyConfig;
	newConfig: ColumnConfig | ForeignKeyConfig;
	changeType: 'type' | 'constraint' | 'reference' | 'mixed';
}
