"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface GateFeedbackEntry {
  id?: string;
  number: number;
  date: string;
  reviewer: {
    name: string;
    avatar?: string;
    initials?: string;
  };
  feedback: string;
  variant: "approved" | "rejected";
}

export interface GateFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries?: GateFeedbackEntry[];
}

const VARIANT_CONFIG: Record<
  GateFeedbackEntry["variant"],
  { headerBg: string; bodyBg: string }
> = {
  approved: {
    headerBg: "bg-[#DCFCE7]",
    bodyBg: "bg-[#F0FDF4]",
  },
  rejected: {
    headerBg: "bg-[#FEF2F2]",
    bodyBg: "bg-[#FFF5F5]",
  },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function GateFeedbackCard({ entry }: { entry: GateFeedbackEntry }) {
  const config = VARIANT_CONFIG[entry.variant];

  return (
    <div className="overflow-hidden rounded-md border border-border/60 shadow-2xs">
      {/* Row Header */}
      <div
        className={`grid grid-cols-[40px_130px_1fr] items-center px-4 py-3 text-sm text-foreground ${config.headerBg}`}
      >
        <span className="font-semibold text-foreground/80">{entry.number}</span>
        <span className="font-medium text-foreground">{entry.date}</span>
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar className="size-7 shrink-0">
            {entry.reviewer.avatar && (
              <AvatarImage src={entry.reviewer.avatar} alt={entry.reviewer.name} />
            )}
            <AvatarFallback className="bg-primary/20 text-xs font-semibold text-primary">
              {entry.reviewer.initials || getInitials(entry.reviewer.name)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate font-semibold text-foreground">
            {entry.reviewer.name}
          </span>
        </div>
      </div>

      {/* Feedback Body */}
      <div className={`space-y-1.5 p-4 border-t border-border/30 ${config.bodyBg}`}>
        <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
          GATE FEEDBACK
        </p>
        <p className="text-xs italic leading-relaxed text-foreground/90">
          &ldquo;{entry.feedback}&rdquo;
        </p>
      </div>
    </div>
  );
}

const DEFAULT_ENTRIES: GateFeedbackEntry[] = [
  {
    id: "fb-1",
    number: 1,
    date: "Oct 10, 2024",
    reviewer: {
      name: "Sarah J. Miller",
      initials: "SJ",
    },
    feedback:
      "The initial brand audit is exceptionally comprehensive, covering all key demographics and market segments. We are particularly impressed with the depth of the sentiment analysis. Moving forward with the proposed color palette as it aligns perfectly with our Q4 vision for the infrastructure overhaul.",
    variant: "approved",
  },
  {
    id: "fb-2",
    number: 2,
    date: "Oct 05, 2024",
    reviewer: {
      name: "Marcus Chen",
      initials: "MC",
    },
    feedback:
      "The submission is currently missing the critical competitor analysis for the APAC region, which is a mandatory requirement for this phase. Please ensure that the updated report includes a detailed breakdown of the top three regional rivals and their current infrastructure footprint before resubmitting for final approval.",
    variant: "rejected",
  },
];

export function GateFeedbackModal({
  isOpen,
  onClose,
  entries = DEFAULT_ENTRIES,
}: GateFeedbackModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						Gate Feedback
					</DialogTitle>
					<DialogDescription>
						Review client comments and feedback entries for this gate.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
          {/* Table Column Headers */}
          <div className="grid grid-cols-[40px_130px_1fr] px-4 py-2.5 text-[11px] font-bold tracking-wider text-muted-foreground uppercase bg-[#EEEEF8] rounded-sm">
            <span>#</span>
            <span>DATE</span>
            <span>REVIEWER</span>
          </div>

          {/* Feedback Entries List */}
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {entries.map((entry) => (
              <GateFeedbackCard key={entry.id || entry.number} entry={entry} />
            ))}
          </div>
        </div>

						<DialogFooter className="mt-6" showCloseButton={false}>
							<Button
								type="button"
								variant="ghost"
								onClick={onClose}
							>
								Cancel
							</Button>
						</DialogFooter>
			</DialogContent>
		</Dialog>
  );
}







