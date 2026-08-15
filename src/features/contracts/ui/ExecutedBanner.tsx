import { CheckCircle2 } from "lucide-react";

interface ExecutedBannerProps {
	executedAt?: string | Date;
	className?: string;
}

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
			className={`flex h-44 items-center gap-4 rounded-md border border-[#BBF7D0] bg-[#F0FDF4] px-6 py-4 shadow-sm ${className}`}
		>
			<CheckCircle2 className="h-20 w-20 text-green-700" />
			<div className="min-w-0 flex flex-col gap-3">
				<h3>
					Agreement Fully Executed
				</h3>
				<h4 className="text-xs text-plum-400">
					All parties have signed. This agreement is now legally binding.
					{formatted && (
						<>
							{" "}
							Executed on{" "}
							<span className="text-foreground">{formatted}</span>.
						</>
					)}
				</h4>
			</div>
		</div>
	);
}

