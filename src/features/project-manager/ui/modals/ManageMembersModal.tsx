"use client"

import { useState, useEffect, useRef } from "react"
import { useDebouncedCallback } from "use-debounce"
import { useResetOnOpen } from "@/shared/hooks/useResetOnOpen"
import { useProjectMembers, useAddProjectMember, useRemoveProjectMember } from "@/entities/project"
import { searchProfilesForProject } from "@/entities/project/projectActions"
import { departmentBadgeStyle } from "@/shared/lib/colors"
import { LucideSearch, X } from "lucide-react"
import { toast } from "@/components/ui/toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Searching, Lacking } from "@/shared/ui/search-status"

interface ManageMembersModalProps {
	isOpen: boolean
	projectId: string
	onClose: () => void
}

export function DepartmentDisplay({departmentName}:{departmentName:string})
{
	return <div className={`px-2 w-25 text-center py-0.5 rounded-xl text-xs 
		${departmentBadgeStyle(departmentName)}`}>{departmentName}</div>
}

export function ManageMembersModal({
	isOpen,
	projectId,
	onClose,
}: ManageMembersModalProps) {
	const [searchQuery, setSearchQuery] = useState("")
	const [searchResults, setSearchResults] = useState<
		Awaited<ReturnType<typeof searchProfilesForProject>>
	>([])
	const [isSearching, setIsSearching] = useState(false)
	const mountedRef = useRef(true)
	const latestQueryRef = useRef("")

	const { data: members, isLoading: membersLoading } =
		useProjectMembers(isOpen ? projectId : null)
	const addMemberMutation = useAddProjectMember()
	const removeMemberMutation = useRemoveProjectMember()

	// Reset search when modal closes
	useResetOnOpen(
		isOpen,
		() => {
			setSearchQuery("")
			setSearchResults([])
		},
		false, // reset on close (dialog already unmounted inputs)
	)

	// Track mount state for async safety
	useEffect(() => {
		mountedRef.current = true
		return () => {
			mountedRef.current = false
		}
	}, [])

// Debounced search — use-debounce handles the timing; the latest-query ref
// discards stale responses.
const debouncedSearch = useDebouncedCallback(async (query: string) => {
	const trimmed = query.trim()
	if (trimmed.length < 1) {
		if (mountedRef.current) setSearchResults([])
		return
	}
	if (mountedRef.current) setIsSearching(true)
	latestQueryRef.current = trimmed
	try {
		const results = await searchProfilesForProject(trimmed)
		// Filter out client profiles (clients are managed separately)
		const filtered = results.filter((p) => !p.client_id)
		// Only apply results if the query hasn't changed and component is still mounted
		if (mountedRef.current && latestQueryRef.current === trimmed) {
			setSearchResults(filtered)
		}
	} catch {
		if (mountedRef.current) setSearchResults([])
	} finally {
		if (mountedRef.current) setIsSearching(false)
	}
}, 300)

	const handleAddMember = async (profileId : string, firstName : string, roleName: string = "Project Team Member") => {
		const result = await addMemberMutation.mutateAsync({ projectId, profileId, roleName })
		if (!result.success) {
			alert(result.error ?? "Failed to add member")
			return
		}
		setSearchQuery("")
		setSearchResults([])
		toast.add({ title: "Given access", description: firstName+" successfully added" })
	}

	const handleRemoveMember = (profileId : string, firstName : string) => {
		removeMemberMutation.mutate({ projectId, profileId })
		toast.add({ title: "Removed Access", description: firstName+" successfully removed" })
	}

	// Find which profile IDs are already members to disable them in search results
	const memberIds = new Set(
		(members ?? []).map((m) => m.user_id),
	)

	// Count project owners
	const ownerCount = (members ?? []).filter(
		(m) => m.Roles?.name === "Project Owner",
	).length

	// Count non-client members for display
	const nonClientCount = (members ?? []).filter(
		(m) => !m.Users.client_id,
	).length

	return (
		<Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Manage Project Members</DialogTitle>
					<DialogDescription>Find and remove members for this project.</DialogDescription>
				</DialogHeader>
					{/* Search Input */}
			<div className="mt-6 px-6">

				<div className="relative flex items-center w-full mt-1.5">
					{/* Search Icon */}
					<LucideSearch className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />

					{/* Input Field */}
					<label htmlFor="member-search" className="sr-only">
						Search for people to add
					</label>
					<input
						id="member-search"
						type="text"
						value={searchQuery}
						onChange={(e) => {
							setSearchQuery(e.target.value)
							debouncedSearch(e.target.value)
						}}
						placeholder="Search for people to add"
						className="w-full pl-9 pr-3 py-2 bg-neutral-surface border border-brand-100 rounded text-sm text-foreground placeholder:text-brand-100 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
					/>
				</div>
				{(searchQuery.trim().length > 0)&&
				<div className="absolute z-10 bg-neutral-surface mt-1 overflow-y-auto h-60 w-[31rem] drop-shadow-2xl border-b border-l border-r border-brand-100 rounded">
					{ isSearching ? (
						<Searching/>
					) : searchQuery.trim().length > 0 && searchResults.length === 0 ? (
						<Lacking/>
					) : searchResults.length > 0 ? (
						<div className="flex mr-auto ml-auto flex-col gap-y-2 items-center ">
							{searchResults.map((profile) => {
								const isAlreadyMember = memberIds.has(profile.profile_id)
								return (
									<div
										key={profile.profile_id}
										className="flex w-full items-center align-items px-2 py-2.5"
									>
										<div className="flex items-center gap-3 min-w-0">
											<div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-neutral-subtle text-xs font-semibold flex-shrink-0">
												{profile.first_name[0]}
												{profile.last_name[0]}
											</div>
											<div className="">
												<p className="text-sm font-medium text-surface truncate">
													{profile.first_name} {profile.last_name}
												</p>
												<p className="text-xs text-neutral-border truncate">
													{profile.email}
												</p>
											</div>
										</div>
										<div className="ml-auto">
											{profile.Department && <DepartmentDisplay departmentName={profile.Department.name}/>}
										</div>
										<button
											onClick={() =>
												handleAddMember(profile.profile_id,profile.first_name)
											}
											disabled={isAlreadyMember}
											className={`w-10 ml-4 mr-2 py-1 text-[10px] font-semibold rounded-lg transition-all  ${
												isAlreadyMember
													? "bg-brand-100 text-brand-25 cursor-not-allowed"
													: "bg-brand-500 text-brand-25 hover:bg-text-neutral-border"
											}`}
										>
											{isAlreadyMember ? "Added" : "Add"}
										</button>
									</div>
								)
							})}
						</div>
					):<></>}
				</div>}
			</div>
				

			{/* Current Members - Table Layout */}
			<div className="px-6 mb-6 mt-1 h-80 w-full overflow-y-scroll ">
				
				{(membersLoading || members?.length === 0) && (
					membersLoading ? <Searching /> : <Lacking />
				)}

				{!membersLoading && members && members.filter(m => !m.Users.client_id).length > 0 && (
					<div className="rounded-lg ">
						<table className="w-full border-collapse">
							<thead className="sticky top-0">
								<tr className="bg-neutral-surface border-b border-brand-100">
									<th className="text-left text-xs py-2 font-semibold text-brand-200">NAME</th>
									<th className="text-left w-[120px] py-2 text-xs font-semibold text-brand-200">DEPARTMENT</th>
									<th className="text-center w-[20px] py-2 text-xs font-semibold text-brand-200"></th>
								</tr>
							</thead>
							<tbody className="">
								{members
									.filter((m) => !m.Users.client_id) // Exclude client profiles
									.map((member) => {
									const isOwner = member.Roles?.name === "Project Owner"
									const isLastOwner = isOwner && ownerCount <= 1
									const cannotRemove = isLastOwner

									return (
										<tr key={`${member.role_id}-${member.user_id}`} className="align-top h-9">
											<td className="py-3 align-middle">
												<div className="flex gap-3">
													<div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-neutral-subtle text-xs font-semibold flex-shrink-0">
														{member.Users.first_name[0]}{member.Users.last_name[0]}
													</div>
												<div>
													<p className="text-sm font-medium text-slate-900">
														{member.Users.first_name} {member.Users.last_name}
													</p>
													<p className="text-xs text-slate-400">
														{member.Users.email}
													</p>
												</div>
												</div>
											</td>
											<td className="py-3 text-sm text-neutral-subtle align-middle">
												{member.Users.Department &&<DepartmentDisplay departmentName={member.Users.Department.name}/>}
											</td>
											<td className="py-3 pl-3 text-right align-middle">
												<button
												onClick={() => handleRemoveMember(member.Users.profile_id, member.Users.first_name)}
												disabled={cannotRemove}
												title={
													cannotRemove
													? "Cannot remove the last Project Owner"
													: "Remove member"
												}
												className={`p-1.5 rounded-lg transition-colors ${
													cannotRemove
													? "text-brand-100 cursor-not-allowed"
													: "text-slate-400 hover:text-red-500 hover:bg-[#FEE2E2]"
												}`}
												>
												<X size={16} />
												</button>
											</td>
										</tr>
									)
								})}
							</tbody>
						</table>
					</div>
				)}
			</div>
			</DialogContent>
		</Dialog>
	)
}
