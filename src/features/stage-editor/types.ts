export interface Workflow {
	workflow_id: string;
	number: number | null; // null = soft-deleted; active workflows always have a number
	name: string;
	planStart: Date;
	planEnd: Date | null;
	actualStart: Date | null;
	actualEnd: Date | null; // computed: date last ticket finished
	ticketCount: number;
	progress: number;
}

export interface Module {
	module_id: string;
	name: string;
	planStart: Date;
	planEnd: Date | null;
	actualStart: Date | null;
	actualEnd: Date | null; // computed: max of child workflow actualEnd
	workflows: Workflow[];
}

export interface Phase {
	phase_id: string;
	number: number | null; // null = soft-deleted; active phases always have a number
	name: string;
	description: string;
	planStart: Date;
	planEnd: Date | null;
	actualStart: Date | null;
	actualEnd: Date | null; // computed: max of child module finish_dates
	modules: Module[];
}
