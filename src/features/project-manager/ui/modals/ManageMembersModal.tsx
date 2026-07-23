"use client";

import { useState, useEffect, useRef } from "react";
import { useProjectMembers, useAddProjectMember, useRemoveProjectMember } from "@/entities/project";
import { searchProfilesForProject } from "@/entities/project/projectActions";
import { Label } from "@/shared/ui/label";

interface ManageMembersModalProps {
	isOpen: boolean;
	projectId: string;
	onClose: () => void;
}

export function SearchIcon({
  size = 14,
  className = "",
  ...props
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <circle
        cx="6"
        cy="6"
        r="3.75"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M8.75 8.75L12 12"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
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
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const mountedRef = useRef(true);
	const latestQueryRef = useRef("");

	const { data: members, isLoading: membersLoading } =
		useProjectMembers(isOpen ? projectId : null);
	const addMemberMutation = useAddProjectMember();
	const removeMemberMutation = useRemoveProjectMember();

	// Reset search when modal closes
	useEffect(() => {
		if (!isOpen) {
			const id = setTimeout(() => {
				setSearchQuery("");
				setSearchResults([]);
			}, 0);
			return () => clearTimeout(id);
		}
	}, [isOpen]);

	// Track mount state for async safety
	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);

	// Debounced search — tracks latest query to discard stale responses
	useEffect(() => {
		if (!searchQuery || searchQuery.trim().length < 1) {
			const id = setTimeout(() => {
				if (mountedRef.current) setSearchResults([]);
			}, 0);
			return () => clearTimeout(id);
		}

		const searchId = setTimeout(() => {
			if (mountedRef.current) setIsSearching(true);
		}, 0);
		latestQueryRef.current = searchQuery.trim();

		if (debounceRef.current) clearTimeout(debounceRef.current);

		debounceRef.current = setTimeout(async () => {
			clearTimeout(searchId);
			try {
				const results = await searchProfilesForProject(searchQuery.trim());
				// Filter out client profiles (clients are managed separately)
				const filtered = results.filter((p) => !p.client_id);
				// Only apply results if the query hasn't changed and component is still mounted
				if (mountedRef.current && latestQueryRef.current === searchQuery.trim()) {
					setSearchResults(filtered);
				}
			} catch {
				if (mountedRef.current) setSearchResults([]);
			} finally {
				if (mountedRef.current) setIsSearching(false);
			}
		}, 300);

		return () => {
			clearTimeout(searchId);
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [searchQuery]);

	const handleAddMember = async (profileId: string, roleName: string = "Project Team Member") => {
		const result = await addMemberMutation.mutateAsync({ projectId, profileId, roleName });
		if (!result.success) {
			alert(result.error ?? "Failed to add member");
			return;
		}
		setSearchQuery("");
		setSearchResults([]);
	};

	const handleRemoveMember = (profileId: string) => {
		removeMemberMutation.mutate({ projectId, profileId });
	};

	if (!isOpen) return null;

	// Find which profile IDs are already members to disable them in search results
	const memberIds = new Set(
		(members ?? []).map((m) => m.user_id),
	);

	// Count project owners
	const ownerCount = (members ?? []).filter(
		(m) => m.Roles?.name === "Project Owner",
	).length;

	// Count non-client members for display
	const nonClientCount = (members ?? []).filter(
		(m) => !m.Users.client_id,
	).length;

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
			<div className="bg-white rounded-xl shadow-xl w-full max-w-[500px] relative">
				<div className="h-[4em] bg-white rounded-t-xl border-b-1 p-6 flex border-t border-[#F1F5F9]">
					<h2 className="mt-auto mb-auto text-l font text-[#0F172A]">
						Manage Project Members
					</h2>

					<button
						onClick={onClose}
						className="ml-auto text-[#94A3B8] hover:text-[#475569] transition-colors"
					>
						<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
							<path
								d="M15 5L5 15M5 5L15 15"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
							/>
						</svg>
					</button>

				</div>

				<div className="px-6">
					{/* Search Input */}
					<div className="mt-6">

						<div className="relative flex items-center w-full mt-1.5">
							{/* Search Icon */}
							<SearchIcon className="absolute left-3 text-[#94A3B8] pointer-events-none" />

							{/* Input Field */}
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Search for people to add"
								className="w-full pl-9 pr-3 py-2 bg-white border border-[#CBD5E1] rounded-md text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all"
							/>
						</div>
					</div>

					{/* Search Results */}
					{searchResults.length > 0 && (
						<div className="mb-6 border border-[#E2E8F0] rounded-lg divide-y divide-[#E2E8F0] max-h-48 overflow-y-auto">
							{searchResults.map((profile) => {
								const isAlreadyMember = memberIds.has(profile.profile_id);
								return (
									<div
										key={profile.profile_id}
										className="flex items-center justify-between px-4 py-2.5"
									>
										<div className="flex items-center gap-3 min-w-0">
											<div className="w-8 h-8 rounded-full bg-[#E2E8F0] flex items-center justify-center text-[#64748B] text-xs font-semibold flex-shrink-0">
												{profile.first_name[0]}
												{profile.last_name[0]}
											</div>
											<div className="min-w-0">
												<p className="text-sm font-medium text-[#0F172A] truncate">
													{profile.first_name} {profile.last_name}
												</p>
												<div className="flex">
													<p className="text-xs text-[#94A3B8] truncate">{profile.email}{` ·`}</p>
													<span className={"ml-1 px-3 py-1.5 rounded-xl text-xs "+(
														profile.Department?.name 
														? profile.Department.name === "Project Owner"
														? "bg-[#FFDAD7] text-[#410004]"
														: profile.Department.name === "Project Team"
														? "bg-[#4F46E5] text-[#DAD7FF]"
														: "text-[#00714D] bg-[#BAE9D4]" 
														: "")
														}>
															{profile.Department?.name}
													</span>
												</div>
											
											</div>
										</div>
										<button
											onClick={() =>
												handleAddMember(profile.profile_id)
											}
											disabled={isAlreadyMember}
											className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex-shrink-0 ml-2 ${
												isAlreadyMember
													? "bg-[#F1F5F9] text-[#94A3B8] cursor-not-allowed"
													: "bg-[#EEF2FF] text-[#4F46E5] hover:bg-[#E0E7FF]"
											}`}
										>
											{isAlreadyMember ? "Added" : "Add"}
										</button>
									</div>
								);
							})}
						</div>
					)}

					{/* No search results */}
					{searchQuery.trim().length > 0 && !isSearching && searchResults.length === 0 && (
						<div className="mb-6 text-sm text-[#94A3B8] px-4 py-8 text-center border border-dashed border-[#E2E8F0] rounded-lg">
							No users found
						</div>
					)}

					{isSearching && (
						<p className="text-xs text-[#64748B] mb-4">Searching...</p>
					)}

					{/* Current Members - Table Layout */}
					<div>
						{membersLoading && (
							<p className="text-xs text-[#64748B]">Loading members...</p>
						)}

						{!membersLoading && members && members.length === 0 && (
							<p className="text-xs text-[#64748B]">No members found.</p>
						)}

						{!membersLoading && members && members.filter(m => !m.Users.client_id).length > 0 && (
							<div className="rounded-lg overflow-hidden">
								<table className="w-full">
									<thead>
										<tr className="bg-[#FFFFFF] border-b border-[#E2E8F0]">
											<th className="text-left py-3 text-xs font-semibold text-[#64748B]">NAME</th>
											<th className="text-left w-[120px] py-3 text-xs font-semibold text-[#64748B]">DEPARTMENT</th>
											<th className="text-center w-[20px] py-3 text-xs font-semibold text-[#64748B]">ACTION</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-[#F1F5F9] h-[300px]">
										{members
											.filter((m) => !m.Users.client_id) // Exclude client profiles
											.map((member) => {
											const isOwner = member.Roles?.name === "Project Owner";
											const isLastOwner = isOwner && ownerCount <= 1;
											const cannotRemove = isLastOwner;

											return (
												<tr key={`${member.role_id}-${member.user_id}`} className="align-top">
													<td className="py-3 h-[36px]">
														<div className="flex gap-3">
															<div className="w-8 h-8 rounded-full bg-[#E2E8F0] flex items-center justify-center text-[#64748B] text-xs font-semibold flex-shrink-0">
																{member.Users.first_name[0]}{member.Users.last_name[0]}
															</div>
														<div>
															<p className="text-sm font-medium text-[#0F172A]">
																{member.Users.first_name} {member.Users.last_name}
															</p>
															<p className="text-xs text-[#94A3B8]">
																{member.Users.email}
															</p>
														</div>
														</div>
													</td>
													<td className="py-3 text-sm text-[#64748B] h-[36px] align-middle">
															<span className={`px-2 py-0.5 rounded-xl text-xs ${
															member.Users.Department?.name === "Project Owner"
																? "bg-[#FFDAD7] text-[#410004]"
																: member.Users.Department?.name === "Project Team"
																? "bg-[#4F46E5] text-[#DAD7FF]"
																: member.Users.Department?.name
																? "text-[#00714D] bg-[#BAE9D4]"
																: ""
															}`}>
															{member.Users.Department?.name ?? "—"}
															</span>
													</td>
													<td className="py-3 px-3 text-right h-[36px] align-middle">
														<button
														onClick={() => handleRemoveMember(member.user_id)}
														disabled={cannotRemove}
														title={
															cannotRemove
															? "Cannot remove the last Project Owner"
															: "Remove member"
														}
														className={`p-1.5 rounded-lg transition-colors ${
															cannotRemove
															? "text-[#CBD5E1] cursor-not-allowed"
															: "text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#FEE2E2]"
														}`}
														>
														<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
															<path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
														</svg>
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
				</div>

				<div className="flex justify-end gap-3 pr-6 pb-6 border-t border-[#F1F5F9]">
					<button
						onClick={onClose}
						className="px-4 py-2 text-sm font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
}
