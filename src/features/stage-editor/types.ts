export interface Workflow {
  workflow_id: string;
  name: string;
  creation_date: Date;
  end_date: Date | null;
  ticketCount: number;
  progress: number;
}

export interface Module {
  module_id: string;
  name: string;
  creation_date: Date;
  end_date: Date | null;
  workflows: Workflow[];
}

export interface Phase {
  phase_id: string;
  number: number | null;  // null = soft-deleted; active phases always have a number
  name: string;
  description: string;
  creation_date: Date;
  end_date: Date | null;
  modules: Module[];
}
