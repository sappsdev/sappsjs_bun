import { sql } from 'bun';
import { generateULID } from '../utils/generate-keys';
import type {
	PaginatedResponse,
	Relation,
	WhereCondition,
	WhereOperator,
	TableConfig,
	InferTable
} from './types';

type ExtractTableType<T> = T extends TableConfig ? InferTable<T> : T;

type ExtractRelations<T> = T extends TableConfig
	? T['relations'] extends Record<string, any>
		? keyof T['relations']
		: never
	: string;

type WithLoadedRelations<
	TTable extends TableConfig | any,
	TLoaded extends string = never
> = TTable extends TableConfig
	? InferTable<TTable> & {
			[K in TLoaded]: K extends keyof TTable['relations']
				? TTable['relations'][K] extends { type: 'one-to-many' }
					? any[]
					: TTable['relations'][K] extends { type: 'many-to-one' }
						? any | null
						: any | null
				: never;
		}
	: ExtractTableType<TTable>;

export class QueryBuilder<TTable extends TableConfig | any = any, TLoaded extends string = never> {
	private table: string;
	private tableConfig?: TableConfig;
	private tableAlias: string;
	private selectFields: string[] = [];
	private whereClauses: WhereCondition[] = [];
	private relations: Relation[] = [];
	private orderByField?: string;
	private orderDirection?: 'ASC' | 'DESC';
	private limitValue?: number;
	private offsetValue?: number;
	private groupByFields: string[] = [];
	private txConnection?: any;

	constructor(tableOrConfig: string | TTable, txConnection?: any, alias?: string) {
		if (typeof tableOrConfig === 'string') {
			this.table = tableOrConfig;
			this.txConnection = txConnection;
			this.tableAlias = alias || this.generateAlias(this.table);
			return;
		}

		if (tableOrConfig && typeof tableOrConfig === 'object' && 'tableName' in tableOrConfig) {
			this.table = (tableOrConfig as unknown as TableConfig).tableName;
			this.tableConfig = tableOrConfig as unknown as TableConfig;
			this.txConnection = txConnection;
			this.tableAlias = alias || this.generateAlias(this.table);
			return;
		}

		throw new Error('Invalid table configuration');
	}

	private generateAlias(table: string): string {
		if (table.includes('_')) {
			return table
				.split('_')
				.map((word) => word.charAt(0))
				.join('');
		}
		return table.charAt(0);
	}

	private getConnection() {
		return this.txConnection || sql;
	}

	as(alias: string): QueryBuilder<TTable, TLoaded> {
		this.tableAlias = alias;
		return this;
	}

	select<K extends keyof ExtractTableType<TTable>>(...fields: K[]): QueryBuilder<TTable, TLoaded> {
		this.selectFields = fields as string[];
		return this;
	}

	where<K extends keyof ExtractTableType<TTable>>(
		field: K,
		operator: WhereOperator | any,
		value?: any
	): QueryBuilder<TTable, TLoaded> {
		if (value === undefined) {
			value = operator;
			operator = '=';
		}
		this.whereClauses.push({
			field: field as string,
			operator,
			value,
			connector: 'AND'
		});
		return this;
	}

	orWhere<K extends keyof ExtractTableType<TTable>>(
		field: K,
		operator: WhereOperator | any,
		value?: any
	): QueryBuilder<TTable, TLoaded> {
		if (value === undefined) {
			value = operator;
			operator = '=';
		}
		this.whereClauses.push({
			field: field as string,
			operator,
			value,
			connector: 'OR'
		});
		return this;
	}

	search<K extends keyof ExtractTableType<TTable>>(
		searchTerm: string,
		fields: K[]
	): QueryBuilder<TTable, TLoaded> {
		if (!searchTerm || fields.length === 0) return this;

		fields.forEach((field, index) => {
			const connector = index === 0 && this.whereClauses.length === 0 ? 'AND' : 'OR';
			this.whereClauses.push({
				field: field as string,
				operator: 'ILIKE',
				value: `%${searchTerm}%`,
				connector
			});
		});
		return this;
	}

