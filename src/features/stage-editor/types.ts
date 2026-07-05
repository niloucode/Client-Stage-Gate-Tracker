export interface Workflow {
  workflow_id: string;
  name: string;
  start_date: Date | null;
  end_date: Date | null;
  creation_date: Date;
  ticketCount: number;
  progress: number;
}

export interface Module {
  module_id: string;
  name: string;
  start_date: Date | null;
  end_date: Date | null;
  creation_date: Date;
  workflows: Workflow[];
}

export interface Phase {
  phase_id: string;
  number: number | null;  // null = soft-deleted; active phases always have a number
  name: string;
  description: string;
  start_date: Date | null;
  end_date: Date | null;
  creation_date: Date;
  modules: Module[];
}
