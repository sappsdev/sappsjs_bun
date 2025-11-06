import { sql } from "bun";
import path from "path";
import type { MigrationFile, MigrationRecord } from "./types";

export class MigrationExecutor {
  private migrationsPath = "migrations";

  constructor() {
    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl) {
      throw new Error(
        "DATABASE_URL environment variable is not set.\n" +
        "Example: DATABASE_URL=postgres://user:password@localhost:5432/dbname"
      );
    }
  }

  private async ensureMigrationsTable(): Promise<void> {
    await sql`
      CREATE TABLE IF NOT EXISTS "migrations" (
        "id" SERIAL PRIMARY KEY,
        "version" VARCHAR NOT NULL UNIQUE,
        "name" VARCHAR NOT NULL,
        "executed_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
  }

  private async getExecutedMigrations(): Promise<MigrationRecord[]> {
    await this.ensureMigrationsTable();

    const results = await sql<MigrationRecord[]>`
      SELECT * FROM "migrations"
      ORDER BY "version" ASC;
    `;

    return results;
  }

  private async parseMigrationFile(filePath: string): Promise<MigrationFile> {
    const file = Bun.file(filePath);
    const content = await file.text();

    const fileName = path.basename(filePath, '.sql');
    const match = fileName.match(/^(\d+)_(.+)$/);

    if (!match || !match[1] || !match[2]) {
      throw new Error(`Invalid migration filename: ${fileName}`);
    }

    const [, version, name] = match as [string, string, string];

    const upMatch = content.match(/-- UP\s+([\s\S]*?)(?=-- DOWN|$)/i);
    const downMatch = content.match(/-- DOWN\s+([\s\S]*?)$/i);

    if (!upMatch || !upMatch[1]) {
      throw new Error(`Missing UP section in migration: ${fileName}`);
    }

    if (!downMatch || !downMatch[1]) {
      throw new Error(`Missing DOWN section in migration: ${fileName}`);
    }

    return {
      version,
      name,
      filePath,
      up: upMatch[1].trim(),
      down: downMatch[1].trim(),
    };
  }

  private async getAvailableMigrations(): Promise<MigrationFile[]> {
    const glob = new Bun.Glob(`${this.migrationsPath}/*.sql`);
    const migrations: MigrationFile[] = [];

    for await (const file of glob.scan()) {
      try {
        const migration = await this.parseMigrationFile(file);
        migrations.push(migration);
      } catch (error) {
        console.warn(`Warning: Could not parse migration ${file}:`, error);
      }
    }

    return migrations.sort((a, b) => a.version.localeCompare(b.version));
  }

  private async getPendingMigrations(): Promise<MigrationFile[]> {
    const executed = await this.getExecutedMigrations();
    const available = await this.getAvailableMigrations();

    const executedVersions = new Set(executed.map((m) => m.version));

    return available.filter((m) => !executedVersions.has(m.version));
  }

  private async executeMigrationUp(migration: MigrationFile): Promise<void> {
    console.log(`\n↑ Running migration: ${migration.version}_${migration.name}`);

    try {
      await sql.unsafe(migration.up);

      await sql`
        INSERT INTO "migrations" ("version", "name")
        VALUES (${migration.version}, ${migration.name});
      `;

      console.log(`✓ Migration ${migration.version} completed successfully`);
    } catch (error) {
      console.error(`✗ Migration ${migration.version} failed:`, error);
      throw error;
    }
  }

  private async executeMigrationDown(migration: MigrationFile): Promise<void> {
    console.log(`\n↑ Rolling back migration: ${migration.version}_${migration.name}`);

    try {
      await sql.unsafe(migration.down);

      await sql`
        DELETE FROM "migrations"
        WHERE "version" = ${migration.version};
      `;

      console.log(`✓ Rollback ${migration.version} completed successfully`);
    } catch (error) {
      console.error(`✗ Rollback ${migration.version} failed:`, error);
      throw error;
    }
  }

  async migrate(): Promise<void> {
    console.log("🔍 Checking for pending migrations...\n");

    const pending = await this.getPendingMigrations();

    if (pending.length === 0) {
      console.log("✓ No pending migrations. Database is up to date.");
      return;
    }

    console.log(`Found ${pending.length} pending migration(s):\n`);
    pending.forEach((m) => {
      console.log(`  • ${m.version}_${m.name}`);
    });

    console.log("\n🔧 Running migrations...");

    for (const migration of pending) {
      await this.executeMigrationUp(migration);
    }

    console.log("\n✅ All migrations completed successfully!");
  }

  async rollback(steps: number = 1): Promise<void> {
    console.log(`🔍 Rolling back last ${steps} migration(s)...\n`);

    const executed = await this.getExecutedMigrations();

    if (executed.length === 0) {
      console.log("✓ No migrations to rollback.");
      return;
    }

    const toRollback = executed.slice(-steps).reverse();

    if (toRollback.length === 0) {
      console.log("✓ No migrations to rollback.");
      return;
    }

    console.log(`Found ${toRollback.length} migration(s) to rollback:\n`);
    toRollback.forEach((m) => {
      console.log(`  • ${m.version}_${m.name}`);
    });

    console.log("\n🔧 Rolling back migrations...");

    const available = await this.getAvailableMigrations();
    const migrationMap = new Map(available.map((m) => [m.version, m]));

    for (const executed of toRollback) {
      const migration = migrationMap.get(executed.version);

      if (!migration) {
        console.error(
          `✗ Cannot rollback ${executed.version}: migration file not found`
        );
        throw new Error(
          `Migration file for version ${executed.version} not found. ` +
          `Cannot perform rollback without the DOWN SQL.`
        );
      }

      await this.executeMigrationDown(migration);
    }

    console.log("\n✅ All rollbacks completed successfully!");
  }

  async status(): Promise<void> {
    console.log("📊 Migration Status\n");

    const executed = await this.getExecutedMigrations();
    const available = await this.getAvailableMigrations();
    const pending = await this.getPendingMigrations();

    console.log(`Total migrations: ${available.length}`);
    console.log(`Executed: ${executed.length}`);
    console.log(`Pending: ${pending.length}\n`);

    if (executed.length > 0) {
      console.log("✓ Executed migrations:");
      executed.forEach((m) => {
        const date = new Date(m.executed_at).toLocaleString();
        console.log(`  • ${m.version}_${m.name} (${date})`);
      });
      console.log();
    }

    if (pending.length > 0) {
      console.log("⏳ Pending migrations:");
      pending.forEach((m) => {
        console.log(`  • ${m.version}_${m.name}`);
      });
      console.log();
    }

    if (pending.length === 0 && executed.length > 0) {
      console.log("✅ Database is up to date!");
    }
  }
}
