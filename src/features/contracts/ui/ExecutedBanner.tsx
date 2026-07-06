import { CheckCircle2 } from "lucide-react";

interface ExecutedBannerProps {
  executedAt?: string | Date;
  className?: string;
}

export function ExecutedBanner({ executedAt, className = "" }: ExecutedBannerProps) {
  const formatted = executedAt
    ? new Date(executedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div
      className={`flex items-center gap-4 rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] px-6 py-4 shadow-sm ${className}`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DCFCE7]">
        <CheckCircle2 className="h-5 w-5 text-[#15803D]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[#15803D]">
          Agreement Fully Executed
        </p>
        <p className="mt-0.5 text-xs text-[#6E6B82]">
          All parties have signed. This agreement is now legally binding.
          {formatted && (
            <>
              {" "}
              Executed on{" "}
              <span className="font-medium text-[#181724]">{formatted}</span>.
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default ExecutedBanner;
