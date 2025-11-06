import type { Col, ColumnConfig, ColumnType, EnumConfig, ForeignKeyConfig } from './types';

export class ColumnBuilder<T extends Col = Col> {
	private config: T;

	constructor(config: T) {
		this.config = { ...config };
	}

	primaryKey(): ColumnBuilder<T & { primaryKey: true; nullable: false }> {
		this.config.primaryKey = true;
		this.config.nullable = false;
		return this as any;
	}

	notNull(): ColumnBuilder<T & { nullable: false }> {
		this.config.nullable = false;
		return this as any;
	}

	nullable(): ColumnBuilder<T & { nullable: true }> {
		this.config.nullable = true;
		return this as any;
	}

	unique(): ColumnBuilder<T & { unique: true }> {
		this.config.unique = true;
		return this as any;
	}

	default<V extends string | number | boolean>(value: V): ColumnBuilder<T & { default: V }> {
		this.config.default = value;
		return this as any;
	}

	defaultNow(): ColumnBuilder<T & { default: 'CURRENT_TIMESTAMP' }> {
		this.config.default = 'CURRENT_TIMESTAMP';
		return this as any;
	}

	onUpdateNow(): ColumnBuilder<T & { onUpdate: 'CURRENT_TIMESTAMP' }> {
		this.config.onUpdate = 'CURRENT_TIMESTAMP';
		return this as any;
	}

	index(): ColumnBuilder<T & { index: true }> {
		this.config.index = true;
		return this as any;
	}

	references(table: string, column: string = 'id'): ColumnBuilder<T & ForeignKeyConfig> {
		(this.config as any).references = { table, column };
		return this as any;
	}

	valueOf(): T {
		return this.config;
	}

	[Symbol.toPrimitive](): T {
		return this.config;
	}
}

const createCol = <T extends ColumnType>(type: T): ColumnConfig & { type: T } => ({
	type: type as any
});

export const text = () => new ColumnBuilder(createCol('TEXT'));
export const integer = () => new ColumnBuilder(createCol('INTEGER'));
export const decimal = () => new ColumnBuilder(createCol('DECIMAL'));
export const boolean = () => new ColumnBuilder(createCol('BOOLEAN'));
export const timestamp = () => new ColumnBuilder(createCol('TIMESTAMP'));
export const date = () => new ColumnBuilder(createCol('DATE'));
export const json = () => new ColumnBuilder(createCol('JSON'));
export const jsonb = () => new ColumnBuilder(createCol('JSONB'));
export const money = () => new ColumnBuilder(createCol('MONEY'));
export const ulid = () => new ColumnBuilder(createCol('TEXT'));
export const serial = () => new ColumnBuilder(createCol('SERIAL'));

export const enums = <const T extends readonly string[]>(...values: T) => {
	return new ColumnBuilder<EnumConfig<T[number]>>({
		type: 'ENUM' as any,
		values: values as any
	} as any);
};

export const column = <T extends ColumnConfig | ForeignKeyConfig>(config: T): T => config;
