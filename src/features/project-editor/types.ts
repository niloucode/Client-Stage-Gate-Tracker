export interface Workflow {
  id: string;
  name: string;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  ticketCount: number;
  progress: number;
}

export interface Module {
  id: string;
  name: string;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  workflows: Workflow[];
}

export interface Phase {
  number: number;
  name: string;
  description: string;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  modules: Module[];
}