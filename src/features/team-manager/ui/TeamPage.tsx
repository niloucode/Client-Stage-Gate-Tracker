"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTeamProfiles } from "@/entities/profile/queries";
import { useAuth } from "@/features/auth";
import { TeamTable } from "./TeamTable";
import type { TeamMember, TeamSortField, SortDirection } from "../model/types";

function TeamHeader() {
	return (
		<div className="mb-6">
			<h1 className="text-4xl font-bold tracking-wide text-foreground">
				Team
			</h1>
			<p className="subtitle">
				View the staff members and specialists working in your studio.
			</p>
		</div>
	);
}

interface TeamToolbarProps {
	searchQuery: string;
	onSearchChange: (value: string) => void;
}

function TeamToolbar({ searchQuery, onSearchChange }: TeamToolbarProps) {
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
		</div>
	);
}

export function TeamPage() {
	const router = useRouter();
	const { user, isLoading: isAuthLoading } = useAuth();
	const isClient = !!user?.client_id;

	const { data: teamData } = useTeamProfiles({ enabled: !isClient });

	const [searchQuery, setSearchQuery] = useState("");
	const [sortField, setSortField] = useState<TeamSortField>("name");
	const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

	// Client profiles have no access to the internal team page
	useEffect(() => {
		if (!isAuthLoading && isClient) {
			router.replace("/dashboard");
		}
	}, [isAuthLoading, isClient, router]);

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
				m.jobTitle.toLowerCase().includes(q)
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

	if (isAuthLoading || isClient) return null;

	const handleSort = (field: TeamSortField) => {
		if (sortField === field) {
			setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
		} else {
			setSortField(field);
			setSortDirection("asc");
		}
	};

	return (
		<main className="flex flex-1 flex-col overflow-hidden">
			<TeamHeader />

			<TeamToolbar
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
			/>

			<TeamTable
				members={sortedMembers}
				sortField={sortField}
				sortDirection={sortDirection}
				onSort={handleSort}
			/>
		</main>
	);
}