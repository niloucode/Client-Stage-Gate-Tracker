"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import type { ContractStatus, PendingContract } from "../model/types";

export interface PendingContractsProps {
	contracts?: PendingContract[];
}

const CONTRACT_STATUS_STYLE: Record<
	ContractStatus,
	{ dot: string; text: string; label: string }
> = {
	pending: {
		dot: "bg-amber-500",
		text: "text-amber-800 dark:text-amber-400",
		label: "Pending Signature",
	},
	executed: {
		dot: "bg-emerald-500",
		text: "text-emerald-700 dark:text-emerald-400",
		label: "Executed",
	},
};

function StatusBadge({ status }: { status: ContractStatus }) {
	const style = CONTRACT_STATUS_STYLE[status];
	return (
		<div className="flex items-center gap-1.5">
			<span className={`h-2 w-2 shrink-0 rounded-sm ${style.dot}`} />
			<span className={`truncate text-xs font-normal ${style.text}`}>
				{style.label}
			</span>
		</div>
	);
}

/** Pending-contracts list card for the dashboard. */
export function PendingContracts({ contracts = [] }: PendingContractsProps) {
	const router = useRouter();
	const [currentPage, setCurrentPage] = useState(1);
	const pageSize = 10;

	const totalPages = Math.max(1, Math.ceil(contracts.length / pageSize));
	const paginatedContracts = contracts.slice(
		(currentPage - 1) * pageSize,
		currentPage * pageSize,
	);
	const shownFrom =
		contracts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
	const shownTo =
		contracts.length === 0
			? 0
			: Math.min(currentPage * pageSize, contracts.length);

	const renderContractRows = (items: PendingContract[]) =>
		items.map((contract) => (
			<div
				key={contract.id}
				className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-md border border-brand-100 bg-muted/30 p-4 transition-colors"
			>
				<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-background">
					<FileText className="h-5 w-5 text-muted-foreground" />
				</div>

				<div className="grid grid-cols-1 gap-4 sm:grid-cols-[1.75fr_1fr_1fr] sm:items-center">
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

					<div className="flex flex-col min-w-0">
						<span className="text-[11px] font-normal uppercase text-muted-foreground">
							Status
						</span>
						<StatusBadge status={contract.status} />
					</div>
				</div>

				<div className="flex items-center justify-end shrink-0 pl-2">
					<Button
						size="sm"
						onClick={() =>
							router.push(`/projects/${contract.projectId}/contract`)
						}
					>
						<span>Review and Sign</span>
						<ArrowRight className="h-3.5 w-3.5" />
					</Button>
				</div>
			</div>
		));

	return (
		<Card className="m-0 flex w-full flex-col gap-0 overflow-hidden rounded-md border border-brand-100 p-0 shadow-none">
			<Dialog>
				<div className="flex items-center justify-between gap-3 border-b border-brand-100 bg-muted/30 px-6 py-4">
					<div className="flex items-center gap-3">
						<ScrollText className="h-5 w-5 text-muted-foreground" />
						<h3 className="text-base font-normal text-foreground">Contracts</h3>
						<span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-normal text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
							{contracts.filter((c) => c.status === "pending").length} PENDING
						</span>
					</div>

					<DialogTrigger>
						<span className="cursor-pointer text-xs font-normal underline-offset-2 hover:underline">
							<span className="hover:text-brand-600! font-normal underline decoration-inherit">
								View All
							</span>
						</span>
					</DialogTrigger>
				</div>

				{contracts.length === 0 ? (
					<div className="px-6 py-10 text-center text-sm text-muted-foreground">
						No contracts to show.
					</div>
				) : (
					<div className="flex flex-col gap-3 p-4">
						{renderContractRows(contracts.slice(0, 5))}
					</div>
				)}

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

					<div className="flex flex-1 flex-col gap-3 overflow-y-auto p-8">
						{paginatedContracts.length === 0 ? (
							<div className="py-10 text-center text-sm text-muted-foreground">
								No contracts to show.
							</div>
						) : (
							renderContractRows(paginatedContracts)
						)}
					</div>

					{contracts.length > 0 && (
						<div className="flex items-center justify-between border-t border-brand-100 bg-muted/30 px-8 py-4">
							<span className="text-xs text-muted-foreground">
								Showing <span className="text-foreground">{shownFrom}</span> to{" "}
								<span className="text-foreground">{shownTo}</span> of{" "}
								<span className="text-foreground">{contracts.length}</span>{" "}
								contracts
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
									onClick={() =>
										setCurrentPage((p) => Math.min(p + 1, totalPages))
									}
									disabled={currentPage === totalPages}
									className="h-8 w-8 p-0"
								>
									<ChevronRight className="h-4 w-4" />
								</Button>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</Card>
	);
}
