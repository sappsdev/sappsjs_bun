import { sql } from 'bun';

import type {
	PaginatedResponse,
	WhereOperator,
	TableConfig,
	ExtractTableType,
	ExtractRelations,
	WithLoadedRelations,
	Point
} from '../types';
import { generateULID } from '../../utils/generate-keys';
import { WhereBuilder } from './where';
import { RelationBuilder } from './relation';

export class QueryBuilder<TTable extends TableConfig | any = any, TLoaded extends string = never> {
	private table: string;
	private tableConfig?: TableConfig;
	private tableAlias: string;
	private selectFields: string[] = [];
	private whereBuilder: WhereBuilder;
	private relationBuilder: RelationBuilder;
	private orderByField?: string;
	private orderDirection?: 'ASC' | 'DESC';
	private limitValue?: number;
	private offsetValue?: number;
	private groupByFields: string[] = [];
	private txConnection?: any;

	constructor(tableOrConfig: string | TTable, txConnection?: any, alias?: string) {
		this.whereBuilder = new WhereBuilder();
		this.relationBuilder = new RelationBuilder();

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

	// Métodos Where delegados a WhereBuilder
	where<K extends keyof ExtractTableType<TTable>>(
		field: K,
		operator: WhereOperator | any,
		value?: any
	): QueryBuilder<TTable, TLoaded> {
		this.whereBuilder.where(field as string, operator, value);
		return this;
	}

	orWhere<K extends keyof ExtractTableType<TTable>>(
		field: K,
		operator: WhereOperator | any,
		value?: any
	): QueryBuilder<TTable, TLoaded> {
		this.whereBuilder.orWhere(field as string, operator, value);
		return this;
	}

	whereBetween<K extends keyof ExtractTableType<TTable>>(
		field: K,
		start: any,
		end: any
	): QueryBuilder<TTable, TLoaded> {
		this.whereBuilder.whereBetween(field as string, start, end);
		return this;
	}

	orWhereBetween<K extends keyof ExtractTableType<TTable>>(
		field: K,
		start: any,
		end: any
	): QueryBuilder<TTable, TLoaded> {
		this.whereBuilder.orWhereBetween(field as string, start, end);
		return this;
	}

	whereNotBetween<K extends keyof ExtractTableType<TTable>>(
		field: K,
		start: any,
		end: any
	): QueryBuilder<TTable, TLoaded> {
		this.whereBuilder.whereNotBetween(field as string, start, end);
		return this;
	}

	orWhereNotBetween<K extends keyof ExtractTableType<TTable>>(
		field: K,
		start: any,
		end: any
	): QueryBuilder<TTable, TLoaded> {
		this.whereBuilder.orWhereNotBetween(field as string, start, end);
		return this;
	}

	whereWithinRadius<K extends keyof ExtractTableType<TTable>>(
		field: K,
		centerPoint: Point,
		radiusMeters: number
	): QueryBuilder<TTable, TLoaded> {
		this.whereBuilder.whereWithinRadius(field as string, centerPoint, radiusMeters);
		return this;
	}

	whereInBoundingBox<K extends keyof ExtractTableType<TTable>>(
		field: K,
		topLeft: Point,
		bottomRight: Point
	): QueryBuilder<TTable, TLoaded> {
		this.whereBuilder.whereInBoundingBox(field as string, topLeft, bottomRight);
		return this;
	}

	whereInPolygon<K extends keyof ExtractTableType<TTable>>(
		field: K,
		polygon: Point[]
	): QueryBuilder<TTable, TLoaded> {
		this.whereBuilder.whereInPolygon(field as string, polygon);
		return this;
	}

	search<K extends keyof ExtractTableType<TTable>>(
		searchTerm: string,
		fields: K[]
	): QueryBuilder<TTable, TLoaded> {
		this.whereBuilder.search(searchTerm, fields as string[]);
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

		this.relationBuilder.addHasMany(
			relationName as string,
			finalConfig.table,
			finalConfig.foreignKey,
			finalConfig.localKey,
			finalConfig.orderBy
		);

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

		this.relationBuilder.addHasOne(
			relationName as string,
			finalConfig.table,
			finalConfig.foreignKey,
			finalConfig.localKey
		);

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

		this.relationBuilder.addBelongsTo(
			relationName as string,
			finalConfig.table,
			finalConfig.foreignKey,
			finalConfig.ownerKey
		);

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

	orderByDistance<K extends keyof ExtractTableType<TTable>>(
		field: K,
		fromPoint: Point
	): QueryBuilder<TTable, TLoaded> {
		this.orderByField = `${field as string} <-> point(${fromPoint.x}, ${fromPoint.y})`;
		this.orderDirection = 'ASC';
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

	async execute(): Promise<WithLoadedRelations<TTable, TLoaded>[]> {
		const conn = this.getConnection();
		const selectClause = this.relationBuilder.buildSelectWithRelations(
			this.tableAlias,
			this.selectFields
		);
		const whereClause = this.whereBuilder.buildWhereClause();
		const joinClause = this.relationBuilder.buildRelationJoins(this.tableAlias);
		const groupClause = this.relationBuilder.buildAutoGroupBy(this.tableAlias, this.groupByFields);

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

		const selectClause = this.relationBuilder.buildSelectWithRelations(
			this.tableAlias,
			this.selectFields
		);
		const whereClause = this.whereBuilder.buildWhereClause();
		const joinClause = this.relationBuilder.buildRelationJoins(this.tableAlias);
		const groupClause = this.relationBuilder.buildAutoGroupBy(this.tableAlias, this.groupByFields);

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
		const whereClause = this.whereBuilder.buildWhereClause();
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

		const processedData = this.convertPointsToSQL(data);

		const [inserted] = await conn`
      INSERT INTO ${sql.unsafe(this.table)} ${sql(processedData)}
      RETURNING *
    `;
		return inserted;
	}

	async insertMany(
		dataArray: Partial<ExtractTableType<TTable>>[]
	): Promise<ExtractTableType<TTable>[]> {
		const conn = this.getConnection();

		if (!dataArray || dataArray.length === 0) {
			return [];
		}

		const processedData = dataArray.map((data) => {
			const record = { ...data };

			if (!('id' in record)) {
				(record as any).id = generateULID();
			}

			return this.convertPointsToSQL(record);
		});

		const inserted = await conn`
    INSERT INTO ${sql.unsafe(this.table)} ${sql(processedData)}
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

		const processedData = this.convertPointsToSQL(data);

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
      INSERT INTO ${sql.unsafe(this.table)} ${sql(processedData)}
      ON CONFLICT (${sql.unsafe(conflictColumns)})
      DO UPDATE SET ${sql.unsafe(updateSet)}
      RETURNING *
    `;

		return upserted;
	}

	async update(data: Partial<ExtractTableType<TTable>>): Promise<ExtractTableType<TTable>[]> {
		const conn = this.getConnection();
		const whereClause = this.whereBuilder.buildWhereClause();
		return await conn`
      UPDATE ${sql.unsafe(this.table)}
      SET ${sql(data)}
      ${whereClause.sql}
      RETURNING *
    `;
	}

	async delete(): Promise<boolean> {
		const conn = this.getConnection();
		const whereClause = this.whereBuilder.buildWhereClause();
		const [deleted] = await conn`
      DELETE FROM ${sql.unsafe(this.table)}
      ${whereClause.sql}
      RETURNING id
    `;
		return !!deleted;
	}

	private convertPointsToSQL(data: any): any {
		for (const key in data) {
			const value = data[key];
			if (value?.x !== undefined && value?.y !== undefined) {
				data[key] = sql.unsafe(`point(${value.x}, ${value.y})`);
			}
		}
		return data;
	}
}
