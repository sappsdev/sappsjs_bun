import type { MigrationSnapshot } from './types';

export class SnapshotManager {
	private snapshotsPath = 'migrations/snapshots';

	async getLatestSnapshot(): Promise<MigrationSnapshot | null> {
		const glob = new Bun.Glob(`${this.snapshotsPath}/*.json`);
		let latestSnapshot: MigrationSnapshot | null = null;
		let latestTimestamp = 0;

		try {
			for await (const file of glob.scan()) {
				const snapshotFile = Bun.file(file);
				const snapshot = (await snapshotFile.json()) as MigrationSnapshot;

				if (snapshot.timestamp > latestTimestamp) {
					latestTimestamp = snapshot.timestamp;
					latestSnapshot = snapshot;
				}
			}
		} catch (error) {
			return null;
		}

		return latestSnapshot;
	}

	async saveSnapshot(snapshot: MigrationSnapshot): Promise<void> {
		const filename = `${this.snapshotsPath}/snapshot_${snapshot.version}.json`;
		const file = Bun.file(filename);
		await Bun.write(file, JSON.stringify(snapshot, null, 2));
	}
}