	with<K extends ExtractRelations<TTable>>(
		relationName: K,
		config?: {
			table?: string;
			foreignKey?: string;
			localKey?: string;
			orderBy?: string;
		}
	): QueryBuilder<TTable, TLoaded | Extract<K, string>> {
		const relationConfig = this.tableConfig?.relations?.[relationName as string];

		const defaultConfig = {
			table: relationConfig?.table || `${relationName as string}`,
			foreignKey: relationConfig?.foreignKey || `${this.table.slice(0, -1)}_id`,
			localKey: `${this.tableAlias}.id`,
			orderBy: 'created_at DESC'
		};

		const finalConfig = { ...defaultConfig, ...config };

		this.relations.push({
			name: relationName as string,
			table: finalConfig.table,
			foreignKey: finalConfig.foreignKey,
			localKey: finalConfig.localKey,
			type: 'hasMany',
			orderBy: finalConfig.orderBy
		});

		return this as any;
	}

	withOne<K extends ExtractRelations<TTable>>(
		relationName: K,
		config?: {
			table?: string;
			foreignKey?: string;
			localKey?: string;
		}
	): QueryBuilder<TTable, TLoaded | Extract<K, string>> {
		const relationConfig = this.tableConfig?.relations?.[relationName as string];

		const defaultConfig = {
			table: relationConfig?.table || `${relationName as string}`,
			foreignKey: relationConfig?.foreignKey || `${this.table.slice(0, -1)}_id`,
			localKey: `${this.tableAlias}.id`
		};

		const finalConfig = { ...defaultConfig, ...config };

		this.relations.push({
			name: relationName as string,
			table: finalConfig.table,
			foreignKey: finalConfig.foreignKey,
			localKey: finalConfig.localKey,
			type: 'hasOne'
		});

		return this as any;
	}

	withParent<K extends ExtractRelations<TTable>>(
		relationName: K,
		config?: {
			table?: string;
			foreignKey?: string;
			ownerKey?: string;
		}
	): QueryBuilder<TTable, TLoaded | Extract<K, string>> {
		const relationConfig = this.tableConfig?.relations?.[relationName as string];

		const finalConfig = {
			table: config?.table || relationConfig?.table || (relationName as string),
			foreignKey:
				config?.foreignKey || relationConfig?.foreignKey || `${relationName as string}_id`,
			ownerKey: config?.ownerKey || relationConfig?.localKey || 'id'
		};

		this.relations.push({
			name: relationName as string,
			table: finalConfig.table,
			foreignKey: finalConfig.foreignKey,
			localKey: finalConfig.ownerKey,
			type: 'belongsTo'
		});

		return this as any;
	}

	orderBy<K extends keyof ExtractTableType<TTable>>(
		field: K,
		direction?: 'ASC' | 'DESC'
	): QueryBuilder<TTable, TLoaded>;

	orderBy(field: string, direction?: 'ASC' | 'DESC'): QueryBuilder<TTable, TLoaded>;

	orderBy(field: string, direction: 'ASC' | 'DESC' = 'ASC'): QueryBuilder<TTable, TLoaded> {
		this.orderByField = field;
		this.orderDirection = direction;
		return this;
	}

	groupBy<K extends keyof ExtractTableType<TTable>>(...fields: K[]): QueryBuilder<TTable, TLoaded> {
		this.groupByFields = fields as string[];
		return this;
	}

	limit(limit: number): QueryBuilder<TTable, TLoaded> {
		this.limitValue = limit;
		return this;
	}

	offset(offset: number): QueryBuilder<TTable, TLoaded> {
		this.offsetValue = offset;
		return this;
	}

