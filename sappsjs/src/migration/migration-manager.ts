import type { TableConfig } from '../orm/types';
import type { MigrationSnapshot } from './types';
import { generateCreateTableSQL, generateDropTableSQL } from './generators';
import { sortSchemasByDependencies } from './dependency-graph';
import { detectChanges } from './change-detector';
import { generateMigrationSQL } from './sql-generator';
import { SnapshotManager } from './snapshot-manager';
import { SchemaLoader } from './schema-loader';

export class MigrationManager {
	private migrationsPath = 'migrations';
	private snapshotManager = new SnapshotManager();
	private schemaLoader = new SchemaLoader();

	async loadSchemas(): Promise<Record<string, TableConfig>> {
		return this.schemaLoader.loadSchemas();
	}

	async getLatestSnapshot(): Promise<MigrationSnapshot | null> {
		return this.snapshotManager.getLatestSnapshot();
	}

	async saveSnapshot(snapshot: MigrationSnapshot): Promise<void> {
		return this.snapshotManager.saveSnapshot(snapshot);
	}

	detectChanges(oldSchemas: Record<string, TableConfig>, newSchemas: Record<string, TableConfig>) {
		return detectChanges(oldSchemas, newSchemas);
	}

	generateMigrationSQL(
		changes: ReturnType<typeof detectChanges>,
		schemas: Record<string, TableConfig>,
		oldSchemas?: Record<string, TableConfig>
	) {
		return generateMigrationSQL(changes, schemas, oldSchemas);
	}

	async createMigration(name: string): Promise<void> {
		let currentSchemas: Record<string, TableConfig>;

		try {
			currentSchemas = await this.loadSchemas();
		} catch (error) {
			this.handleSchemaError(error);
			throw error;
		}

		const latestSnapshot = await this.getLatestSnapshot();

		const timestamp = Date.now();
		const version = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
		const migrationName = `${version}_${name.replace(/\s+/g, '_')}`;

		let upSQL = '';
		let downSQL = '';
		let warnings: string[] = [];

		if (!latestSnapshot) {
			upSQL = this.getCreateMigrationsTableSQL() + '\n\n';
			downSQL = 'DROP TABLE IF EXISTS "migrations" CASCADE;\n\n';

			try {
				const sortedSchemas = sortSchemasByDependencies(currentSchemas);

				for (const schema of sortedSchemas) {
					upSQL += generateCreateTableSQL(schema) + '\n\n';
				}

				const reversedSchemas = [...sortedSchemas].reverse();
				for (const schema of reversedSchemas) {
					downSQL += generateDropTableSQL(schema) + '\n\n';
				}
			} catch (error) {
				this.handleDependencyError(error);
				throw error;
			}
		} else {
			const changes = this.detectChanges(latestSnapshot.schemas, currentSchemas);

			if (changes.length === 0) {
				console.log('✓ No changes detected in schemas.');
				return;
			}

			const sql = this.generateMigrationSQL(changes, currentSchemas, latestSnapshot.schemas);
			upSQL = sql.up;
			downSQL = sql.down;
			warnings = sql.warnings;
		}

		let warningsSection = '';
		if (warnings.length > 0) {
			warningsSection = `-- WARNINGS:
${warnings.map((w) => `-- ${w}`).join('\n')}

`;
		}

		const migrationContent = `-- Migration: ${migrationName}
-- Generated at: ${new Date(timestamp).toISOString()}

${warningsSection}-- UP
${upSQL}

-- DOWN
${downSQL}
`;

		const migrationFile = Bun.file(`${this.migrationsPath}/${migrationName}.sql`);
		await Bun.write(migrationFile, migrationContent);

		const snapshot: MigrationSnapshot = {
			version,
			timestamp,
			schemas: currentSchemas
		};
		await this.saveSnapshot(snapshot);

		console.log(`✓ Migration created: ${migrationName}.sql`);
		console.log(`✓ Snapshot saved: snapshot_${version}.json`);

		if (warnings.length > 0) {
			console.log('\n⚠️  WARNINGS:');
			warnings.forEach((w) => console.log(`   ${w}`));
			console.log('\n   Please review the generated migration file carefully before applying it.');
		}
	}

	private handleSchemaError(error: unknown): void {
		if (error instanceof Error) {
			if (error.message.includes('Reserved table name')) {
				console.error('\n❌ MIGRATION ABORTED:');
				console.error(`   ${error.message}\n`);
				process.exit(1);
			}
		}
	}

	private handleDependencyError(error: unknown): void {
		if (error instanceof Error) {
			console.error('\n❌ MIGRATION ABORTED:');
			console.error(`   ${error.message}\n`);

			if (error.message.includes('references')) {
				console.error('   💡 Suggestions:');
				console.error('   • Check that the referenced table exists in src/entities/');
				console.error('   • Verify the table name matches exactly (case-sensitive)');
				console.error('   • Make sure the referenced entity is being exported\n');
			} else if (error.message.includes('Circular dependency')) {
				console.error('   💡 Suggestions:');
				console.error('   • Review your foreign key relationships');
				console.error('   • Consider using a junction table to break the cycle');
				console.error('   • Check if the circular reference is intentional\n');
			}

			process.exit(1);
		}
	}

	private getCreateMigrationsTableSQL(): string {
		return `CREATE TABLE IF NOT EXISTS "migrations" (
  "id" SERIAL PRIMARY KEY,
  "version" VARCHAR NOT NULL UNIQUE,
  "name" VARCHAR NOT NULL,
  "executed_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;
	}
}
