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
  /** Set to false to hide the top-right "New Issue" button */
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
  showNewIssueButton = false, // Default to false when opening from a ticket
  onSelectIssue,
  onIssueCreated,
}) => {
  const [issues, setIssues] = useState<IssueItem[]>(initialIssues);
  const [selectedIssue, setSelectedIssue] = useState<IssueItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Handle adding a new issue from the form
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
    onOpenChange(false); // Closes modal after linking
  };

  return (
    <>
      {/* Main Table Modal */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl p-0 gap-0 border-none bg-card rounded-2xl overflow-hidden shadow-2xl">
          {/* Compartmentalized Issue Table / List */}
          <IssueBox
            title="Project Issues"
            issues={issues}
            itemsPerPage={5}
            showNewIssueButton={showNewIssueButton}
            onLinkIssue={handleLinkIssue} // 👈 Links row to ticket
            onIssueClick={(issue) => setSelectedIssue(issue)}
            onNewIssueClick={() => setIsCreateModalOpen(true)}
            className="border-none shadow-none rounded-none bg-transparent"
          />
        </DialogContent>
      </Dialog>

      {/* Popup 1: Issue Details View */}
      <IssueDetailsModal
        issue={selectedIssue}
        open={Boolean(selectedIssue)}
        onClose={() => setSelectedIssue(null)}
      />

      {/* Popup 2: New Issue Reporting Form */}
      <IssueReportingModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSubmitSuccess={handleCreateSuccess}
      />
    </>
  );
};

export default IssueTableModal;