	private buildWhereClause() {
		if (this.whereClauses.length === 0) return { sql: sql``, values: [] };

		const parts: any[] = [];
		const values: any[] = [];

		this.whereClauses.forEach((clause, index) => {
			if (index > 0) {
				parts.push(sql.unsafe(` ${clause.connector} `));
			}

			if (clause.operator === 'IN' || clause.operator === 'NOT IN') {
				parts.push(sql.unsafe(`${clause.field} ${clause.operator} (`));
				clause.value.forEach((v: any, i: number) => {
					if (i > 0) parts.push(sql.unsafe(', '));
					parts.push(sql`${v}`);
				});
				parts.push(sql.unsafe(`)`));
			} else {
				parts.push(sql.unsafe(`${clause.field} ${clause.operator} `));
				parts.push(sql`${clause.value}`);
			}
		});

		let combined = sql`WHERE `;
		parts.forEach((part) => {
			combined = sql`${combined}${part}`;
		});

		return { sql: combined, values };
	}

	private buildSelectWithRelations() {
		const baseSelect =
			this.selectFields.length > 0 ? this.selectFields.join(', ') : `${this.tableAlias}.*`;

		if (this.relations.length === 0) {
			return sql.unsafe(baseSelect);
		}

		const relationsSelect = this.relations
			.map((rel) => {
				const relAlias = rel.table.charAt(0);

				if (rel.type === 'hasMany') {
					return `COALESCE(
            JSON_AGG(${relAlias}.* ORDER BY ${relAlias}.${rel.orderBy || 'created_at DESC'})
            FILTER (WHERE ${relAlias}.id IS NOT NULL),
            '[]'::json
          ) AS "${rel.name}"`;
				} else if (rel.type === 'hasOne') {
					return `ROW_TO_JSON(${relAlias}.*) AS "${rel.name}"`;
				} else {
					return `ROW_TO_JSON(${relAlias}.*) AS "${rel.name}"`;
				}
			})
			.join(', ');

		return sql.unsafe(`${baseSelect}, ${relationsSelect}`);
	}

	private buildRelationJoins() {
		if (this.relations.length === 0) return sql``;

		const joins = this.relations
			.map((rel) => {
				const relAlias = rel.table.charAt(0);

				if (rel.type === 'belongsTo') {
					return `LEFT JOIN ${rel.table} ${relAlias} ON ${this.tableAlias}.${rel.foreignKey} = ${relAlias}.${rel.localKey}`;
				} else {
					return `LEFT JOIN ${rel.table} ${relAlias} ON ${rel.localKey} = ${relAlias}.${rel.foreignKey}`;
				}
			})
			.join(' ');

		return sql.unsafe(joins);
	}

	private buildAutoGroupBy() {
		if (this.relations.length === 0 && this.groupByFields.length === 0) {
			return sql``;
		}

		if (this.groupByFields.length > 0) {
			return sql.unsafe(`GROUP BY ${this.groupByFields.join(', ')}`);
		}

		if (this.relations.some((r) => r.type === 'hasMany')) {
			return sql.unsafe(`GROUP BY ${this.tableAlias}.id`);
		}

		return sql``;
	}

	async execute(): Promise<WithLoadedRelations<TTable, TLoaded>[]> {
		const conn = this.getConnection();
		const selectClause = this.buildSelectWithRelations();
		const whereClause = this.buildWhereClause();
		const joinClause = this.buildRelationJoins();
		const groupClause = this.buildAutoGroupBy();

		const orderClause = this.orderByField
			? sql.unsafe(`ORDER BY ${this.tableAlias}.${this.orderByField} ${this.orderDirection}`)
			: sql``;

		const limitClause = this.limitValue ? sql`LIMIT ${this.limitValue}` : sql``;
		const offsetClause = this.offsetValue ? sql`OFFSET ${this.offsetValue}` : sql``;

		return await conn`
      SELECT ${selectClause}
      FROM ${sql.unsafe(this.table)} ${sql.unsafe(this.tableAlias)}
      ${joinClause}
      ${whereClause.sql}
      ${groupClause}
      ${orderClause}
      ${limitClause}
      ${offsetClause}
    `;
	}

	async first(): Promise<WithLoadedRelations<TTable, TLoaded> | null> {
		this.limit(1);
		const [result] = await this.execute();
		return result || null;
	}

