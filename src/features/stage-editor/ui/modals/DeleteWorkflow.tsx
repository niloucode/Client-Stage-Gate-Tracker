"use client";

interface DeleteWorkflowProps {
	isOpen: boolean;
	workflowLabel?: string;
	onConfirm: () => void;
	onCancel: () => void;
}

export function DeleteWorkflow({
	isOpen,
	workflowLabel,
	onConfirm,
	onCancel,
}: DeleteWorkflowProps) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50">
			<div className="bg-neutral-surface rounded-xl shadow-xl w-full max-w-sm p-6 relative">
				<h2 className="text-xl font-bold text-[#0F172A] mb-2">
					Delete {workflowLabel ?? "Workflow"}
				</h2>
				<p className="text-sm text-neutral-subtle mb-6">
					Are you sure you want to delete this workflow? This action cannot be
					undone.
				</p>

				<div className="flex justify-end gap-3">
					<button
						onClick={onCancel}
						className="px-4 py-2 text-sm font-semibold text-neutral-subtle hover:text-[#0F172A] transition-colors"
					>
						Cancel
					</button>
					<button
						onClick={onConfirm}
						className="px-4 py-2 bg-[#EF4444] text-neutral-surface text-sm font-semibold rounded-lg hover:bg-[#DC2626] transition-all shadow-sm"
					>
						Delete Workflow
					</button>
				</div>
			</div>
		</div>
	);
}
