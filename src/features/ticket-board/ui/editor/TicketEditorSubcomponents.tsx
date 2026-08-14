"use client";

import { useMemo, useState } from "react";
import { Ticket, Tag } from "@/entities/types";
import { status as StatusEnum } from "@/lib/generated/prisma";
import type { ProfileSelect } from "@/entities/profile";

import {
  Badge,
  Button,
  DateTimePicker,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Input,
  Label,
} from "@/components/ui";

import { TagBadge } from "@/entities/tag/ui";
import { Pencil, ChevronDown, Plus, Search, Bug, AlertCircle } from "lucide-react";

// eslint-disable-next-line boundaries/dependencies
import IssueTableModal from "@/features/issue-reporting/ui/IssueTableModal";
// eslint-disable-next-line boundaries/dependencies
import type { IssueItem } from "@/features/issue-reporting/ui/IssueDashboard";

import { STATUS_CONFIG, STATUSES, UserAvatar, getLinkedIssueStyle } from "./helpers";

export function StatusBadge({ status }: { status: StatusEnum }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${config.textClass}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dotClass}`} />
      {config.label}
    </span>
  );
}

export function SubtaskSelectionModal({
  open,
  onOpenChange,
  onSelectSubtask,
  availableTickets,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectSubtask: (ticket: Ticket) => void;
  availableTickets: Ticket[];
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTickets = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return availableTickets;
    return availableTickets.filter((t) => t.name.toLowerCase().includes(q));
  }, [availableTickets, searchQuery]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0 border-none bg-card rounded-md overflow-hidden shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Add Subtask</DialogTitle>
        </DialogHeader>

        {/* Box Header */}
        <div className="px-5 py-3 pr-12 border-b border-border flex items-center justify-between flex-wrap gap-3 bg-card shrink-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-base font-bold capitalize text-foreground">
              Add Subtask
            </h3>
            <Badge
              variant="secondary"
              className="bg-brand-50 text-brand-500 dark:bg-brand-900 dark:text-brand-100 font-semibold rounded-full px-2.5 py-0.5 text-xs border-none"
            >
              {filteredTickets.length} / {availableTickets?.length ?? 0}
            </Badge>
          </div>

          <div className="flex-1 min-w-50 max-w-sm flex items-center gap-1.5 border border-border bg-card rounded-md px-2.5 h-8 text-xs font-medium text-foreground hover:bg-neutral-subtle transition-colors focus-within:ring-1 focus-within:ring-brand-500">
            <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs font-medium text-foreground focus:outline-none w-full placeholder:text-muted-foreground/70"
            />
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-card">
          {filteredTickets.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground flex flex-col items-center justify-center space-y-2">
              <AlertCircle className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-sm">No available tickets match your search.</p>
              <p className="text-xs mt-1">All other tickets are either subtasks already or finished.</p>
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <div
                key={ticket.ticket_id}
                className="flex items-center justify-between p-3.5 bg-card border border-border rounded-md hover:border-brand-200 hover:bg-brand-10/50 cursor-pointer transition-all group"
                onClick={() => { onSelectSubtask(ticket); onOpenChange(false); }}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="space-y-0.5 min-w-0">
                    <h4 className="text-sm font-bold text-foreground truncate group-hover:text-brand-500 transition-colors">
                      {ticket.name}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground truncate mt-1">
                      <span>
                        {ticket.plan_start_at ? new Date(ticket.plan_start_at).toLocaleDateString() : "No start date"}
                      </span>
                      <span>•</span>
                      <StatusBadge status={ticket.status} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center rounded-sm gap-2 shrink-0 ml-4">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function TicketTitleAndStatus({
  ticket,
  tags,
  selectedTags,
  setTicket,
  setSelectedTags,
}: {
  ticket: Ticket;
  tags: Tag[];
  selectedTags: string[];
  setTicket: React.Dispatch<React.SetStateAction<Ticket>>;
  setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const currentStatusConfig = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.PENDING;

  function setStatus(val: StatusEnum) {
    setTicket((t) => {
      const now = new Date();
      return {
        ...t,
        status: val,
        actual_start_at: (val === StatusEnum.IN_PROGRESS || val === StatusEnum.FINISHED) && !t.actual_start_at ? now : t.actual_start_at,
        actual_end_at: val === StatusEnum.FINISHED ? (t.actual_end_at ?? now) : val === StatusEnum.PENDING ? null : t.actual_end_at,
      };
    });
  }

  const toggleTag = (tagId: string) => setSelectedTags((prev) => prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]);

  return (
    <div className="flex flex-col gap-3 px-5 py-3.5 border-b border-gray-100 shrink-0 relative">
      <div className="flex items-center justify-between gap-3 max-w-full">
        <div className="inline-flex items-center gap-2 max-w-full min-w-0 flex-1">
          <input
            type="text"
            value={ticket.name}
            maxLength={50}
            onChange={(e) => setTicket((t) => ({ ...t, name: e.target.value }))}
            placeholder="Ticket title..."
            className="-ml-1 text-ellipsis text-2xl font-light text-gray-900 bg-transparent border border-transparent hover:border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none rounded-md px-1.5 py-0.5 max-w-[calc(100%-2rem)] field-sizing-content"
          />
          <Pencil size={16} className="text-gray-400 shrink-0 pointer-events-none" />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1 select-none cursor-pointer focus:outline-none shrink-0">
            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${currentStatusConfig.dotClass}`} />
            <span className={`text-xs font-semibold ${currentStatusConfig.textClass}`}>{currentStatusConfig.label}</span>
            <ChevronDown size={12} className="text-brand-600 ml-1" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-44" align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-2 py-1">Select Status</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={ticket.status} onValueChange={(val) => setStatus(val as StatusEnum)}>
                {STATUSES.map((s) => (
                  <DropdownMenuRadioItem key={s} value={s} className="cursor-pointer">
                    <span className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${STATUS_CONFIG[s].dotClass}`} />
                      <span className={`text-sm font-medium ${STATUS_CONFIG[s].textClass}`}>{STATUS_CONFIG[s].label}</span>
                    </span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center justify-between gap-2 w-full">
        <div className="flex flex-wrap gap-1.5 items-center flex-1">
          {selectedTags.map((tag_id) => {
            const tag = tags.find((t) => t.tag_id === tag_id);
            return tag ? <TagBadge key={tag_id} hover className="hover:bg-neutral-border!" tag={tag} onClick={() => toggleTag(tag.tag_id)} /> : null;
          })}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="text-xs text-brand-600 hover:text-indigo-700 font-medium px-2 py-1 rounded-sm border border-brand-100 hover:bg-indigo-50 transition-colors focus:outline-none shrink-0 ml-auto">
            + Add Tags
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 max-h-52 overflow-y-auto" align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-2 py-1">SELECT TAGS</DropdownMenuLabel>
              {tags.map((tag) => (
                <DropdownMenuCheckboxItem key={tag.tag_id} checked={selectedTags.includes(tag.tag_id)} onCheckedChange={() => toggleTag(tag.tag_id)} className="cursor-pointer">
                  <TagBadge tag={tag} />
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function TicketAssignees({
  ticket,
  profiles,
  setTicket,
}: {
  ticket: Ticket;
  profiles: ProfileSelect[];
  setTicket: React.Dispatch<React.SetStateAction<Ticket>>;
}) {
  const availableProfiles = profiles.filter((u) => !(ticket.TicketAssigned || []).some((a) => a.profile_id === u.profile_id));
  const watcher = profiles.find((u) => u.profile_id === ticket.watcher_id);
  const hasAssignees = (ticket.TicketAssigned?.length ?? 0) > 0;

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-4 items-start">
      <div>
        <div className="flex items-center gap-2 mb-1.5 h-8">
          <Label className="my-auto text-xs text-neutral-border font-bold">ASSIGNED TO</Label>
          {availableProfiles.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger className="text-2xs text-brand-600 hover:bg-indigo-50 font-medium transition-colors rounded-sm border border-brand-100 px-1.5 focus:outline-none inline-flex items-center justify-center gap-1 leading-none">
                <Plus className="w-3 h-3 stroke-[2.5]" /><span>Add</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-52 max-h-52 overflow-y-auto" align="start">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-2 py-1">Select Assignee</DropdownMenuLabel>
                  {availableProfiles.map((p) => (
                    <DropdownMenuItem
                      key={p.profile_id}
                      onClick={() => setTicket((t) => ({ ...t, TicketAssigned: [...(t.TicketAssigned || []), { ticket_id: t.ticket_id, profile_id: p.profile_id, assigned_date: new Date(), Profile: p }] }))}
                      className="cursor-pointer"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <UserAvatar name={`${p.first_name} ${p.last_name}`} size="w-6 h-6 text-[10px]" />
                        <span className="text-sm text-gray-700 font-medium truncate">{`${p.first_name} ${p.last_name}`}</span>
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {hasAssignees ? ticket.TicketAssigned.map((a) => {
            const fullName = `${a.Profile?.first_name ?? "Unknown"} ${a.Profile?.last_name ?? "User"}`.trim();
            return (
              <div key={a.profile_id} title={fullName} className="group relative inline-flex items-center justify-center shrink-0">
                <UserAvatar name={fullName} />
                <button
                  type="button"
                  onClick={() => setTicket((t) => ({ ...t, TicketAssigned: t.TicketAssigned.filter((x) => x.profile_id !== a.profile_id) }))}
                  className="absolute inset-0 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-xs font-bold"
                >✕</button>
              </div>
            );
          }) : <span className="text-sm text-gray-400">Unassigned</span>}
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1.5 h-8">
          <Label className="my-auto text-xs text-neutral-border font-bold">WATCHER</Label>
          <DropdownMenu>
            <DropdownMenuTrigger className="text-2xs text-brand-600 hover:bg-indigo-50 font-medium transition-colors rounded-sm border border-brand-100 px-1.5 py-0.5 focus:outline-none inline-flex items-center justify-center gap-1 leading-none">
              <Plus className="w-3 h-3 stroke-[2.5]" /><span>Assign</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52 max-h-52 overflow-y-auto" align="start">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-2 py-1">Select Watcher</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setTicket((t) => ({ ...t, watcher_id: null }))} className="cursor-pointer text-xs text-gray-400">None</DropdownMenuItem>
                {profiles.map((p) => (
                  <DropdownMenuItem key={p.profile_id} onClick={() => setTicket((t) => ({ ...t, watcher_id: p.profile_id }))} className="cursor-pointer">
                    <span className="flex items-center gap-2 truncate">
                      <UserAvatar name={`${p.first_name} ${p.last_name}`} size="w-6 h-6 text-[10px]" color="bg-emerald-500" />
                      <span className="text-sm text-gray-700 font-medium truncate">{`${p.first_name} ${p.last_name}`}</span>
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 h-8">
          {watcher ? (
            <div title={`${watcher.first_name} ${watcher.last_name}`} className="group relative inline-flex items-center justify-center shrink-0 gap-2">
              <UserAvatar name={`${watcher.first_name} ${watcher.last_name}`} color="bg-emerald-500" />
              <button type="button" onClick={() => setTicket((t) => ({ ...t, watcher_id: null }))} className="absolute inset-0 rounded-full bg-black/30 p-3 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-xs font-bold">✕</button>
              <span className="text-sm text-neutral-border">{`${watcher.first_name} ${watcher.last_name}`}</span>
            </div>
          ) : <span className="text-sm text-gray-400">Unassigned</span>}
        </div>
      </div>
    </div>
  );
}

export function TicketApiDetails({
  apiMethod, apiRoute, setApiMethod, setApiRoute,
}: {
  apiMethod: "GET" | "POST" | "PUT" | "DELETE";
  apiRoute: string;
  setApiMethod: (val: "GET" | "POST" | "PUT" | "DELETE") => void;
  setApiRoute: (val: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-neutral-border font-bold">API DETAILS</Label>
      {apiMethod && apiRoute && (
        <div className="inline-flex items-center gap-1.5 bg-gray-900 rounded-md px-2.5 py-1.5">
          <span className="text-xs font-mono text-green-400 font-bold">{apiMethod}</span>
          <span className="text-xs font-mono text-indigo-300">{apiRoute}</span>
        </div>
      )}
      <div className="grid grid-cols-[110px_1fr] gap-3">
        <select value={apiMethod} onChange={(e) => setApiMethod(e.target.value as any)} className="w-full rounded-md border border-gray-200 bg-neutral-surface px-2.5 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500">
          {["GET", "POST", "PUT", "DELETE"].map((m) => <option key={m}>{m}</option>)}
        </select>
        <Input placeholder="/api/v1/resource" value={apiRoute} onChange={(e) => setApiRoute(e.target.value)} />
      </div>
    </div>
  );
}

export function TicketSchedule({
  ticket, setTicket, showDateError,
}: {
  ticket: Ticket;
  setTicket: React.Dispatch<React.SetStateAction<Ticket>>;
  showDateError?: boolean;
}) {
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [linkedIssue, setLinkedIssue] = useState<IssueItem | null>(null);

  return (
    <div className="space-y-2 pt-1">
      <Label className="text-xs text-neutral-border font-bold tracking-wider uppercase">SCHEDULE & TIMELINE DATES</Label>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <DateTimePicker
            label="PLANNED START"
            value={ticket.plan_start_at ? new Date(ticket.plan_start_at) : undefined}
            onChange={(date) => setTicket((t) => ({ ...t, plan_start_at: date ?? t.plan_start_at }))}
            placeholder="Pick planned start date"
            className="h-9 text-xs"
            error={showDateError ? "Start must be before End" : undefined}
          />
        </div>
        <div>
          <DateTimePicker
            label="DEADLINE"
            required
            value={ticket.plan_end_at ? new Date(ticket.plan_end_at) : undefined}
            onChange={(date) => setTicket((t) => ({ ...t, plan_end_at: date ?? t.plan_end_at }))}
            placeholder="Pick deadline"
            className="h-9 text-xs"
            error={showDateError ? "Start must be before End" : undefined}
          />
        </div>
        <div>
          <DateTimePicker
            label="ACTUAL START"
            value={ticket.actual_start_at ? new Date(ticket.actual_start_at) : undefined}
            disabled
            placeholder="Not started yet"
            className="h-9 text-xs"
          />
        </div>
        <div>
          <DateTimePicker
            label="FINISH"
            value={ticket.actual_end_at ? new Date(ticket.actual_end_at) : undefined}
            disabled
            placeholder="Not finished yet"
            className="h-9 text-xs"
          />
        </div>
      </div>
      <div>
        <Label className="text-xs text-neutral-border/75">LINKED ISSUE</Label>
        {(() => {
          const style = getLinkedIssueStyle(linkedIssue);
          return (
            <div onClick={() => setIsIssueModalOpen(true)} className={`h-9 w-full rounded-md border px-2.5 py-1 text-xs flex items-center justify-between select-none cursor-pointer transition-colors ${style.box}`}>
              <div className="flex items-center gap-2 min-w-0 flex-1 pr-1">
                <Bug size={14} className={`shrink-0 ${style.icon}`} />
                <span className={`truncate ${style.text}`}>{linkedIssue ? linkedIssue.name : "Link an issue..."}</span>
              </div>
              {linkedIssue && (
                <button type="button" onClick={(e) => { e.stopPropagation(); setLinkedIssue(null); setTicket((t) => ({ ...t, issue_id: null })); }} className={`text-xs font-bold px-1 shrink-0 ${style.close}`} title="Unlink Issue">✕</button>
              )}
            </div>
          );
        })()}
      </div>
      <IssueTableModal open={isIssueModalOpen} onOpenChange={setIsIssueModalOpen} onSelectIssue={(issue) => { setLinkedIssue(issue); setTicket((t) => ({ ...t, issue_id: issue.id })); }} />
    </div>
  );
}