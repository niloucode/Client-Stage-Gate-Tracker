export interface Workflow {
	workflow_id: string;
	name: string;
	creation_date: Date;
	deadline_date: Date | null;
	end_date: Date | null; // computed: date last ticket finished
	ticketCount: number;
	progress: number;
}

export interface Module {
	module_id: string;
	name: string;
	creation_date: Date;
	deadline_date: Date | null;
	end_date: Date | null; // computed: max of child workflow end_dates
	workflows: Workflow[];
}

export interface Phase {
	phase_id: string;
	number: number | null; // null = soft-deleted; active phases always have a number
	name: string;
	description: string;
	creation_date: Date;
	deadline_date: Date | null;
	end_date: Date | null; // computed: max of child module end_dates
	modules: Module[];
}
