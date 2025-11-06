async function buildLibrary() {
	try {
		console.log('🧹 Cleaning previous build...');
		await Bun.spawn(['rm', '-rf', 'dist']).exited;

		console.log('🔨 Building SappSJS Server...');

		await Bun.build({
			entrypoints: [
				'./src/index.ts',
				'./src/orm/index.ts',
				'./src/cli/index.ts',
				'./src/translations/index.ts',
				'./src/cron/index.ts'
			],
			outdir: './dist',
			format: 'esm',
			target: 'bun',
			minify: true
		});

		await Bun.spawn(['chmod', '+x', 'dist/cli/index.js']).exited;

		console.log('📝 Generating TypeScript declaration files...');

		console.log('🔨 Building types entry point...');
		await Bun.build({
			entrypoints: ['./src/types.ts'],
			outdir: './dist',
			format: 'esm',
			target: 'bun',
			minify: false,
			naming: {
				entry: 'types.js'
			}
		});

		await Bun.spawn([
			'bunx',
			'tsc',
			'--declaration',
			'--emitDeclarationOnly',
			'--outDir',
			'dist',
			'src/index.ts',
			'src/types.ts',
			'src/orm/index.ts',
			'src/cron/index.ts',
			'src/translations/index.ts'
		]).exited;

		console.log('✅ Build completed successfully');
		console.log('📦 Generated files in ./dist/');
	} catch (error) {
		console.error('❌ Error during build:', error);
		process.exit(1);
	}
}

buildLibrary();
