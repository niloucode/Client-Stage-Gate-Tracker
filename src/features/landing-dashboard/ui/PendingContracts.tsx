"use client";

import { useState } from "react";
import {
  ScrollText,
  FileText,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/* -------------------------------------------------------------------------- */
/*                                 Interfaces                                 */
/* -------------------------------------------------------------------------- */

export interface PendingContract {
  id: string;
  documentName: string;
  projectName: string;
  uploadedAt: string;
  status: string;
  onReview?: () => void;
}

export interface PendingContractsProps {
  contracts?: PendingContract[];
  pendingCount?: number;
}

/* -------------------------------------------------------------------------- */
/*                                 Placeholders                               */
/* -------------------------------------------------------------------------- */

const MOCK_EXTENDED_CONTRACTS: PendingContract[] = Array.from(
  { length: 25 },
  (_, i) => ({
    id: `contract-${i + 1}`,
    documentName: `Master Services Agreement #${i + 1}`,
    projectName: ["Nexus Dynamics", "Apex Horizon", "SaaS Portal", "Vortex AI"][i % 4],
    uploadedAt: `Uploaded Oct ${20 - (i % 10)}`,
    status: i % 4 === 0 ? "Under Review" : "Pending Signature",
  })
);

/* -------------------------------------------------------------------------- */
/*                              Sub-Components                                */
/* -------------------------------------------------------------------------- */

function StatusBadge({ status }: { status: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2 w-2 shrink-0 rounded-sm bg-amber-500" />
      <span className="truncate text-xs font-normal text-amber-800 dark:text-amber-400">
        {status}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */

export function PendingContracts({
  contracts = MOCK_EXTENDED_CONTRACTS,
  pendingCount = 25,
}: PendingContractsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const totalPages = Math.ceil(contracts.length / pageSize);
  const paginatedContracts = contracts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const renderContractRows = (items: PendingContract[]) =>
    items.map((contract) => (
      <div
        key={contract.id}
        className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-md border border-brand-100 bg-muted/30 p-4 transition-colors"
      >
        {/* Left: Document Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-background">
          <FileText className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* Center: Fixed 3-Column Grid for consistent alignment */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1.75fr_1fr_1fr] sm:items-center">
          {/* Document Name Column */}
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-normal uppercase text-muted-foreground">
              Document
            </span>
            <h4
              className="truncate text-sm font-normal text-foreground"
              title={contract.documentName}
            >
              {contract.documentName}
            </h4>
          </div>

          {/* Project Name Column */}
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-normal uppercase text-muted-foreground">
              Project
            </span>
            <h4
              className="truncate text-xs font-normal text-foreground sm:text-sm"
              title={contract.projectName}
            >
              {contract.projectName}
            </h4>
          </div>

          {/* Status Column */}
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-normal uppercase text-muted-foreground">
              Status
            </span>
            <StatusBadge status={contract.status} />
          </div>
        </div>

        {/* Right: Review & Sign Button */}
        <div className="flex items-center justify-end shrink-0 pl-2">
          <Button size="sm" onClick={contract.onReview}>
            <span>Review and Sign</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    ));

  return (
    <Card className="m-0 flex w-full flex-col gap-0 overflow-hidden rounded-md border border-brand-100 p-0 shadow-none">
      <Dialog>
        {/* Card Header */}
        <div className="flex items-center justify-between gap-3 border-b border-brand-100 bg-muted/30 px-6 py-4">
          <div className="flex items-center gap-3">
            <ScrollText className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-base font-normal text-foreground">Contracts</h3>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-normal text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              {pendingCount} PENDING
            </span>
          </div>

          <DialogTrigger>
            <button
              type="button"
              className="text-xs font-normal underline-offset-2 hover:underline"
            >
              <h4 className="hover:text-brand-600! font-normal underline decoration-inherit">
                View All
              </h4>
            </button>
          </DialogTrigger>
        </div>

        {/* Dashboard Preview List (First 3 items) */}
        <div className="flex flex-col gap-3 p-4">
          {renderContractRows(contracts.slice(0, 3))}
        </div>

        {/* POPUP MODAL DIALOG WITH 10 ROWS & PAGINATION */}
        <DialogContent className="flex max-h-[85vh] w-full max-w-4xl flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="m-0 border-b border-brand-100 bg-muted/30 px-8 pt-6 pb-5">
            <DialogTitle className="flex items-center gap-2 text-base font-normal">
              <ScrollText className="h-5 w-5 text-muted-foreground" />
              Pending Contracts
              <span className="ml-2 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-normal text-amber-800">
                {contracts.length} TOTAL
              </span>
            </DialogTitle>
          </DialogHeader>

          {/* Modal Scrollable List (10 Items Per Page) */}
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-8">
            {renderContractRows(paginatedContracts)}
          </div>

          {/* Pagination Controls Footer */}
          <div className="flex items-center justify-between border-t border-brand-100 bg-muted/30 px-8 py-4">
            <span className="text-xs text-muted-foreground">
              Showing{" "}
              <span className="text-foreground">
                {(currentPage - 1) * pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="text-foreground">
                {Math.min(currentPage * pageSize, contracts.length)}
              </span>{" "}
              of <span className="text-foreground">{contracts.length}</span> contracts
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-normal text-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default PendingContracts;