"use client";

import { Ticket, Tag } from "@/entities/types";
import { useProfiles } from "@/entities/profile/queries";
import { useTicketImages, useTicketComments } from "@/entities/comment/queries";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormInput } from "@/components/ui/forminput";
import { X, Plus, Calendar } from "lucide-react";
import ImageLightbox from "@/shared/ui/ImageLightbox";
import TicketModalEdit from "../TicketModalEdit";
import { useTicketEditor } from "./useTicketEditor";
import { TicketTitleAndStatus, TicketAssignees, TicketApiDetails, TicketSchedule, SubtaskSelectionModal } from "./TicketEditorSubcomponents";
import { TicketActivitySection } from "./TicketActivitySection";
import { status as StatusEnum } from "@/lib/generated/prisma";

export default function TicketEditor({
  initialTicket, tags, onClose, onUpdate, allTickets = [], isSubtaskView = false, parentTicket = null
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

  const state = useTicketEditor({ initialTicket, tags, onUpdate, onClose, isSubtaskView, allTickets });
  
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
          <p className="text-xs text-muted-foreground">Parent: <span className="font-medium text-foreground">{parentTicket.name}</span></p>
        </div>
      )}

      {/* 2. Title & Status */}
      <TicketTitleAndStatus ticket={state.ticket} tags={tags} selectedTags={state.selectedTags} setTicket={state.setTicket} setSelectedTags={state.setSelectedTags} />

      <div className="flex-1 overflow-y-auto [scrollbar-gutter:stable] pb-24">
        <div className="px-5 py-4 flex flex-col gap-4 border-b border-gray-100">
          {/* 3. Assignees & 4. API Details & 5. Schedule */}
          <TicketAssignees ticket={state.ticket} profiles={profiles} setTicket={state.setTicket} />
          {state.isApiTagSelected && <TicketApiDetails apiMethod={state.apiMethod} apiRoute={state.apiRoute} setApiMethod={state.setApiMethod} setApiRoute={state.setApiRoute} />}
          <TicketSchedule ticket={state.ticket} setTicket={state.setTicket} />
        </div>

        {/* 6. Description */}
        <div className="px-5 py-4 border-b border-gray-100">
          <Label className="text-md -mb-4 text-neutral-border font-bold tracking-wider uppercase">DESCRIPTION</Label>
          <FormInput variant="textarea" label="" maxLength={360} rows={4} value={state.ticket.description ?? ""} placeholder="Add a description..." onChange={(e) => state.setTicket((t) => ({ ...t, description: e.target.value }))} />
        </div>

        {/* 7. Subtasks */}
        {!isSubtaskView && (
           <div className="px-5 mt-3">
             <div className="flex justify-between items-center">
               <Label className="text-md text-neutral-border font-bold tracking-wider uppercase">SUBTASKS</Label>
               <button onClick={() => state.setIsSubtaskSelectionOpen(true)} className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 border border-brand-200 hover:border-brand-300 rounded-md px-2.5 py-1 transition-colors bg-brand-50/50 hover:bg-brand-50">
                 <Plus size={12} strokeWidth={2.5} /> Add Subtask
               </button>
             </div>
             <div className="flex flex-col gap-3 max-h-85 overflow-auto select-none mt-2">
                {state.subtasks.length === 0 ? (
                  <div className="text-sm text-muted-foreground italic py-4 text-center border border-dashed border-gray-200 rounded-md">
                    No subtasks yet. Create one from the board.
                  </div>
                ) : (
                  state.subtasks.map((subtask) => (
                    <div 
                      key={subtask.ticket_id} 
                      onClick={() => state.handleSubtaskClick(subtask)} 
                      className="relative group drop-shadow-md rounded-md p-3 bg-neutral-surface flex flex-col border border-brand-100 cursor-pointer hover:border-brand-300 hover:bg-brand-50/30 transition-all"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          state.handleRemoveSubtask(subtask.ticket_id);
                        }}
                        className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all z-10"
                        title="Remove subtask"
                      >
                        <X size={14} strokeWidth={2.5} />
                      </button>

                      <span className="font-mono text-sm text-brand-500 pr-8">{subtask.name.substring(0, 20)}...</span>
                      <span className="font-light text-sm truncate pr-8">{subtask.name}</span>
                      <div className="flex items-center gap-2 text-sm font-light text-neutral-border mt-1">
                        <Calendar size={12} strokeWidth={3} />
                        <span>{subtask.plan_start_at ? new Date(subtask.plan_start_at).toLocaleDateString() : "No start"}</span>
                      </div>
                    </div>
                  ))
                )}
             </div>
           </div>
        )}

        {/* 8. Attachments */}
        {ticketImages.length > 0 && (
          <div className="px-5 mt-5">
            <p className="text-sm font-semibold text-neutral-border mb-2 uppercase tracking-wider">Attachments</p>
            <div className="flex flex-wrap gap-2">
              {ticketImages.map((img) => (
                <img key={img.image_id} src={img.image_src} alt="attachment" className="h-16 w-auto rounded-md border border-gray-200 object-cover cursor-pointer hover:opacity-80 transition-opacity" onClick={() => state.setLightboxSrc(img.image_src)} />
              ))}
            </div>
          </div>
        )}

        {/* 9. Activity */}
        <TicketActivitySection ticketId={state.ticket.ticket_id} comments={comments} currentUser={state.user} onImageClick={state.setLightboxSrc} />
      </div>

      {/* 10. Footer */}
      <div className="fixed bottom-0 right-0 w-[40rem] flex items-center justify-end gap-3 px-5 py-3.5 border-t border-gray-100 shrink-0 bg-neutral-surface z-50">
        <button type="button" onClick={onClose} className="text-sm font-medium text-gray-500 px-4 py-2 rounded-md hover:bg-gray-100">Cancel</button>
        <Button onClick={state.handleSave}>Save Changes</Button>
      </div>

      {/* Modals */}
      {state.lightboxSrc && <ImageLightbox src={state.lightboxSrc} onClose={() => state.setLightboxSrc(null)} />}
      
      {state.isSubtaskViewOpen && state.selectedSubtask && (
        <TicketModalEdit 
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