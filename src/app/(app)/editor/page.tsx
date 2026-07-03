"use client";

import TopNav from "@/shared/ui/TopNav";
import Sidebar from '@/shared/ui/sidebar';

import { useState, useRef } from "react";
import {
  PhaseStepper,
  ActivePhaseDetails,
  ModulesCard,
} from "@/features/project-editor";

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

const defaultPhases: Phase[] = [
  { 
    number: 1, 
    name: "Phase 1", 
    subtitle: "Discovery", 
    description: "Initial market research, competitor analysis, and requirement gathering from stakeholders.",
    modules: [
      {
        id: "1",
        name: "Authentication & Identity",
        description: "Implementation of Security Features",
        roles: ["Frontend", "Backend", "DevOps"],
        workflows: [
          {
            id: "1",
            name: "User Login Flow",
            tags: ["Frontend"],
            ticketCount: 8,
            progress: 75,
          },
          {
            id: "2",
            name: "Password Reset",
            tags: ["Backend"],
            ticketCount: 3,
            progress: 30,
          },
        ],
      },
    ]
  },
  { 
    number: 2, 
    name: "Phase 2", 
    subtitle: "Core Dev", 
    description: "Implementation of core backend services, identity provider integration, and primary user dashboards.",
    modules: [
      {
        id: "1",
        name: "Authentication & Identity",
        description: "Implementation of Security Features",
        roles: ["Frontend", "Backend", "DevOps"],
        workflows: [
          {
            id: "1",
            name: "User Login Flow",
            tags: ["Frontend"],
            ticketCount: 8,
            progress: 75,
          },
          {
            id: "2",
            name: "Password Reset",
            tags: ["Backend"],
            ticketCount: 3,
            progress: 30,
          },
        ],
      },
    ]
  },
  { 
    number: 3, 
    name: "Phase 3", 
    subtitle: "Production", 
    description: "Internal beta testing, user acceptance testing, and performance optimization.",
    modules: []
  },
];

export default function EditorPage() {
  const [phases, setPhases] = useState<Phase[]>(defaultPhases);
  const [activePhase, setActivePhase] = useState(2);
  const stepperRef = useRef<{ openCreateModal: () => void } | null>(null);

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      <Sidebar>
        <TopNav breadcrumbs={["Acesoft", "Project Alpha", "Project Structure"]} />
      <div className="max-w-[1400px] mx-auto p-8">
        {/* Header */}
        <div className="flex justify-between items-end pb-6 mb-6 border-b border-[#E2E8F0]">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
              Structure Editor
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              Define project phases, modules, and workflows.
            </p>
          </div>
          <button 
            onClick={() => stepperRef.current?.openCreateModal()}
            className="flex items-center gap-2 px-4 py-2 bg-[#4F46E5] text-white rounded-lg hover:bg-[#4338CA] transition-all shadow-sm"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 1V13M1 7H13"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="font-semibold text-sm">Add Phase</span>
          </button>
        </div>

        {/* Stage-Gate Pipeline Stepper */}
        <PhaseStepper 
          ref={stepperRef}
          phases={phases}
          setPhases={setPhases}
          activePhase={activePhase} 
          setActivePhase={setActivePhase} 
        />

        {/* Active Phase Details Editor */}
        <ActivePhaseDetails 
          activePhase={activePhase}
          phases={phases}
          setPhases={setPhases}
        />

        {/* Modules & Workflows Area */}
        <ModulesCard 
          activePhase={activePhase}
          phases={phases}
          setPhases={setPhases}
        />
      </div>
      </Sidebar>
    </div>
  );
}