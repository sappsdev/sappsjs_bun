import type { TableConfig } from '../orm/types';
import { normalizeSchema } from './schema-utils';
import path from 'path';

export class SchemaLoader {
	private entitiesPath = 'src/entities/**/*.ts';
	private readonly RESERVED_TABLE_NAMES = ['migrations', 'seeders'];

	async loadSchemas(): Promise<Record<string, TableConfig>> {
		const schemas: Record<string, TableConfig> = {};
		const glob = new Bun.Glob(this.entitiesPath);
		const errors: Array<{ file: string; error: Error }> = [];

		for await (const file of glob.scan()) {
			try {
				const fullPath = path.resolve(file);
				const module = await import(fullPath);

				for (const [key, value] of Object.entries(module)) {
					if (value && typeof value === 'object' && 'tableName' in value && 'columns' in value) {
						const schema = normalizeSchema(value as TableConfig);

						this.validateTableName(schema.tableName, file);

						schemas[schema.tableName] = schema;
					}
				}
			} catch (error) {
				if (error instanceof Error && error.message.includes('Reserved table name')) {
					throw error;
				}

				// Acumular errores no críticos
				if (error instanceof Error) {
					errors.push({ file, error });
				}
			}
		}

		// Reportar errores de carga si los hay
		if (errors.length > 0) {
			console.warn('\n⚠️  Warnings while loading schemas:');
			errors.forEach(({ file, error }) => {
				console.warn(`   • ${file}: ${error.message}`);
			});
			console.warn('');
		}

		return schemas;
	}

	private validateTableName(tableName: string, file: string): void {
		const normalizedTableName = tableName.toLowerCase();

		if (this.RESERVED_TABLE_NAMES.includes(normalizedTableName)) {
			const relativePath = file.replace(process.cwd() + '/', '');
			throw new Error(
				`Reserved table name detected: "${tableName}"\n` +
					`   Found in: ${relativePath}\n` +
					`   Reserved names: ${this.RESERVED_TABLE_NAMES.join(', ')}\n` +
					`   Please rename your table to something else.`
			);
		}
	}
}