	async paginate(
		page: number = 1,
		pageSize: number = 10
	): Promise<[WithLoadedRelations<TTable, TLoaded>[], PaginatedResponse]> {
		const conn = this.getConnection();
		const offset = (page - 1) * pageSize;

		const selectClause = this.buildSelectWithRelations();
		const whereClause = this.buildWhereClause();
		const joinClause = this.buildRelationJoins();
		const groupClause = this.buildAutoGroupBy();

		const orderClause = this.orderByField
			? sql.unsafe(`ORDER BY ${this.tableAlias}.${this.orderByField} ${this.orderDirection}`)
			: sql``;

		const results: Array<WithLoadedRelations<TTable, TLoaded> & { total_count: number }> =
			await conn`
      SELECT ${selectClause}, COUNT(*) OVER() as total_count
      FROM ${sql.unsafe(this.table)} ${sql.unsafe(this.tableAlias)}
      ${joinClause}
      ${whereClause.sql}
      ${groupClause}
      ${orderClause}
      LIMIT ${pageSize}
      OFFSET ${offset}
    `;

		const total = results[0]?.total_count || 0;
		const totalPages = Math.ceil(Number(total) / pageSize);

		const data = results.map(
			({ total_count, ...row }) => row as WithLoadedRelations<TTable, TLoaded>
		);

		const paginate = { total: Number(total), page, pageSize, totalPages };

		return [data, paginate];
	}

	async count(): Promise<number> {
		const conn = this.getConnection();
		const whereClause = this.buildWhereClause();
		const [{ count }] = await conn`
      SELECT COUNT(*) as count
      FROM ${sql.unsafe(this.table)}
      ${whereClause.sql}
    `;
		return Number(count);
	}

	async insert(data: Partial<ExtractTableType<TTable>>): Promise<ExtractTableType<TTable>> {
		const conn = this.getConnection();

		if (!('id' in data)) {
			(data as any).id = generateULID();
		}

		const [inserted] = await conn`
      INSERT INTO ${sql.unsafe(this.table)} ${sql(data)}
      RETURNING *
    `;
		return inserted;
	}

	async upsert(
		data: Partial<ExtractTableType<TTable>>,
		conflictTarget: string | string[],
		updateFields?: string[]
	): Promise<ExtractTableType<TTable>> {
		const conn = this.getConnection();

		if (!('id' in data)) {
			(data as any).id = generateULID();
		}

		const conflictColumns = Array.isArray(conflictTarget)
			? conflictTarget.join(', ')
			: conflictTarget;

		let updateSet: string;
		if (updateFields && updateFields.length > 0) {
			updateSet = updateFields.map((field) => `${field} = EXCLUDED.${field}`).join(', ');
		} else {
			const excludeFields = Array.isArray(conflictTarget) ? conflictTarget : [conflictTarget];
			const fieldsToUpdate = Object.keys(data).filter((key) => !excludeFields.includes(key));
			updateSet = fieldsToUpdate.map((field) => `${field} = EXCLUDED.${field}`).join(', ');
		}

		const [upserted] = await conn`
      INSERT INTO ${sql.unsafe(this.table)} ${sql(data)}
      ON CONFLICT (${sql.unsafe(conflictColumns)})
      DO UPDATE SET ${sql.unsafe(updateSet)}
      RETURNING *
    `;

		return upserted;
	}

	async update(data: Partial<ExtractTableType<TTable>>): Promise<ExtractTableType<TTable>[]> {
		const conn = this.getConnection();
		const whereClause = this.buildWhereClause();
		return await conn`
      UPDATE ${sql.unsafe(this.table)}
      SET ${sql(data)}
      ${whereClause.sql}
      RETURNING *
    `;
	}

	async delete(): Promise<boolean> {
		const conn = this.getConnection();
		const whereClause = this.buildWhereClause();
		const [deleted] = await conn`
      DELETE FROM ${sql.unsafe(this.table)}
      ${whereClause.sql}
      RETURNING id
    `;
		return !!deleted;
	}
}

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
