import { sql } from 'bun';
import type { TableConfig } from '../types';
import { QueryBuilder } from './query';

export class Transaction {
	private txConnection: any;

	constructor(txConnection: any) {
		this.txConnection = txConnection;
	}

	query<TTable extends TableConfig>(
		tableConfig: TTable,
		alias?: string
	): QueryBuilder<TTable, never> {
		return new QueryBuilder<TTable, never>(tableConfig, this.txConnection, alias);
	}

	queryRaw<T = any>(tableName: string, alias?: string): QueryBuilder<T, never> {
		return new QueryBuilder<T, never>(tableName, this.txConnection, alias);
	}

	async savepoint<T>(name: string, callback: (sp: any) => Promise<T>): Promise<T> {
		try {
			await this.txConnection.savepoint(name);
			return await callback(this.txConnection);
		} catch (error) {
			await this.txConnection.rollback(name);
			throw error;
		}
	}
}

export async function transaction<T>(callback: (tx: Transaction) => Promise<T>): Promise<T> {
	return await sql.begin(async (txConnection) => {
		const tx = new Transaction(txConnection);
		return await callback(tx);
	});
}

export async function transactionWithSavepoints<T>(
	callback: (tx: Transaction) => Promise<T>
): Promise<T> {
	return await sql.begin(async (txConnection) => {
		const tx = new Transaction(txConnection);
		return await callback(tx);
	});
}
