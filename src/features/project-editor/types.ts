export interface Workflow {
  id: string;
  name: string;
  tags: string[];
  ticketCount: number;
  progress: number;
}

export interface Module {
  id: string;
  name: string;
  description: string;
  roles: string[];
  workflows: Workflow[];
}

export interface Phase {
  number: number;
  name: string;
  subtitle: string;
  description: string;
  modules: Module[];
}
