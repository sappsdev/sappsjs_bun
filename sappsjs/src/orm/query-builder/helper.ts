import { QueryBuilder } from './query';
import type { TableConfig } from '../types';

export function query<TTable extends TableConfig>(
	tableConfig: TTable,
	txConnection?: any,
	alias?: string
): QueryBuilder<TTable, never> {
	return new QueryBuilder<TTable, never>(tableConfig, txConnection, alias);
}

export function queryRaw<T = any>(
	tableName: string,
	txConnection?: any,
	alias?: string
): QueryBuilder<T, never> {
	return new QueryBuilder<T, never>(tableName, txConnection, alias);
}
