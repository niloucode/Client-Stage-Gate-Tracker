"use client";

import { useState, useEffect, useRef } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useResetOnOpen } from "@/shared/hooks/useResetOnOpen";
import {
	useProjectMembers,
	useAddProjectMember,
	useRemoveProjectMember,
	searchProfilesForProject,
} from "@/entities/project";
import { departmentBadgeStyle } from "@/shared/lib/colors";
import { LucideSearch, X, UserPlus, Check } from "lucide-react";
import { toast } from "@/components/ui/toast";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Searching, Lacking } from "@/shared/ui/search-status";

interface ManageMembersModalProps {
	isOpen: boolean;
	projectId: string;
	onClose: () => void;
}

function DepartmentDisplay({
	departmentName,
}: {
	departmentName: string;
}) {
	return (
		<div
			className={`px-2 w-25 text-center py-0.5 rounded-md text-xs 
		${departmentBadgeStyle(departmentName)}`}
		>
			{departmentName}
		</div>
	);
}

export function ManageMembersModal({
	isOpen,
	projectId,
	onClose,
}: ManageMembersModalProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<
		Awaited<ReturnType<typeof searchProfilesForProject>>
	>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);

	const mountedRef = useRef(true);
	const latestQueryRef = useRef("");
	const searchContainerRef = useRef<HTMLDivElement>(null);

	const { data: members, isLoading: membersLoading } = useProjectMembers(
		isOpen ? projectId : null,
	);
	const addMemberMutation = useAddProjectMember();
	const removeMemberMutation = useRemoveProjectMember();

	// Reset search when modal closes
	useResetOnOpen(
		isOpen,
		() => {
			setSearchQuery("");
			setSearchResults([]);
			setIsDropdownOpen(false);
		},
		false,
	);

	// Track mount state for async safety
	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);

	// Dropdown visibility follows the query, except when the user clicks
	// outside (handleClickOutside closes it while the query stays).
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				searchContainerRef.current &&
				!searchContainerRef.current.contains(event.target as Node)
			) {
				setIsDropdownOpen(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	// Debounced search
	const debouncedSearch = useDebouncedCallback(async (query: string) => {
		const trimmed = query.trim();
		if (trimmed.length < 1) {
			if (mountedRef.current) setSearchResults([]);
			return;
		}
		if (mountedRef.current) setIsSearching(true);
		latestQueryRef.current = trimmed;
		try {
			const results = await searchProfilesForProject(trimmed);
			// Filter out client profiles
			const filtered = results.filter((p) => !p.client_id);
			if (mountedRef.current && latestQueryRef.current === trimmed) {
				setSearchResults(filtered);
			}
		} catch {
			if (mountedRef.current) setSearchResults([]);
		} finally {
			if (mountedRef.current) setIsSearching(false);
		}
	}, 300);

	const handleAddMember = async (
		profileId: string,
		firstName: string,
		roleName: string = "Project Team",
	) => {
		const result = await addMemberMutation.mutateAsync({
			projectId,
			profileId,
			roleName,
		});
		if (!result.success) {
			toast.add({
				title: "Failed to add member",
				description: result.error ?? "Failed to add member",
				type: "error",
			});
			return;
		}
		// Retain search input, results list, and open state.
		toast.add({
			title: "Given access",
			description: firstName + " successfully added",
		});
	};

	const handleRemoveMember = async (profileId: string, firstName: string) => {
		const result = await removeMemberMutation.mutateAsync({
			projectId,
			profileId,
		});
		if (!result.success) {
			toast.add({
				title: "Failed to remove member",
				description: result.error ?? "Failed to remove member",
				type: "error",
			});
			return;
		}
		toast.add({
			title: "Removed Access",
			description: firstName + " successfully removed",
		});
	};

	// Support matching on both user_id and profile_id
	const memberIds = new Set(
		(members ?? []).flatMap((m) =>
			[m.user_id, m.Profile?.profile_id].filter(Boolean),
		),
	);

	const ownerCount = (members ?? []).filter(
		(m) => m.Roles?.name === "Project Owner",
	).length;

	const nonClientMembers = (members ?? []).filter((m) => !m.Profile?.client_id);

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Manage Project Members</DialogTitle>
					<DialogDescription>
						Find and remove members for this project.
					</DialogDescription>
				</DialogHeader>

				{/* Search Input */}
				<div className="px-6">
					{/* Relative Wrapper with Ref for Click Outside */}
					<div ref={searchContainerRef} className="relative w-full mt-1.5">
						{/* Input Box */}
						<div className="relative flex items-center w-full">
							<LucideSearch className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
							<label htmlFor="member-search" className="sr-only">
								Search for people to add
							</label>
							<input
								id="member-search"
								type="text"
								value={searchQuery}
								onFocus={() => {
									if (searchQuery.trim().length > 0) setIsDropdownOpen(true);
								}}
								onChange={(e) => {
									setSearchQuery(e.target.value);
									setIsDropdownOpen(e.target.value.trim().length > 0);
									debouncedSearch(e.target.value);
								}}
								placeholder="Search for people to add"
								className="w-full pl-9 pr-3 py-2 bg-neutral-surface border border-brand-100 rounded text-sm text-foreground placeholder:text-brand-100 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
							/>
						</div>

						{/* Search Results Dropdown with Enhanced Shadow & Ring Elevation */}
						{isDropdownOpen && searchQuery.trim().length > 0 && (
							<div className="absolute top-full left-0 right-0 z-30 bg-neutral-surface mt-1 overflow-y-auto max-h-60 rounded border border-brand-100 shadow-2xl ring-1 ring-black/5 origin-top animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200 ease-out">
								{isSearching ? (
									<Searching />
								) : searchQuery.trim().length > 0 &&
								  searchResults.length === 0 ? (
									<Lacking />
								) : searchResults.length > 0 ? (
									<div className="flex flex-col gap-y-2 items-center w-full divide-y divide-brand-100/60">
										{searchResults.map((profile) => {
											const isAlreadyMember = memberIds.has(profile.profile_id);
											const firstName = profile.first_name || "";
											const lastName = profile.last_name || "";
											const initials =
												`${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();

											return (
												<div
													key={profile.profile_id}
													className="flex w-full items-center px-2 py-2.5 hover:bg-neutral-subtle/20 transition-colors"
												>
													<div className="flex items-center gap-3 min-w-0">
														<div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-neutral-subtle text-xs font-semibold shrink-0 select-none">
															{initials}
														</div>
														<div className="min-w-0">
															<p className="text-sm font-medium text-surface truncate">
																{firstName} {lastName}
															</p>
															<p className="text-xs text-neutral-border truncate">
																{profile.email}
															</p>
														</div>
													</div>
													<div className="ml-auto">
														{profile.Department && (
															<DepartmentDisplay
																departmentName={profile.Department.name}
															/>
														)}
													</div>

													{/* Icon Button: UserPlus or Check */}
													<button
														type="button"
														onClick={() =>
															handleAddMember(profile.profile_id, firstName)
														}
														disabled={isAlreadyMember}
														title={
															isAlreadyMember
																? "Already a member"
																: `Add ${firstName}`
														}
														aria-label={
															isAlreadyMember
																? "Already a member"
																: `Add ${firstName}`
														}
														className={`ml-4 mr-2 p-1.5 rounded-md transition-all flex items-center justify-center shrink-0 ${
															isAlreadyMember
																? "bg-emerald-50 text-emerald-600 cursor-default"
																: "text-brand-500 hover:text-brand-600 active:scale-95"
														}`}
													>
														{isAlreadyMember ? (
															<Check size={16} />
														) : (
															<UserPlus size={16} />
														)}
													</button>
												</div>
											);
										})}
									</div>
								) : null}
							</div>
						)}
					</div>
				</div>

				{/* Current Members - Table Layout */}
				<div className="px-6 mb-6 mt-1 w-full">
					{membersLoading ? (
						<Searching />
					) : nonClientMembers.length === 0 ? (
						<Lacking />
					) : (
						<div className="w-full bg-neutral-surface overflow-x-auto rounded h-80 overflow-y-scroll border border-brand-100">
							<table className="w-full border-collapse text-left">
								<thead className="sticky top-0 z-10 bg-brand-50 border-b border-brand-100 text-xs font-semibold text-neutral-border">
									<tr>
										<th scope="col" className="px-3 py-2.5">
											NAME
										</th>
										<th scope="col" className="px-3 py-2.5 w-35">
											DEPARTMENT
										</th>
										<th scope="col" className="px-3 py-2.5 w-12 text-right">
											<span className="sr-only">Actions</span>
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-brand-100/60 bg-neutral-surface">
									{nonClientMembers.map((member) => {
										const user = member.Profile;
										const firstName = user?.first_name || "";
										const lastName = user?.last_name || "";
										const fullName =
											`${firstName} ${lastName}`.trim() || "Unknown User";
										const initials =
											`${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() ||
											"?";

										const isOwner = member.Roles?.name === "Project Owner";
										const cannotRemove = isOwner && ownerCount <= 1;

										return (
											<tr
												key={
													member.user_id ||
													`${member.role_id}-${user?.profile_id}`
												}
												className="transition-colors hover:bg-neutral-subtle/20"
											>
												<td className="px-3 py-3 align-middle">
													<div className="flex items-center gap-3 min-w-0">
														<div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-neutral-subtle text-xs font-semibold shrink-0 select-none">
															{initials}
														</div>
														<div className="min-w-0">
															<p className="text-sm font-medium text-slate-900 truncate">
																{fullName}
															</p>
															<p className="text-xs text-slate-400 truncate">
																{user?.email || "No email"}
															</p>
														</div>
													</div>
												</td>
												<td className="px-3 py-3 align-middle text-sm text-neutral-subtle">
													{user?.Department?.name ? (
														<DepartmentDisplay
															departmentName={user.Department.name}
														/>
													) : (
														<span className="text-xs text-slate-400">—</span>
													)}
												</td>
												<td className="px-3 py-3 align-middle text-right w-12">
													<button
														type="button"
														onClick={() =>
															handleRemoveMember(user?.profile_id, firstName)
														}
														disabled={cannotRemove}
														title={
															cannotRemove
																? "Cannot remove the last Project Owner"
																: `Remove ${firstName}`
														}
														aria-label={`Remove ${fullName}`}
														className={`p-1.5 rounded-md transition-colors inline-flex items-center justify-center ${
															cannotRemove
																? "text-brand-100 cursor-not-allowed opacity-30"
																: "text-slate-400 hover:text-red-500 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
														}`}
													>
														<X size={16} />
													</button>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
