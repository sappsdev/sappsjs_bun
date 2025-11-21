import { sql } from 'bun';
import type { Point, WhereCondition, WhereOperator } from '../types';

export class WhereBuilder {
	private whereClauses: WhereCondition[] = [];

	where(field: string, operator: WhereOperator | any, value?: any): this {
		if (value === undefined) {
			value = operator;
			operator = '=';
		}
		this.whereClauses.push({
			field,
			operator,
			value,
			connector: 'AND'
		});
		return this;
	}

	orWhere(field: string, operator: WhereOperator | any, value?: any): this {
		if (value === undefined) {
			value = operator;
			operator = '=';
		}
		this.whereClauses.push({
			field,
			operator,
			value,
			connector: 'OR'
		});
		return this;
	}

	whereBetween(field: string, start: any, end: any): this {
		this.whereClauses.push({
			field,
			operator: 'BETWEEN',
			value: [start, end],
			connector: 'AND'
		});
		return this;
	}

	orWhereBetween(field: string, start: any, end: any): this {
		this.whereClauses.push({
			field,
			operator: 'BETWEEN',
			value: [start, end],
			connector: 'OR'
		});
		return this;
	}

	whereNotBetween(field: string, start: any, end: any): this {
		this.whereClauses.push({
			field,
			operator: 'NOT BETWEEN',
			value: [start, end],
			connector: 'AND'
		});
		return this;
	}

	orWhereNotBetween(field: string, start: any, end: any): this {
		this.whereClauses.push({
			field,
			operator: 'NOT BETWEEN',
			value: [start, end],
			connector: 'OR'
		});
		return this;
	}

	whereWithinRadius(field: string, centerPoint: Point, radiusMeters: number): this {
		this.whereClauses.push({
			field,
			operator: '<->',
			value: { point: centerPoint, radius: radiusMeters },
			connector: 'AND'
		});
		return this;
	}

	whereInBoundingBox(field: string, topLeft: Point, bottomRight: Point): this {
		this.whereClauses.push({
			field,
			operator: '<@',
			value: { type: 'box', topLeft, bottomRight },
			connector: 'AND'
		});
		return this;
	}

	whereInPolygon(field: string, polygon: Point[]): this {
		this.whereClauses.push({
			field,
			operator: '<@',
			value: { type: 'polygon', points: polygon },
			connector: 'AND'
		});
		return this;
	}

	search(searchTerm: string, fields: string[]): this {
		if (!searchTerm || fields.length === 0) return this;

		fields.forEach((field, index) => {
			const connector = index === 0 && this.whereClauses.length === 0 ? 'AND' : 'OR';
			this.whereClauses.push({
				field,
				operator: 'ILIKE',
				value: `%${searchTerm}%`,
				connector
			});
		});
		return this;
	}

	buildWhereClause() {
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
			} else if (clause.operator === 'BETWEEN' || clause.operator === 'NOT BETWEEN') {
				parts.push(sql.unsafe(`${clause.field} ${clause.operator} `));
				parts.push(sql`${clause.value[0]}`);
				parts.push(sql.unsafe(` AND `));
				parts.push(sql`${clause.value[1]}`);
			} else if (clause.operator === '<->') {
				const { point, radius } = clause.value;
				parts.push(sql.unsafe(`${clause.field} <-> point(${point.x}, ${point.y}) <= ${radius}`));
			} else if (clause.operator === '<@') {
				if (clause.value.type === 'box') {
					const { topLeft, bottomRight } = clause.value;
					parts.push(
						sql.unsafe(
							`${clause.field} <@ box(point(${topLeft.x}, ${topLeft.y}), point(${bottomRight.x}, ${bottomRight.y}))`
						)
					);
				} else if (clause.value.type === 'polygon') {
					const pointsStr = clause.value.points.map((p: Point) => `(${p.x}, ${p.y})`).join(', ');
					parts.push(sql.unsafe(`${clause.field} <@ polygon(path '(${pointsStr})')`));
				}
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

	getClauses(): WhereCondition[] {
		return this.whereClauses;
	}

	reset(): void {
		this.whereClauses = [];
	}
}
