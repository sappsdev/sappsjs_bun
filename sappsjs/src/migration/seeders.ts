import path from 'path';
import { sql } from 'bun';

export interface SeederModule {
	seed: () => Promise<void>;
	rollback?: () => Promise<void>;
}

export interface SeederRecord {
	id: number;
	name: string;
	executed_at: Date;
}

export class MigrationSeeder {
	private seedersPath = 'src/seeders';

	constructor() {
		const dbUrl = process.env.DATABASE_URL;

		if (!dbUrl) {
			throw new Error(
				'DATABASE_URL environment variable is not set.\n' +
					'Example: DATABASE_URL=postgres://user:password@localhost:5432/dbname'
			);
		}
	}

	private async ensureSeedersTable(): Promise<void> {
		await sql`
      CREATE TABLE IF NOT EXISTS "seeders" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR NOT NULL UNIQUE,
        "executed_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
	}

	private async getExecutedSeeders(): Promise<SeederRecord[]> {
		await this.ensureSeedersTable();

		const results = await sql<SeederRecord[]>`
      SELECT * FROM "seeders"
      ORDER BY "name" ASC;
    `;

		return results;
	}

	private async getAvailableSeeders(): Promise<string[]> {
		const glob = new Bun.Glob(`${this.seedersPath}/*.ts`);
		const seeders: string[] = [];

		for await (const file of glob.scan()) {
			seeders.push(file);
		}

		return seeders.sort((a, b) => {
			const fileA = path.basename(a, '.ts');
			const fileB = path.basename(b, '.ts');
			return fileA.localeCompare(fileB, undefined, { numeric: true });
		});
	}

	private async loadSeederModule(filePath: string): Promise<SeederModule> {
		// filePath already contains the relative path from cwd (e.g., "src/seeders/001-admin.ts")
		const fullPath = path.join(process.cwd(), filePath);

		try {
			const module = await import(fullPath);

			if (!module.seed || typeof module.seed !== 'function') {
				throw new Error(`Seeder ${filePath} must export a 'seed' function`);
			}

			return module as SeederModule;
		} catch (error) {
			throw new Error(`Failed to load seeder ${filePath}: ${error}`);
		}
	}

	private async executeSeeder(filePath: string): Promise<void> {
		const fileName = path.basename(filePath, '.ts');
		console.log(`\n→ Running seeder: ${fileName}`);

		try {
			const module = await this.loadSeederModule(filePath);

			await module.seed();

			await sql`
        INSERT INTO "seeders" ("name")
        VALUES (${fileName})
        ON CONFLICT ("name") DO NOTHING;
      `;

			console.log(`✓ Seeder ${fileName} completed successfully`);
		} catch (error) {
			console.error(`✗ Seeder ${fileName} failed:`, error);
			throw error;
		}
	}

	private async rollbackSeeder(fileName: string, filePath: string): Promise<void> {
		console.log(`\n→ Rolling back seeder: ${fileName}`);

		try {
			const module = await this.loadSeederModule(filePath);

			if (module.rollback && typeof module.rollback === 'function') {
				await module.rollback();
			} else {
				console.warn(`⚠️  Seeder ${fileName} does not have a rollback function`);
			}

			await sql`
        DELETE FROM "seeders"
        WHERE "name" = ${fileName};
      `;

			console.log(`✓ Rollback ${fileName} completed successfully`);
		} catch (error) {
			console.error(`✗ Rollback ${fileName} failed:`, error);
			throw error;
		}
	}

	async seed(specific?: string): Promise<void> {
		console.log('🌱 Running seeders...\n');

		const available = await this.getAvailableSeeders();

		if (available.length === 0) {
			console.log('✓ No seeders found.');
			return;
		}

		if (specific) {
			const seederFile = available.find(
				(f) => path.basename(f, '.ts') === specific || f === specific || f === `${specific}.ts`
			);

			if (!seederFile) {
				throw new Error(`Seeder '${specific}' not found`);
			}

			await this.executeSeeder(seederFile);
			console.log('\n✅ Seeder completed successfully!');
			return;
		}

		const executed = await this.getExecutedSeeders();
		const executedNames = new Set(executed.map((s) => s.name));

		const pending = available.filter((f) => !executedNames.has(path.basename(f, '.ts')));

		if (pending.length === 0) {
			console.log('✓ All seeders have already been executed.');
			return;
		}

		console.log(`Found ${pending.length} pending seeder(s):\n`);
		pending.forEach((s) => {
			console.log(`  • ${path.basename(s, '.ts')}`);
		});

		console.log('\n🔧 Running seeders...');

		for (const seeder of pending) {
			await this.executeSeeder(seeder);
		}

		console.log('\n✅ All seeders completed successfully!');
	}

	async rollback(specific?: string): Promise<void> {
		console.log('🔄 Rolling back seeders...\n');

		const executed = await this.getExecutedSeeders();

		if (executed.length === 0) {
			console.log('✓ No seeders to rollback.');
			return;
		}

		const available = await this.getAvailableSeeders();
		const seederMap = new Map(available.map((f) => [path.basename(f, '.ts'), f]));

		if (specific) {
			const seederRecord = executed.find((s) => s.name === specific);

			if (!seederRecord) {
				throw new Error(`Seeder '${specific}' has not been executed`);
			}

			const seederFile = seederMap.get(seederRecord.name);

			if (!seederFile) {
				throw new Error(`Seeder file for '${specific}' not found`);
			}

			await this.rollbackSeeder(seederRecord.name, seederFile);
			console.log('\n✅ Seeder rollback completed successfully!');
			return;
		}

		const toRollback = [...executed].reverse();

		console.log(`Found ${toRollback.length} seeder(s) to rollback:\n`);
		toRollback.forEach((s) => {
			console.log(`  • ${s.name}`);
		});

		console.log('\n🔧 Rolling back seeders...');

		for (const seederRecord of toRollback) {
			const seederFile = seederMap.get(seederRecord.name);

			if (!seederFile) {
				console.warn(`⚠️  Seeder file for '${seederRecord.name}' not found, skipping...`);
				continue;
			}

			await this.rollbackSeeder(seederRecord.name, seederFile);
		}

		console.log('\n✅ All seeder rollbacks completed successfully!');
	}

	async fresh(): Promise<void> {
		console.log('🔄 Rolling back all seeders and re-running...\n');

		await this.rollback();
		await this.seed();
	}

	async status(): Promise<void> {
		console.log('📊 Seeder Status\n');

		const executed = await this.getExecutedSeeders();
		const available = await this.getAvailableSeeders();

		const executedNames = new Set(executed.map((s) => s.name));
		const pending = available.filter((f) => !executedNames.has(path.basename(f, '.ts')));

		console.log(`Total seeders: ${available.length}`);
		console.log(`Executed: ${executed.length}`);
		console.log(`Pending: ${pending.length}\n`);

		if (executed.length > 0) {
			console.log('✓ Executed seeders:');
			executed.forEach((s) => {
				const date = new Date(s.executed_at).toLocaleString();
				console.log(`  • ${s.name} (${date})`);
			});
			console.log();
		}

		if (pending.length > 0) {
			console.log('⏳ Pending seeders:');
			pending.forEach((s) => {
				console.log(`  • ${path.basename(s, '.ts')}`);
			});
			console.log();
		}

		if (pending.length === 0 && executed.length > 0) {
			console.log('✅ All seeders have been executed!');
		}
	}
}
