"use client";

import { ScrollText, FileText, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PendingContract {
  id: string;
  documentName: string;
  projectName: string;
  uploadedAt: string;
  status: string;
  onReview?: () => void;
}

interface PendingContractsProps {
  contracts?: PendingContract[];
  pendingCount?: number;
}

const PLACEHOLDER: PendingContract[] = [
  {
    id: "1",
    documentName: "Master Services Agreement",
    projectName: "Nexus Dynamics",
    uploadedAt: "Uploaded Oct 20",
    status: "Pending Signature",
  },
];

function StatusDot() {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: "#f59e0b" }}
      />
      <span className="text-[12px] font-semibold" style={{ color: "#b45309" }}>
        Pending Signature
      </span>
    </div>
  );
}

export function PendingContracts({
  contracts = PLACEHOLDER,
  pendingCount = 1,
}: PendingContractsProps) {
  return (
    <Card
      className="overflow-hidden"
      style={{ border: "1px solid #c7c4d8", borderRadius: "12px" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-6 py-4"
        style={{ borderBottom: "1px solid #c7c4d8" }}
      >
        <ScrollText className="h-5 w-5" style={{ color: "#464555" }} />
        <span className="text-base font-semibold" style={{ color: "#151c27" }}>
          Contracts
        </span>
        <span
          className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
          style={{ backgroundColor: "#fef3c7", color: "#b45309" }}
        >
          {pendingCount} PENDING
        </span>
      </div>

      {/* Contract rows */}
      <div className="flex flex-col gap-3 p-4">
        {contracts.map((contract) => (
          <div
            key={contract.id}
            className="flex items-center justify-between rounded-lg px-4 py-3"
            style={{
              backgroundColor: "#f0f3ff",
              border: "1px solid #c7c4d8",
            }}
          >
            {/* Left: PDF icon + document info */}
            <div className="flex items-center gap-4">
              {/* PDF icon card */}
              <div
                className="flex h-12 w-10 shrink-0 flex-col items-center justify-center gap-0.5 rounded"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #c7c4d8",
                }}
              >
                <FileText className="h-4 w-4" style={{ color: "#ba1a1a" }} />
                <span
                  className="text-[8px] font-bold"
                  style={{ color: "#c7c4d8" }}
                >
                  PDF
                </span>
              </div>

              {/* Document + project + status */}
              <div className="flex gap-8">
                <div className="flex flex-col gap-0.5">
                  <span
                    className="text-[11px] font-bold uppercase"
                    style={{ color: "#777587" }}
                  >
                    Document
                  </span>
                  <span
                    className="text-base font-normal"
                    style={{ color: "#151c27" }}
                  >
                    {contract.documentName}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span
                    className="text-[11px] font-bold uppercase"
                    style={{ color: "#777587" }}
                  >
                    Project
                  </span>
                  <span
                    className="text-[13px] font-normal"
                    style={{ color: "#151c27" }}
                  >
                    {contract.projectName}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span
                    className="text-[11px] font-bold uppercase"
                    style={{ color: "#777587" }}
                  >
                    Status
                  </span>
                  <StatusDot />
                </div>
              </div>
            </div>

            {/* Right: date + action button */}
            <div className="flex flex-col items-end gap-2">
              <span className="text-[11px]" style={{ color: "#464555" }}>
                {contract.uploadedAt}
              </span>
              <Button
                size="sm"
                onClick={contract.onReview}
                className="flex items-center gap-1.5 rounded text-[13px] font-semibold text-white"
                style={{ backgroundColor: "#4f46e5" }}
              >
                Review and sign
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default PendingContracts;
