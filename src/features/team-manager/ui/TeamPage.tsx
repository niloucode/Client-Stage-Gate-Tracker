"use client";

import { useState, useMemo } from "react";
import { Search, Key } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTeamProfiles } from "@/entities/profile";
import { useAuth } from "@/features/auth";
import { useDashboardRole } from "@/entities/roleAssignment";
import { TeamTable } from "./TeamTable";
import { GenerateStaffCodeModal } from "@/features/team-manager";
import type { TeamMember, TeamSortField, SortDirection } from "../model/types";

function TeamHeader() {
	return (
		<div className="mb-6">
			<h1 className="text-4xl font-bold tracking-wide text-foreground">
				Acesoft Team
			</h1>
			<p className="subtitle">
				View your fellow Acesoft Team members.
			</p>
		</div>
	);
}

interface TeamToolbarProps {
	searchQuery: string;
	onSearchChange: (value: string) => void;
	onGenerateCode: () => void;
	showGenerateButton: boolean;
}

function TeamToolbar({
	searchQuery,
	onSearchChange,
	onGenerateCode,
	showGenerateButton,
}: TeamToolbarProps) {
	return (
		<div className="mb-5 flex gap-6 justify-between items-center max-h-10">
			<div className="flex w-187.25 items-center gap-2 rounded-md border border-border bg-neutral-surface px-4 py-2">
				<Search className="h-4 w-4 shrink-0 text-muted-foreground" />
				<Input
					type="text"
					placeholder="Search by name, email, or department..."
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
					className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0"
				/>
			</div>
			{showGenerateButton && (
				<Button className="flex items-center gap-2" onClick={onGenerateCode}>
					<Key className="w-3.5 h-3.5" />
					Generate Code
				</Button>
			)}
		</div>
	);
}

export function TeamPage() {
	const { isLoading: isAuthLoading } = useAuth();
	// Owner gate is ROLE-based (a Project Owner roleAssignment on any
	// project), not department-name-based — departments are a display
	// taxonomy and their names could change (2026-08-15 follow-up).
	const { data: dashboardRole, isLoading: roleLoading } = useDashboardRole();
	const isOwner = dashboardRole === "owner" && !roleLoading;

	// Clients see the same read-only member list as project team members;
	// only the owner-only generate button is gated below.
	const { data: teamData } = useTeamProfiles();

	const [showGenerateModal, setShowGenerateModal] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [sortField, setSortField] = useState<TeamSortField>("name");
	const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

	const members: TeamMember[] = useMemo(() => {
		return (teamData ?? []).map((p) => ({
			id: p.profile_id,
			firstName: p.first_name,
			lastName: p.last_name,
			fullName: `${p.first_name} ${p.last_name}`.trim(),
			email: p.email,
			phone: p.phone ?? "",
			jobTitle: p.job_title ?? "",
			department: p.Department?.name ?? "",
		}));
	}, [teamData]);

	const filteredMembers = useMemo(() => {
		const q = searchQuery.toLowerCase().trim();
		if (!q) return members;
		return members.filter(
			(m) =>
				m.fullName.toLowerCase().includes(q) ||
				m.email.toLowerCase().includes(q) ||
				m.department.toLowerCase().includes(q) ||
				m.jobTitle.toLowerCase().includes(q),
		);
	}, [members, searchQuery]);

	const sortedMembers = useMemo(() => {
		const sorted = [...filteredMembers];
		sorted.sort((a, b) => {
			let aVal = "";
			let bVal = "";
			switch (sortField) {
				case "name":
					aVal = a.fullName.toLowerCase();
					bVal = b.fullName.toLowerCase();
					break;
				case "email":
					aVal = a.email.toLowerCase();
					bVal = b.email.toLowerCase();
					break;
				case "phone":
					aVal = a.phone.toLowerCase();
					bVal = b.phone.toLowerCase();
					break;
				case "jobTitle":
					aVal = a.jobTitle.toLowerCase();
					bVal = b.jobTitle.toLowerCase();
					break;
				case "department":
					aVal = a.department.toLowerCase();
					bVal = b.department.toLowerCase();
					break;
			}
			if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
			if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
			return 0;
		});
		return sorted;
	}, [filteredMembers, sortField, sortDirection]);

	if (isAuthLoading) return null;

	const handleSort = (field: TeamSortField) => {
		if (sortField === field) {
			setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
		} else {
			setSortField(field);
			setSortDirection("asc");
		}
	};

	return (
		<>
			<main className="flex flex-1 flex-col overflow-hidden">
				<TeamHeader />

				<TeamToolbar
					searchQuery={searchQuery}
					onSearchChange={setSearchQuery}
					onGenerateCode={() => setShowGenerateModal(true)}
					showGenerateButton={isOwner}
				/>

				<TeamTable
					members={sortedMembers}
					sortField={sortField}
					sortDirection={sortDirection}
					onSort={handleSort}
				/>
			</main>

			<GenerateStaffCodeModal
				isOpen={showGenerateModal}
				onClose={() => setShowGenerateModal(false)}
			/>
		</>
	);
}
