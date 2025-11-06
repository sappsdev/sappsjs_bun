import { sql } from 'bun';
import { rm } from 'node:fs/promises';
import path from 'path';

export class MigrationReset {
	private migrationsPath = 'migrations';

	constructor() {
		const dbUrl = process.env.DATABASE_URL;

		if (!dbUrl) {
			throw new Error(
				'DATABASE_URL environment variable is not set.\n' +
					'Example: DATABASE_URL=postgres://user:password@localhost:5432/dbname'
			);
		}
	}

	private async promptConfirmation(): Promise<boolean> {
		console.log('╔════════════════════════════════════════════════════════════╗');
		console.log('║                    ⚠️  DANGER ZONE ⚠️                      ║');
		console.log('╚════════════════════════════════════════════════════════════╝');
		console.log('');
		console.log('🔥 This operation will PERMANENTLY:');
		console.log('   • DROP ALL database tables (including data)');
		console.log("   • DELETE the entire 'migrations' folder");
		console.log('   • REMOVE all migration history');
		console.log('');
		console.log('⛔ THIS ACTION CANNOT BE UNDONE!');
		console.log('');

		const prompt = "Type 'yes' to confirm this destructive operation: ";
		process.stdout.write(prompt);

		for await (const line of console) {
			const input = line.trim().toLowerCase();

			if (input === 'yes') {
				return true;
			} else {
				console.log('❌ Reset cancelled.');
				return false;
			}
		}

		return false;
	}

	private async dropAllTables(): Promise<void> {
		console.log('\n🗑️  Dropping all tables from database...');

		try {
			const tables = await sql<{ tablename: string }[]>`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public';
      `;

			if (tables.length === 0) {
				console.log('ℹ️  No tables found in database.');
				return;
			}

			console.log(`\nFound ${tables.length} table(s) to drop:`);
			tables.forEach((t) => {
				console.log(`  • ${t.tablename}`);
			});

			for (const table of tables) {
				await sql.unsafe(`DROP TABLE IF EXISTS "${table.tablename}" CASCADE;`);
				console.log(`  ✓ Dropped table: ${table.tablename}`);
			}

			console.log('\n✅ All tables dropped successfully!');
		} catch (error) {
			console.error('❌ Error dropping tables:', error);
			throw error;
		}
	}

	private async dropAllEnums(): Promise<void> {
		console.log('\n🗑️  Dropping all ENUM types from database...');

		try {
			const enums = await sql<{ typname: string }[]>`
        SELECT t.typname
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public'
        GROUP BY t.typname;
      `;

			if (enums.length === 0) {
				console.log('ℹ️  No ENUM types found in database.');
				return;
			}

			console.log(`\nFound ${enums.length} ENUM type(s) to drop:`);
			enums.forEach((e) => {
				console.log(`  • ${e.typname}`);
			});

			for (const enumType of enums) {
				await sql.unsafe(`DROP TYPE IF EXISTS "${enumType.typname}" CASCADE;`);
				console.log(`  ✓ Dropped ENUM: ${enumType.typname}`);
			}

			console.log('\n✅ All ENUM types dropped successfully!');
		} catch (error) {
			console.error('❌ Error dropping ENUM types:', error);
			throw error;
		}
	}

	private async deleteMigrationsFolder(): Promise<void> {
		console.log('\n🗑️  Deleting migrations folder...');

		try {
			const migrationsDir = path.resolve(this.migrationsPath);

			try {
				await Bun.file(migrationsDir).exists();
			} catch {
				console.log('ℹ️  Migrations folder does not exist.');
				return;
			}

			await rm(migrationsDir, { recursive: true, force: true });
			console.log(`  ✓ Deleted folder: ${this.migrationsPath}`);

			console.log('\n✅ Migrations folder deleted successfully!');
		} catch (error) {
			console.error('❌ Error deleting migrations folder:', error);
			throw error;
		}
	}

	async reset(): Promise<void> {
		console.log('🔄 Database Reset\n');

		const confirmed = await this.promptConfirmation();

		if (!confirmed) {
			return;
		}

		console.log('\n🚀 Starting database reset...');

		await this.dropAllTables();

		await this.dropAllEnums();

		await this.deleteMigrationsFolder();

		console.log('\n✅ Database reset completed successfully!');
		console.log('ℹ️  Your database is now empty and the migrations folder has been removed.');
	}
}
