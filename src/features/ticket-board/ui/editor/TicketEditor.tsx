"use client";

import { X, Plus, Calendar } from "lucide-react";

import { Ticket, Tag } from "@/entities/types";
import { useProfiles } from "@/entities/profile";
import { useTicketImages, useTicketComments } from "@/entities/comment/queries";
import { status as StatusEnum } from "@/lib/generated/prisma";
import ImageLightbox from "@/shared/ui/image-lightbox";
import { Avatar, Button, FormInput, Label } from "@/components/ui";

import TicketModalEdit from "../TicketModals";
import { useTicketEditor } from "./useTicketEditor";
import {
  TicketTitleAndStatus,
  TicketAssignees,
  TicketApiDetails,
  TicketSchedule,
  SubtaskSelectionModal,
} from "./TicketEditorSubcomponents";
import { TicketActivitySection } from "./TicketActivitySection";

export default function TicketEditor({
  initialTicket,
  tags,
  onClose,
  onUpdate,
  allTickets = [],
  isSubtaskView = false,
  parentTicket = null,
}: {
  initialTicket: Ticket;
  tags: Tag[];
  onClose: () => void;
  onUpdate: (t: Ticket) => void;
  allTickets?: Ticket[];
  isSubtaskView?: boolean;
  parentTicket?: Ticket | null;
}) {
  const { data: profiles = [] } = useProfiles();
  const { data: comments = [] } = useTicketComments(initialTicket.ticket_id);
  const { data: ticketImages = [] } = useTicketImages(initialTicket.ticket_id);

  const state = useTicketEditor({
    initialTicket,
    tags,
    onUpdate,
    onClose,
    isSubtaskView,
    allTickets,
  });

  return (
    <div className="flex flex-col h-full bg-neutral-surface">
      {/* 1. Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
        <span className="font-mono text-sm text-brand-500">
          {isSubtaskView ? "Subtask" : "LRN-BNN"}
        </span>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X className="text-neutral-border hover:text-foreground transition-all duration-300" />
        </Button>
      </div>

      {/* Parent Info */}
      {isSubtaskView && parentTicket && (
        <div className="px-5 py-3 border-b border-gray-100 bg-brand-50/50">
          <p className="text-xs text-muted-foreground">
            Parent:{" "}
            <span className="font-medium text-foreground">
              {parentTicket.name}
            </span>
          </p>
        </div>
      )}

      {/* 2. Title & Status */}
      <TicketTitleAndStatus
        ticket={state.ticket}
        tags={tags}
        selectedTags={state.selectedTags}
        setTicket={state.setTicket}
        setSelectedTags={state.setSelectedTags}
      />

      <div className="flex-1 overflow-y-auto scrollbar-gutter-stable pb-24">
        <div className="px-5 py-4 flex flex-col gap-4 border-b border-gray-100">
          {/* 3. Assignees & 4. API Details & 5. Schedule */}
          <TicketAssignees
            ticket={state.ticket}
            profiles={profiles}
            setTicket={state.setTicket}
          />
          {state.isApiTagSelected && (
            <TicketApiDetails
              apiMethod={state.apiMethod}
              apiRoute={state.apiRoute}
              setApiMethod={state.setApiMethod}
              setApiRoute={state.setApiRoute}
            />
          )}
          <TicketSchedule
            ticket={state.ticket}
            setTicket={state.setTicket}
            showDateError={state.showDateError}
          />
        </div>

        {/* 6. Description */}
        <div className="px-5 py-4 border-b border-gray-100">
          <Label className="text-md -mb-4 text-neutral-border font-bold tracking-wider uppercase">
            DESCRIPTION
          </Label>
          <FormInput
            variant="textarea"
            label=""
            maxLength={360}
            rows={4}
            value={state.ticket.description ?? ""}
            placeholder="Add a description..."
            onChange={(e) =>
              state.setTicket((t) => ({ ...t, description: e.target.value }))
            }
          />
        </div>

        {/* 7. Subtasks */}
        {!isSubtaskView &&
          (() => {
            const totalSubtasks = state.subtasks.length;
            const finishedSubtasks = state.subtasks.filter(
              (s) => s.status === StatusEnum.FINISHED,
            ).length;
            const progressPct =
              totalSubtasks > 0 ? (finishedSubtasks / totalSubtasks) * 100 : 0;

            return (
              <div className="px-5 mt-5 space-y-3">
                {/* Header: Title & Completion Count */}
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-foreground">
                    Subtasks
                  </h3>
                  <span className="text-xs font-medium text-muted-foreground">
                    {finishedSubtasks} of {totalSubtasks} complete
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-subtle">
                  <div
                    className="h-full rounded-full bg-brand-500 transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                {/* Scrollable Subtasks List */}
                <div className="max-h-56 overflow-y-auto space-y-2 pr-0.5">
                  {totalSubtasks === 0 ? (
                    <div className="py-6 text-center text-xs italic text-muted-foreground border border-dashed border-gray-200 rounded-md">
                      No subtasks yet.
                    </div>
                  ) : (
                    state.subtasks.map((subtask) => {
                      const isDone = subtask.status === StatusEnum.FINISHED;
                      const isInProgress =
                        subtask.status === StatusEnum.IN_PROGRESS;

                      return (
                        <div
                          key={subtask.ticket_id}
                          onClick={() => state.handleSubtaskClick(subtask)}
                          className="group relative flex items-center justify-between p-3 bg-neutral-surface border border-gray-200 rounded-md hover:border-brand-300 hover:bg-brand-50/20 cursor-pointer transition-all"
                        >
                          {/* Left: Code, Title, Date */}
                          <div className="flex flex-col min-w-0 flex-1 pr-3">
                            <span className="font-mono text-xs font-semibold text-brand-500">
                              ASC-1028
                            </span>
                            <h4 className="text-sm font-semibold text-foreground truncate mt-0.5">
                              {subtask.name}
                            </h4>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                              <Calendar
                                size={12}
                                className="text-muted-foreground shrink-0"
                              />
                              <span>
                                {subtask.plan_end_at
                                  ? new Date(
                                      subtask.plan_end_at,
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })
                                  : "No date"}
                              </span>
                            </div>
                          </div>

                          {/* Right: Status Badge + Assignee + Remove Button */}
                          <div className="flex items-center mb-auto gap-2 shrink-0">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                isDone
                                  ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                                  : isInProgress
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                              }`}
                            >
                              {isDone
                                ? "Done"
                                : isInProgress
                                ? "In Progress"
                                : "Pending"}
                            </span>
                            {/* Remove Button on Hover */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                state.handleRemoveSubtask(subtask.ticket_id);
                              }}
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                              title="Remove subtask"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Dashed Add Subtask Button (Outside Scroll Region) */}
                <button
                  type="button"
                  onClick={() => state.setIsSubtaskSelectionOpen(true)}
                  className="w-full border-2 border-dashed border-gray-200 hover:border-brand-300 hover:bg-brand-50/20 rounded-md py-2.5 text-center text-xs font-semibold text-gray-500 hover:text-brand-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} strokeWidth={2.5} />
                  <span>Add subtask</span>
                </button>
              </div>
            );
          })()}

        {/* 8. Attachments */}
        {ticketImages.length > 0 && (
          <div className="px-5 mt-5">
            <p className="text-sm font-semibold text-neutral-border mb-2 uppercase tracking-wider">
              Attachments
            </p>
            <div className="flex flex-wrap gap-2">
              {ticketImages.map((img) => (
                <img
                  key={img.image_id}
                  src={img.image_src}
                  alt="attachment"
                  className="h-16 w-auto rounded-md border border-gray-200 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => state.setLightboxSrc(img.image_src)}
                />
              ))}
            </div>
          </div>
        )}

        {/* 9. Activity */}
        <TicketActivitySection
          ticketId={state.ticket.ticket_id}
          comments={comments}
          currentUser={state.user}
          onImageClick={state.setLightboxSrc}
        />
      </div>

      {/* 10. Footer */}
      <div className="fixed bottom-0 right-0 w-160 flex items-center justify-end gap-3 px-5 py-3.5 border-t border-gray-100 shrink-0 bg-neutral-surface z-50">
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-medium text-gray-500 px-4 py-2 rounded-md hover:bg-gray-100"
        >
          Cancel
        </button>
        <Button onClick={state.handleSave} disabled={state.isSaving}>
          {state.isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Modals */}
      {state.lightboxSrc && (
        <ImageLightbox
          src={state.lightboxSrc}
          onClose={() => state.setLightboxSrc(null)}
        />
      )}

      {state.isSubtaskViewOpen && state.selectedSubtask && (
        <TicketModalEdit
          mode="edit"
          ticket={state.selectedSubtask}
          isOpen={state.isSubtaskViewOpen}
          onClose={() => {
            state.setIsSubtaskViewOpen(false);
            state.setSelectedSubtask(null);
          }}
          onUpdate={onUpdate}
          tags={tags}
          allTickets={allTickets}
          isSubtaskView={true}
          parentTicket={state.ticket}
        />
      )}

      <SubtaskSelectionModal
        open={state.isSubtaskSelectionOpen}
        onOpenChange={state.setIsSubtaskSelectionOpen}
        onSelectSubtask={state.handleAddSubtask}
        availableTickets={state.availableTickets}
      />
    </div>
  );
}