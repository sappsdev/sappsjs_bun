import type { CronTask, FieldRange, ParsedCron, TaskEntry } from './types';

const FIELD_RANGES = {
	second: { min: 0, max: 59 },
	minute: { min: 0, max: 59 },
	hour: { min: 0, max: 23 },
	dayOfMonth: { min: 1, max: 31 },
	month: { min: 1, max: 12 },
	dayOfWeek: { min: 0, max: 6 }
} as const;

export class CronScheduler {
	private readonly tasks: Map<string, TaskEntry> = new Map();
	private idCounter: number = 0;
	private readonly maxSearchSeconds: number = 366 * 24 * 60 * 60;

	public schedule(expression: string, callback: CronTask): string {
		this.validateCallback(callback);

		const id = this.generateId();
		const parsed = this.parseExpression(expression);
		const entry: TaskEntry = {
			id,
			expression: parsed,
			timeoutId: null,
			callback
		};

		this.tasks.set(id, entry);
		this.scheduleNext(entry);

		return id;
	}

	public cancel(id: string): void {
		const entry = this.tasks.get(id);
		if (!entry) return;

		this.clearTimeout(entry);
		this.tasks.delete(id);
	}

	public clearAll(): void {
		const ids = Array.from(this.tasks.keys());
		ids.forEach((id) => this.cancel(id));
	}

	public getTaskCount(): number {
		return this.tasks.size;
	}

	public hasTask(id: string): boolean {
		return this.tasks.has(id);
	}

	private generateId(): string {
		this.idCounter += 1;
		return `cron-${Date.now()}-${this.idCounter}`;
	}

	private validateCallback(callback: CronTask): void {
		if (typeof callback !== 'function') {
			throw new TypeError('Callback must be a function');
		}
	}

	private parseExpression(expr: string): ParsedCron {
		const trimmed = expr.trim();
		if (!trimmed) {
			throw new Error('Cron expression cannot be empty');
		}

		const parts = trimmed.split(/\s+/);

		if (parts.length !== 5 && parts.length !== 6) {
			throw new Error(`Invalid cron expression: expected 5 or 6 fields, got ${parts.length}`);
		}

		if (parts.length === 6) {
			return {
				second: parts[0]!,
				minute: parts[1]!,
				hour: parts[2]!,
				dayOfMonth: parts[3]!,
				month: parts[4]!,
				dayOfWeek: parts[5]!
			};
		}

		return {
			second: '0',
			minute: parts[0]!,
			hour: parts[1]!,
			dayOfMonth: parts[2]!,
			month: parts[3]!,
			dayOfWeek: parts[4]!
		};
	}

	private clearTimeout(entry: TaskEntry): void {
		if (entry.timeoutId !== null) {
			clearTimeout(entry.timeoutId);
			entry.timeoutId = null;
		}
	}

	private scheduleNext(entry: TaskEntry): void {
		const nextDate = this.getNextExecution(entry.expression);

		if (nextDate === null) {
			console.warn(`No next execution found for task ${entry.id}`);
			return;
		}

		const delay = Math.max(0, nextDate.getTime() - Date.now());

		this.clearTimeout(entry);

		entry.timeoutId = setTimeout(async () => {
			await this.executeTask(entry);
			this.scheduleNext(entry);
		}, delay);
	}

	private async executeTask(entry: TaskEntry): Promise<void> {
		try {
			await entry.callback();
		} catch (error) {
			console.error(`Cron task error [${entry.id}]:`, error);
		}
	}

	private getNextExecution(expr: ParsedCron): Date | null {
		let candidate = this.getStartingDate();

		for (let i = 0; i < this.maxSearchSeconds; i++) {
			if (this.matchesExpression(expr, candidate)) {
				return candidate;
			}
			candidate = this.advanceBySecond(candidate);
		}

		return null;
	}

	private getStartingDate(): Date {
		const date = new Date(Date.now() + 1000);
		date.setMilliseconds(0);
		return date;
	}

	private advanceBySecond(date: Date): Date {
		return new Date(date.getTime() + 1000);
	}

	private matchesExpression(expr: ParsedCron, date: Date): boolean {
		return (
			this.matchField(expr.second, date.getSeconds(), FIELD_RANGES.second) &&
			this.matchField(expr.minute, date.getMinutes(), FIELD_RANGES.minute) &&
			this.matchField(expr.hour, date.getHours(), FIELD_RANGES.hour) &&
			this.matchField(expr.dayOfMonth, date.getDate(), {
				min: 1,
				max: this.getDaysInMonth(date)
			}) &&
			this.matchField(expr.month, date.getMonth() + 1, FIELD_RANGES.month) &&
			this.matchField(expr.dayOfWeek, date.getDay(), FIELD_RANGES.dayOfWeek)
		);
	}

	private matchField(field: string, value: number, range: FieldRange): boolean {
		const trimmed = field.trim();

		if (trimmed === '*') return true;

		if (trimmed.includes(',')) {
			return this.matchList(trimmed, value, range);
		}

		if (trimmed.includes('/')) {
			return this.matchStep(trimmed, value, range);
		}

		if (trimmed.includes('-')) {
			return this.matchRange(trimmed, value);
		}

		return this.matchSingleValue(trimmed, value);
	}

	private matchList(field: string, value: number, range: FieldRange): boolean {
		const parts = field.split(',');
		return parts.some((part) => this.matchField(part, value, range));
	}

	private matchStep(field: string, value: number, range: FieldRange): boolean {
		const [left, stepStr] = field.split('/');
		const step = Number(stepStr);

		if (!Number.isFinite(step) || step <= 0) {
			return false;
		}

		if (left === '*') {
			return (value - range.min) % step === 0;
		}

		if (left?.includes('-')) {
			const [startStr, endStr] = left.split('-');
			const start = Number(startStr);
			const end = Number(endStr);

			if (!Number.isFinite(start) || !Number.isFinite(end)) {
				return false;
			}

			if (value < start || value > end) {
				return false;
			}

			return (value - start) % step === 0;
		}

		const num = Number(left);
		if (Number.isFinite(num)) {
			return value === num && step === 1;
		}

		return false;
	}

	private matchRange(field: string, value: number): boolean {
		const [startStr, endStr] = field.split('-');
		const start = Number(startStr);
		const end = Number(endStr);

		if (!Number.isFinite(start) || !Number.isFinite(end)) {
			return false;
		}

		return value >= start && value <= end;
	}

	private matchSingleValue(field: string, value: number): boolean {
		const num = Number(field);
		return Number.isFinite(num) && value === num;
	}

	private getDaysInMonth(date: Date): number {
		return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
	}
}
