import { CheckCircle2 } from "lucide-react";

interface ExecutedBannerProps {
	executedAt?: string | Date;
	className?: string;
}

/**
 * Success banner shown once both parties have approved the contract.
 * @returns The result.
 */
export function ExecutedBanner({
	executedAt,
	className = "",
}: ExecutedBannerProps) {
	const formatted = executedAt
		? new Date(executedAt).toLocaleDateString("en-US", {
				year: "numeric",
				month: "long",
				day: "numeric",
			})
		: null;

	return (
		<div
			className={`flex justify-center items-center gap-6 rounded-md bg-neutral-50 p-2 shadow-sm ${className}`}
		>
			<CheckCircle2 size={20} className="text-green-700" />
			<h3>Agreement Fully Executed</h3>
			<h4 className="text-xs text-plum-400">
				All parties have signed. This agreement is now legally binding.
				{formatted && (
					<>
						{" "}
						Executed on <span className="text-foreground">{formatted}</span>.
					</>
				)}
			</h4>
		</div>
	);
}
