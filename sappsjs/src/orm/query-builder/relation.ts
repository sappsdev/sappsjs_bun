import { sql } from 'bun';
import type { Relation } from '../types';

export class RelationBuilder {
	private relations: Relation[] = [];

	addHasMany(
		relationName: string,
		table: string,
		foreignKey: string,
		localKey: string,
		orderBy?: string
	): this {
		this.relations.push({
			name: relationName,
			table,
			foreignKey,
			localKey,
			type: 'hasMany',
			orderBy: orderBy || 'created_at DESC'
		});
		return this;
	}

	addHasOne(relationName: string, table: string, foreignKey: string, localKey: string): this {
		this.relations.push({
			name: relationName,
			table,
			foreignKey,
			localKey,
			type: 'hasOne'
		});
		return this;
	}

	addBelongsTo(relationName: string, table: string, foreignKey: string, localKey: string): this {
		this.relations.push({
			name: relationName,
			table,
			foreignKey,
			localKey,
			type: 'belongsTo'
		});
		return this;
	}

	buildSelectWithRelations(tableAlias: string, selectFields: string[]): any {
		const baseSelect = selectFields.length > 0 ? selectFields.join(', ') : `${tableAlias}.*`;

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

	buildRelationJoins(tableAlias: string): any {
		if (this.relations.length === 0) return sql``;

		const joins = this.relations
			.map((rel) => {
				const relAlias = rel.table.charAt(0);

				if (rel.type === 'belongsTo') {
					return `LEFT JOIN ${rel.table} ${relAlias} ON ${tableAlias}.${rel.foreignKey} = ${relAlias}.${rel.localKey}`;
				} else {
					return `LEFT JOIN ${rel.table} ${relAlias} ON ${rel.localKey} = ${relAlias}.${rel.foreignKey}`;
				}
			})
			.join(' ');

		return sql.unsafe(joins);
	}

	buildAutoGroupBy(tableAlias: string, groupByFields: string[]): any {
		if (this.relations.length === 0 && groupByFields.length === 0) {
			return sql``;
		}

		if (groupByFields.length > 0) {
			return sql.unsafe(`GROUP BY ${groupByFields.join(', ')}`);
		}

		if (this.relations.some((r) => r.type === 'hasMany')) {
			return sql.unsafe(`GROUP BY ${tableAlias}.id`);
		}

		return sql``;
	}

	getRelations(): Relation[] {
		return this.relations;
	}

	hasRelations(): boolean {
		return this.relations.length > 0;
	}

	reset(): void {
		this.relations = [];
	}
}
