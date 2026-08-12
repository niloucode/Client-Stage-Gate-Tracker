"use client";

import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  IssueBox,
  IssueDetailsModal,
  IssueItem,
  MOCK_ISSUES,
} from "./IssueDashboard";
import { IssueReportingModal, IssueFormState } from "./IssueReportingModal";

export interface IssueTableModalProps {
  /** Controls if the popup modal is visible */
  open: boolean;
  /** Callback fired when closing the modal */
  onOpenChange: (open: boolean) => void;
  /** List of issues to display (defaults to mock issues if omitted) */
  issues?: IssueItem[];
  /** Set to false to hide the "New Issue" button */
  showNewIssueButton?: boolean;
  /** Callback fired when an issue is selected/linked by clicking its row "Link" button */
  onSelectIssue?: (issue: IssueItem) => void;
  /** Optional callback when a new issue is submitted */
  onIssueCreated?: (newIssue: IssueItem) => void;
}

export const IssueTableModal: React.FC<IssueTableModalProps> = ({
  open,
  onOpenChange,
  issues: initialIssues = MOCK_ISSUES,
  showNewIssueButton = false,
  onSelectIssue,
  onIssueCreated,
}) => {
  const [issues, setIssues] = useState<IssueItem[]>(initialIssues);
  const [selectedIssue, setSelectedIssue] = useState<IssueItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreateSuccess = (formData: IssueFormState) => {
    const now = new Date();
    const newIssue: IssueItem = {
      id: `iss-${Date.now()}`,
      name: formData.name,
      type: formData.type || "other",
      specificType: formData.specificType,
      urgency: formData.urgency,
      status: "unlinked",
      clientName: "Current User",
      reportedAt: `${now.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      })}, ${now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })}`,
      description: formData.description,
      systemEnv: formData.systemEnv,
      timeOfError: formData.timeOfError || "Just now",
      steps: formData.steps,
    };

    setIssues((prev) => [newIssue, ...prev]);
    onIssueCreated?.(newIssue);
    setIsCreateModalOpen(false);
  };

  const handleLinkIssue = (issue: IssueItem) => {
    onSelectIssue?.(issue);
    onOpenChange(false);
  };

  return (
    <>
      {/* Main Table Modal */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl p-0 gap-0 border-none bg-card rounded-2xl overflow-hidden shadow-2xl">
          <IssueBox
            title="Project Issues"
            issues={issues}
            itemsPerPage={5}
            showNewIssueButton={showNewIssueButton}
            onLinkIssue={handleLinkIssue}
            onIssueClick={(issue) => setSelectedIssue(issue)}
            onNewIssueClick={() => setIsCreateModalOpen(true)}
            className="border-none shadow-none rounded-none bg-transparent"
          />
        </DialogContent>
      </Dialog>

      {/* Child Modal 1: Issue Details View */}
      <IssueDetailsModal
        issue={selectedIssue}
        open={Boolean(selectedIssue)}
        onClose={() => setSelectedIssue(null)}
      />

      {/* Child Modal 2: New Issue Reporting Form */}
      <IssueReportingModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSubmitSuccess={handleCreateSuccess}
      />
    </>
  );
};

export default IssueTableModal;