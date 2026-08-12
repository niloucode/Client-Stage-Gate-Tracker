"use client";

import { useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
			<PopoverTrigger>
				<div
					role="combobox"
					aria-expanded={open}
					className="relative flex w-full items-center rounded-lg px-4 py-0 text-left transition-colors hover:brightness-95"
					style={{
						backgroundColor: "#faf8ff",
						border: "1px solid #c7c4d8",
						minHeight: "78px",
					}}
				>
					{/* Left: placeholder or selected client */}
					<div className="flex-1 pr-10">
						{selected ? (
							<div className="flex items-center gap-3">
								<Avatar className="h-9 w-9">
									<AvatarFallback
										className="text-sm font-semibold"
										style={{ backgroundColor: "#eaedff", color: "#131b2e" }}
									>
										{initialsFor(selected.name)}
									</AvatarFallback>
								</Avatar>
								<div className="flex flex-col">
									<span className="text-[13px] font-semibold text-[#131b2e]">
										{selected.name}
									</span>
									<span className="text-[12px] text-[#464555]">
										{selected.email}
									</span>
								</div>
							</div>
						) : (
							<span
								className="text-[12px] font-semibold"
								style={{ color: "#151c27", letterSpacing: "0.6px" }}
							>
								{placeholder}
							</span>
						)}
					</div>

					{/* Right: chevron — absolutely positioned to match Figma */}
					<div className="absolute right-0 top-0 flex h-full w-11 items-center justify-center">
						<ChevronsUpDown
							className={`transition-transform ${open ? "rotate-180" : ""}`}
							style={{ color: "#464555", width: "12px", height: "7.4px" }}
						/>
					</div>
				</div>
			</PopoverTrigger>

			<PopoverContent>
				<Command>
					<CommandList>
						<CommandEmpty>No clients found.</CommandEmpty>
						<CommandGroup>
							{clients.map((client) => (
								<CommandItem
									key={client.id}
									value={client.name}
									onSelect={() => {
										onSelect(client);
										setOpen(false);
									}}
									className="px-4 py-3 w-full bg-transparent! hover:bg-[#F3F0FF]! focus:bg-[#FFFFFF] data-[selected]:bg-[#FFFFFF]"
								>
									<div className="flex items-center gap-3">
										<Avatar className="h-9 w-9">
											<AvatarFallback
												className="text-sm font-semibold"
												style={{ backgroundColor: "#eaedff", color: "#131b2e" }}
											>
												{initialsFor(client.name)}
											</AvatarFallback>
										</Avatar>
										<div className="flex flex-col">
											<span className="text-[13px] font-semibold text-[#131b2e]">
												{client.name}
											</span>
											<span className="text-[12px] text-[#464555]">
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
