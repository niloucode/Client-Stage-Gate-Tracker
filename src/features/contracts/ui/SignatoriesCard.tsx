import { CheckCircle2, Clock3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
		<Card className={className}>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle>Signatories</CardTitle>
				<Badge variant="secondary">
					{completed} / {signatories.length} completed
				</Badge>
			</CardHeader>
			<CardContent>
				<ul className="flex flex-col gap-4">
					{signatories.map((person, i) => {
						const palette = AVATAR_PALETTE[i % AVATAR_PALETTE.length];
						const isSigned = person.status === "signed";
						return (
							<li key={person.id} className="flex items-start gap-3">
								<Avatar className="h-10 w-10">
									<AvatarFallback
										className="text-sm font-semibold"
										style={{ backgroundColor: palette.bg, color: palette.text }}
									>
										{initialsFor(person.name)}
									</AvatarFallback>
								</Avatar>

								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium text-[#181724]">
										{person.name}
									</p>
									<p className="truncate text-xs text-[#6E6B82]">
										{person.role}
									</p>
									{isSigned && person.timestamp && (
										<p className="mt-0.5 text-[11px] text-[#9C9AB0]">
											Signed {person.timestamp} <br />
											{person.device} <br />
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
			</CardContent>
		</Card>
	);
}

export default SignatoriesCard;
