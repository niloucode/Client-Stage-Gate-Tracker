export interface Workflow {
	workflow_id: string;
	number: number | null; // null = soft-deleted; active workflows always have a number
	name: string;
	start_date: Date;
	deadline_date: Date | null;
	finish_date: Date | null; // computed: date last ticket finished
	ticketCount: number;
	progress: number;
}

export interface Module {
	module_id: string;
	name: string;
	start_date: Date;
	deadline_date: Date | null;
	finish_date: Date | null; // computed: max of child workflow finish_dates
	workflows: Workflow[];
}

export interface Phase {
	phase_id: string;
	number: number | null; // null = soft-deleted; active phases always have a number
	name: string;
	description: string;
	start_date: Date;
	deadline_date: Date | null;
	finish_date: Date | null; // computed: max of child module finish_dates
	modules: Module[];
}
