export type CronTask = () => Promise<void> | void;
export type TimeoutId = ReturnType<typeof setTimeout>;

export interface ParsedCron {
	readonly second: string;
	readonly minute: string;
	readonly hour: string;
	readonly dayOfMonth: string;
	readonly month: string;
	readonly dayOfWeek: string;
}

export interface TaskEntry {
	readonly id: string;
	readonly expression: ParsedCron;
	timeoutId: TimeoutId | null;
	readonly callback: CronTask;
}

export interface FieldRange {
	readonly min: number;
	readonly max: number;
}
