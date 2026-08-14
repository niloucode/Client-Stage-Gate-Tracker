"use client";

import { useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandList,
} from "@/components/ui/command";

export interface ClientOption {
	id: string;
	name: string;
	email: string;
}

interface ClientsDropdownProps {
	clients: ClientOption[];
	selected: ClientOption | null;
	onSelect: (client: ClientOption) => void;
	placeholder?: string;
}

function initialsFor(name: string) {
	return name
		.split(" ")
		.map((p) => p[0])
		.filter(Boolean)
		.slice(0, 2)
		.join("")
		.toUpperCase();
}

export function ClientsDropdown({
	clients,
	selected,
	onSelect,
	placeholder = "Select Client Signatory",
}: ClientsDropdownProps) {
	const [open, setOpen] = useState(false);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger className="w-full">
				<div
					role="combobox"
					aria-expanded={open}
					className="relative flex w-full min-h-[48px] items-center rounded-md border border-neutral-border/40 bg-[#FAF8FF] px-4 py-2.5 text-left transition-colors hover:brightness-95 cursor-pointer"
				>
					{/* Left: placeholder or selected client */}
					<div className="flex-1 pr-8">
					{selected ? (
						<div className="flex items-center gap-3">
						<Avatar className="h-8 w-8">
							<AvatarFallback
							className="text-xs  bg-[#EAEDFF] text-[#131B2E]"
							>
							{initialsFor(selected.name)}
							</AvatarFallback>
						</Avatar>
						<div className="flex flex-col min-w-0">
							<span className="text-xs  text-foreground truncate">
							{selected.name}
							</span>
							<span className="text-[11px] text-muted-foreground truncate">
							{selected.email}
							</span>
						</div>
						</div>
					) : (
						<span className="text-xs text-foreground tracking-wide">
						{placeholder}
						</span>
					)}
					</div>

					{/* Right: chevron */}
					<div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none text-muted-foreground">
					<ChevronsUpDown
						className={cn("h-4 w-4 transition-transform duration-200", open && "rotate-180")}
					/>
					</div>
				</div>
				</PopoverTrigger>

			<PopoverContent align="start" className="w-(--anchor-width) p-0">
				<Command className="w-full">
					<CommandList className="max-h-56">
						<CommandEmpty className="flex min-h-[48px] items-center justify-center py-3 text-center text-xs text-muted-foreground">
							No clients found.
						</CommandEmpty>
						<CommandGroup className="p-1">
							{clients.map((client) => (
								<CommandItem
									key={client.id}
									value={client.name}
									onSelect={() => {
										onSelect(client);
										setOpen(false);
									}}
									className="px-3 py-2 cursor-pointer hover:bg-muted/80 rounded-sm transition-colors"
								>
									<div className="flex items-center gap-3 w-full min-w-0">
										<Avatar className="h-7 w-7 shrink-0">
											<AvatarFallback className="text-xs font-semibold bg-[#EAEDFF] text-[#131B2E]">
												{initialsFor(client.name)}
											</AvatarFallback>
										</Avatar>
										<div className="flex flex-col min-w-0 flex-1 text-left">
											<span className="text-xs font-semibold text-foreground truncate">
												{client.name}
											</span>
											<span className="text-[11px] text-muted-foreground truncate">
												{client.email}
											</span>
										</div>
									</div>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

export default ClientsDropdown;
