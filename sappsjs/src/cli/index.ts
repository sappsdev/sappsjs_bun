#!/usr/bin/env bun
import { parseArgs } from 'util';
import { MigrationManager } from '../migration/migration-manager';
import { MigrationExecutor } from '../migration/migration-executor';
import { MigrationReset } from '../migration/migration-reset';
import { MigrationSeeder } from '../migration/seeders';

console.log('SappsJs CLI');
const { values, positionals } = parseArgs({
	args: Bun.argv,
	options: {
		steps: { type: 'string', default: '1' },
		name: { type: 'string', short: 'n' },
		seeder: { type: 'string', short: 's' }
	},
	strict: true,
	allowPositionals: true
});

if (positionals[2] === 'db:generate') {
	if (!values.name) {
		console.error('Error: Migration name is required. Use --name or -n to specify it.');
		process.exit(1);
	}
	console.log('Creating new migration...');
	const manager = new MigrationManager();
	await manager.createMigration(values.name.trim());
}

if (positionals[2] === 'db:migrate') {
	console.log('Running migrations...');
	const executor = new MigrationExecutor();
	await executor.migrate();
}

if (positionals[2] === 'db:rollback') {
	const steps = parseInt(values['steps'] || '1', 10);
	if (isNaN(steps) || steps < 1) {
		console.error('Error: Steps must be a positive integer.');
		process.exit(1);
	}
	console.log(`Rolling back last ${steps} migration(s)...`);
	const executor = new MigrationExecutor();
	await executor.rollback(steps);
}

if (positionals[2] === 'db:status') {
	console.log('Checking migration status...');
	const executor = new MigrationExecutor();
	await executor.status();
}

if (positionals[2] === 'db:reset') {
	const executor = new MigrationReset();
	await executor.reset();
}

if (positionals[2] === 'db:seed') {
	const seeder = new MigrationSeeder();
	await seeder.seed(values.seeder);
}

if (positionals[2] === 'db:seed:rollback') {
	const seeder = new MigrationSeeder();
	await seeder.rollback(values.seeder);
}

if (positionals[2] === 'db:seed:fresh') {
	const seeder = new MigrationSeeder();
	await seeder.fresh();
}

if (positionals[2] === 'db:seed:status') {
	const seeder = new MigrationSeeder();
	await seeder.status();
}
