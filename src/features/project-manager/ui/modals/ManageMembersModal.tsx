"use client"

import { useState, useEffect, useRef } from "react"
import { useProjectMembers, useAddProjectMember, useRemoveProjectMember } from "@/entities/project"
import { searchProfilesForProject } from "@/entities/project/projectActions"
import { Backdrop } from "@/shared/ui/backdrop"
import { LucideSearch } from "lucide-react"

interface ManageMembersModalProps {
	isOpen: boolean
	projectId: string
	onClose: () => void
}

const DEPARTMENT_STYLES: Record<string,string> = {
	"Project Owner":"bg-[#FFDAD7] text-[#410004]",
	"Project Team":"bg-[#4F46E5] text-[#DAD7FF]",
	"Finance":"bg-[#BAE9D4] text-[#00714D]",
}

export function DepartmentDisplay({departmentName}:{departmentName:string})
{
	return <span className={`px-2 py-0.5 rounded-xl text-xs 
		${DEPARTMENT_STYLES[departmentName]}`}>{departmentName}</span>
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
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const mountedRef = useRef(true)
	const latestQueryRef = useRef("")

	const { data: members, isLoading: membersLoading } =
		useProjectMembers(isOpen ? projectId : null)
	const addMemberMutation = useAddProjectMember()
	const removeMemberMutation = useRemoveProjectMember()

	// Reset search when modal closes
	useEffect(() => {
		if (!isOpen) {
			const id = setTimeout(() => {
				setSearchQuery("")
				setSearchResults([])
			}, 0)
			return () => clearTimeout(id)
		}
	}, [isOpen])

	// Track mount state for async safety
	useEffect(() => {
		mountedRef.current = true
		return () => {
			mountedRef.current = false
		}
	}, [])

	// Debounced search — tracks latest query to discard stale responses
	useEffect(() => {
		if (!searchQuery || searchQuery.trim().length < 1) {
			const id = setTimeout(() => {
				if (mountedRef.current) setSearchResults([])
			}, 0)
			return () => clearTimeout(id)
		}

		const searchId = setTimeout(() => {
			if (mountedRef.current) setIsSearching(true)
		}, 0)
		latestQueryRef.current = searchQuery.trim()

		if (debounceRef.current) clearTimeout(debounceRef.current)

		debounceRef.current = setTimeout(async () => {
			clearTimeout(searchId)
			try {
				const results = await searchProfilesForProject(searchQuery.trim())
				// Filter out client profiles (clients are managed separately)
				const filtered = results.filter((p) => !p.client_id)
				// Only apply results if the query hasn't changed and component is still mounted
				if (mountedRef.current && latestQueryRef.current === searchQuery.trim()) {
					setSearchResults(filtered)
				}
			} catch {
				if (mountedRef.current) setSearchResults([])
			} finally {
				if (mountedRef.current) setIsSearching(false)
			}
		}, 300)

		return () => {
			clearTimeout(searchId)
			if (debounceRef.current) clearTimeout(debounceRef.current)
		}
	}, [searchQuery])

	const handleAddMember = async (profileId: string, roleName: string = "Project Team Member") => {
		const result = await addMemberMutation.mutateAsync({ projectId, profileId, roleName })
		if (!result.success) {
			alert(result.error ?? "Failed to add member")
			return
		}
		setSearchQuery("")
		setSearchResults([])
	}

	const handleRemoveMember = (profileId: string) => {
		removeMemberMutation.mutate({ projectId, profileId })
	}

	if (!isOpen) return null

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
		<Backdrop isOpen={isOpen} onClose={onClose}>
			<div className="bg-white rounded-xl shadow-xl w-lg relative p-6">
				<div className="h-[2em] bg-white rounded-t-xl flex items-center">
					<h2 className="text-l font font-bold text-[#0F172A]">
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

				<div className="border-t border-[#F1F5F9] my-3 -mx-6"></div>

				<div>
					{/* Search Input */}
					<div className="mt-6">

						<div className="relative flex items-center w-full mt-1.5">
							{/* Search Icon */}
							<LucideSearch className="absolute left-3 w-4 h-4 text-[#94A3B8] pointer-events-none" />

							{/* Input Field */}
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Search for people to add"
								className="w-full pl-9 pr-3 py-2 bg-white border border-[#CBD5E1] rounded text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all"
							/>
						</div>
					</div>
					{(searchQuery.trim().length > 0)&&
					<div className="absolute z-10 bg-white mt-1 w-116 drop-shadow-2xl border-b border-l border-r border-[#E2E8F0] rounded">
						{ isSearching ? (
							<div className="flex justify-center text-[#414247] text-[12px] py-2">Searching...</div>
						) : searchQuery.trim().length > 0 && searchResults.length === 0 ? (
							<div className="flex justify-center text-[#414247] text-[12px] py-2">No users found</div>
						) : searchResults.length > 0 ? (
							<div className="divide-y divide-[#E2E8F0] max-h-48 overflow-y-auto items-center flex flex-col">
								{searchResults.map((profile) => {
									const isAlreadyMember = memberIds.has(profile.profile_id)
									return (
										<div
											key={profile.profile_id}
											className="flex w-110 items-center justify-between px-4 py-2.5"
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
													<p className="text-xs text-[#94A3B8] truncate">
														{profile.email}
													</p>
												</div>
												{profile.Department && <DepartmentDisplay departmentName={profile.Department.name}/>}
											</div>
											<button
												onClick={() =>
													handleAddMember(profile.profile_id)
												}
												disabled={isAlreadyMember}
												className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all  ${
													isAlreadyMember
														? "bg-[#F1F5F9] text-[#94A3B8] cursor-not-allowed"
														: "bg-[#EEF2FF] text-[#4F46E5] hover:bg-[#E0E7FF]"
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

					{/* Current Members - Table Layout */}
					<div className="mt-1 w-full">
						
						{(membersLoading || members?.length === 0) && (
						<p className="h-80 text-xs text-[#64748B] flex justify-center items-center">
							{membersLoading ? "Loading members..." : "No members found."}
						</p>
						)}

						{!membersLoading && members && members.filter(m => !m.Users.client_id).length > 0 && (
							<div className="h-80 rounded-lg overflow-y-auto ">
								<table className="w-full border-collapse">
									<thead className="sticky top-0">
										<tr className="bg-[#FFFFFF] border-b border-[#E2E8F0]">
											<th className="text-left text-xs py-2 font-semibold text-[#64748B]">NAME</th>
											<th className="text-left w-[120px] py-2 text-xs font-semibold text-[#64748B]">DEPARTMENT</th>
											<th className="text-center w-[20px] py-2 text-xs font-semibold text-[#64748B]"></th>
										</tr>
									</thead>
									<tbody className="divide-y divide-[#F1F5F9]">
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
													<td className="py-3 text-sm text-[#64748B] align-middle">
														{member.Users.Department &&<DepartmentDisplay departmentName={member.Users.Department.name}/>}
													</td>
													<td className="py-3 px-3 text-right align-middle">
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
											)
										})}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</div>
			</div>
		</Backdrop>
	)
}
