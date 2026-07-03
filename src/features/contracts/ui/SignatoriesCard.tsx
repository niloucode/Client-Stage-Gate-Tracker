import { CheckCircle2, Clock3 } from "lucide-react";

export type SignatoryStatus = "signed" | "pending";

export interface Signatory {
  id: string;
  name: string;
  role: string;
  status: SignatoryStatus;
  timestamp?: string;
  location?: string;
  device?: string;
}

interface SignatoriesCardProps {
  signatories: Signatory[];
  className?: string;
}

const AVATAR_PALETTE = [
  { bg: "#EEF0FF", text: "#4338CA" },
  { bg: "#ECFDF3", text: "#15803D" },
  { bg: "#FFF7ED", text: "#C2410C" },
  { bg: "#FDF2F8", text: "#BE185D" },
];

function initialsFor(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function SignatoriesCard({
  signatories,
  className = "",
}: SignatoriesCardProps) {
  const completed = signatories.filter((s) => s.status === "signed").length;

  return (
    <div
      className={`rounded-2xl border border-[#E6E4F0] bg-white p-6 shadow-sm ${className}`}
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-semibold text-[#181724]">
          Signatories
        </h2>
        <span className="rounded-full bg-[#EEF0FF] px-2.5 py-1 text-xs font-medium text-[#4338CA]">
          {completed} / {signatories.length} completed
        </span>
      </div>

      <ul className="flex flex-col gap-4">
        {signatories.map((person, i) => {
          const palette = AVATAR_PALETTE[i % AVATAR_PALETTE.length];
          const isSigned = person.status === "signed";
          return (
            <li key={person.id} className="flex items-start gap-3">
              <div
                style={{ backgroundColor: palette.bg, color: palette.text }}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
              >
                {initialsFor(person.name)}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#181724]">
                  {person.name}
                </p>
                <p className="truncate text-xs text-[#6E6B82]">
                  {person.role}
                </p>
                {isSigned && person.timestamp && (
                  <p className="mt-0.5 text-[11px] text-[#9C9AB0]">
                    Signed {person.timestamp} <br/>
                    {person.device} <br/>
                    {person.location} 
                  </p>
                )}
              </div>

              <span
                className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${
                  isSigned
                    ? "bg-[#ECFDF3] text-[#15803D]"
                    : "bg-[#FFFBEB] text-[#B45309]"
                }`}
              >
                {isSigned ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <Clock3 className="h-3 w-3" />
                )}
                {isSigned ? "Signed" : "Pending"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default SignatoriesCard;
