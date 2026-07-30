"use client";

import { useState } from "react";
import {
	ChevronRight,
	FileText,
	Key,
	Bug,
	BarChart2,
	LayoutDashboard,
	Calendar,
	CheckSquare,
	Package,
	GitMerge,
	Tag,
	ArrowRight,
	Bell,
	Settings,
	LayoutGrid,
	FolderKanban,
	Users,
	LogOut,
	EyeIcon,
	Lock,
} from "lucide-react";
import { StageSequence, Stage } from "./StageSequence";

// ─── Brand colours (as-is from ProjectStructure file — no replacement applied here) ───
const BRAND = "#6b1fa8";
const BRAND_DARK = "#500086";
const BRAND_LIGHT = "#f1daff";
const BRAND_XLIGHT = "#faf8fd";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Ticket {
	code: string;
	title: string;
	dateRange: string;
}

interface StatItem {
	label: string;
	done: number;
	total: number;
	icon: React.ReactNode;
}

interface ProjectStructureProps {
	projectName?: string;
	overallProgress?: number;
	stages?: Stage[];
	currentStageName?: string;
	currentStageNumber?: number;
	currentStageDescription?: string;
	currentStageDateRange?: string;
	stats?: StatItem[];
	currentPhaseName?: string;
	currentPhaseDescription?: string;
	currentPhaseProgress?: number;
	urgentTickets?: Ticket[];
	onAddStage?: () => void;
	onViewContract?: () => void;
	onCredentialsRepo?: () => void;
	onIssueReport?: () => void;
	onProjectDashboard?: () => void;
	onViewGateOverview?: () => void;
	onViewEntireStage?: () => void;
	showAddStageButton?: boolean;
	/** Avatar initials for top-right user pill */
	userInitials?: string;
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
	{ label: "Dashboard", icon: LayoutDashboard },
	{ label: "Projects", icon: FolderKanban },
	{ label: "Clients", icon: Users },
];

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, done, total, icon }: StatItem) {
	return (
		<div
			className="flex flex-1 items-center gap-4 rounded-xl bg-white p-4"
			style={{ border: "1px solid #e5e3e0" }}
		>
			<div
				className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
				style={{ backgroundColor: `${BRAND}1A` }}
			>
				{icon}
			</div>
			<div>
				<p className="text-[12px] font-semibold" style={{ color: "#6b6b6b" }}>
					{label}
				</p>
				<p
					className="text-[24px] font-semibold leading-tight"
					style={{ color: BRAND_DARK }}
				>
					{done}{" "}
					<span
						className="text-[14px] font-normal"
						style={{ color: "#6b6b6b" }}
					>
						/ {total}
					</span>
				</p>
			</div>
		</div>
	);
}

// ─── Ticket Row ───────────────────────────────────────────────────────────────

function TicketRow({ code, title, dateRange }: Ticket) {
	return (
		<div
			className="flex items-center justify-between rounded bg-white px-4 py-3"
			style={{ border: "1px solid #e5e3e0" }}
		>
			<div className="flex items-center gap-3">
				<span
					className="rounded px-2 py-1 text-[12px] font-bold"
					style={{
						backgroundColor: `${BRAND_DARK}0D`,
						border: `1px solid ${BRAND_DARK}`,
						color: BRAND_DARK,
					}}
				>
					{code}
				</span>
				<span className="text-[14px] font-medium" style={{ color: "#1a1a1a" }}>
					{title}
				</span>
			</div>
			<span
				className="rounded-full px-3 py-1 text-[12px] font-semibold"
				style={{ backgroundColor: "#efedf1", color: "#7e7384" }}
			>
				{dateRange}
			</span>
		</div>
	);
}

// ─── Default data ─────────────────────────────────────────────────────────────

const DEFAULT_STAGES: Stage[] = [
	{ id: "1", stageNumber: 1, stageName: "Stage Name", approved: true },
	{
		id: "2",
		stageNumber: 2,
		stageName: "Stage Name",
		approved: true,
		current: true,
	},
	{ id: "3", stageNumber: 3, stageName: "Stage Name", approved: false },
];

const DEFAULT_STATS: StatItem[] = [
	{
		label: "Phases Done",
		done: 2,
		total: 4,
		icon: (
			<CheckSquare
				className="h-[13px] w-[15px]"
				style={{ color: BRAND_DARK }}
			/>
		),
	},
	{
		label: "Modules Done",
		done: 12,
		total: 15,
		icon: (
			<Package className="h-[13px] w-[13px]" style={{ color: BRAND_DARK }} />
		),
	},
	{
		label: "Workflows Done",
		done: 8,
		total: 10,
		icon: (
			<GitMerge className="h-[15px] w-[13px]" style={{ color: BRAND_DARK }} />
		),
	},
	{
		label: "Tickets Done",
		done: 12,
		total: 15,
		icon: <Tag className="h-[12px] w-[15px]" style={{ color: BRAND_DARK }} />,
	},
];

const DEFAULT_TICKETS: Ticket[] = [
	{
		code: "DEV-102",
		title: "Setup OAuth Middleware",
		dateRange: "OCT 14 - OCT 18",
	},
	{
		code: "DEV-105",
		title: "User Profile API Hooks",
		dateRange: "OCT 15 - OCT 20",
	},
	{
		code: "DEV-108",
		title: "Database Migration Plan",
		dateRange: "OCT 18 - OCT 22",
	},
	{
		code: "DEV-112",
		title: "Sanity CMS Schema Setup",
		dateRange: "OCT 20 - OCT 25",
	},
	{
		code: "DEV-115",
		title: "Asset Optimization Flow",
		dateRange: "OCT 22 - OCT 28",
	},
	{
		code: "DEV-119",
		title: "Unit Testing CI Setup",
		dateRange: "OCT 25 - NOV 02",
	},
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ProjectStructure({
	projectName = "BRAND REDESIGN & WEBSITE",
	overallProgress = 85,
	stages = DEFAULT_STAGES,
	currentStageName = "Development & Architecture",
	currentStageNumber = 2,
	currentStageDescription = "Transitioning from strategy to execution. This stage focuses on the core technical implementation of the brand redesign and CMS integration.",
	currentStageDateRange = "OCT 12, 2023 — NOV 30, 2023",
	stats = DEFAULT_STATS,
	currentPhaseName = "Phase 3: Backend Integration",
	currentPhaseDescription = "Executing the API hooks and core CMS functionalities for the primary landing experience.",
	currentPhaseProgress = 60,
	urgentTickets = DEFAULT_TICKETS,
	onAddStage,
	onViewContract,
	onCredentialsRepo,
	onIssueReport,
	onProjectDashboard,
	onViewGateOverview,
	onViewEntireStage,
	showAddStageButton = true,
	userInitials = "AM",
}: ProjectStructureProps) {
	const [selectedStageId, setSelectedStageId] = useState<string | null>(
		stages.find((s) => s.current)?.id ?? null,
	);

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			{/* Scrollable content */}
			<main className="flex-1 overflow-y-auto px-10 py-8">
				{/* Page title */}
				<h1
					className="mb-6 text-[40px] font-bold leading-tight"
					style={{ color: "#1a1a1a" }}
				>
					{projectName}
				</h1>

				{/* ── Section 1: Overall Progress ── */}
				<div className="mb-6 flex gap-6">
					{/* Overall progress card */}
					<div
						className="flex flex-1 flex-col justify-between rounded-lg bg-white p-6"
						style={{ border: "1px solid #e5e3e0" }}
					>
						<div className="flex items-start justify-between">
							<div>
								<div className="flex items-center gap-2 mb-2">
									<BarChart2
										className="h-2.5 w-2.5"
										style={{ color: "#4c4352" }}
									/>
									<span
										className="text-[12px] font-semibold"
										style={{ color: "#4c4352" }}
									>
										OVERALL PROGRESS
									</span>
								</div>
								<div className="flex items-baseline gap-1">
									<span
										className="text-[40px] font-bold leading-none"
										style={{ color: "#1b1b1f" }}
									>
										{overallProgress}
									</span>
									<span
										className="text-[24px] font-semibold"
										style={{ color: "#4c4352" }}
									>
										%
									</span>
								</div>
							</div>
							<button
								onClick={onProjectDashboard}
								className="flex items-center gap-2 rounded px-3 py-2 text-[12px] font-semibold transition-colors hover:bg-gray-50"
								style={{
									border: `1px solid ${BRAND_DARK}`,
									color: BRAND_DARK,
								}}
							>
								<LayoutDashboard className="h-2.5 w-2.5" />
								Project Dashboard
							</button>
						</div>

						{/* Progress bar */}
						<div
							className="mt-4 h-3 w-full overflow-hidden rounded-full"
							style={{ backgroundColor: "#efedf1" }}
						>
							<div
								className="h-full rounded-full"
								style={{
									width: `${overallProgress}%`,
									backgroundColor: "#2d6c00",
								}}
							/>
						</div>
					</div>

					{/* Project access card */}
					<div
						className="flex w-[340px] shrink-0 flex-col gap-3 rounded-lg bg-white p-6"
						style={{ border: "1px solid #e5e3e0" }}
					>
						<div className="flex items-center gap-2">
							<Lock
								className="h-3 w-3 opacity-70"
								style={{ color: "#1a1a1a" }}
							/>
							<span
								className="text-[12px] font-semibold opacity-70"
								style={{ color: "#1a1a1a" }}
							>
								PROJECT ACCESS
							</span>
						</div>
						<button
							onClick={onViewContract}
							className="flex items-center gap-2 rounded px-3 py-2.5 text-[12px] font-semibold transition-colors hover:bg-gray-50"
							style={{ border: `1px solid ${BRAND_DARK}`, color: BRAND_DARK }}
						>
							<EyeIcon className="h-3 w-3" />
							View Contract
						</button>
						<button
							onClick={onCredentialsRepo}
							className="flex items-center gap-2 rounded px-3 py-2.5 text-[12px] font-semibold transition-opacity hover:opacity-80"
							style={{
								backgroundColor: `${BRAND}0D`,
								border: `1px solid ${BRAND}`,
								color: BRAND,
							}}
						>
							<Key className="h-3 w-3" />
							Credentials Repository
						</button>
						<button
							onClick={onIssueReport}
							className="flex items-center gap-3 rounded px-3 py-3 text-[12px] font-semibold transition-opacity hover:opacity-80"
							style={{
								backgroundColor: "#ffdad6",
								border: "1px solid #f1b3b0",
								color: "#93000a",
							}}
						>
							<Bug className="h-3 w-3" />
							Issue Reporting
						</button>
					</div>
				</div>

				{/* ── Section 2: Stage Sequence ── */}
				<div className="mb-6">
					<StageSequence
						stages={stages}
						selectedId={selectedStageId}
						onSelectStage={setSelectedStageId}
						onAddStage={onAddStage}
						showAddButton={showAddStageButton}
					/>
				</div>

				{/* ── Section 3: Current Stage Detail ── */}
				<div
					className="mb-6 rounded-[28px] bg-white p-8"
					style={{ border: "1px solid #e5e3e0" }}
				>
					{/* Stage header */}
					<div className="mb-6 flex items-start justify-between">
						<div className="flex items-start gap-5">
							<div
								className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[112px] text-[40px] font-bold"
								style={{
									border: `1px solid ${BRAND_LIGHT}`,
									color: BRAND_DARK,
								}}
							>
								{currentStageNumber}
							</div>
							<div>
								<h2
									className="text-[32px] font-semibold leading-tight"
									style={{ color: "#1a1a1a" }}
								>
									{currentStageName}
								</h2>
								<p className="mt-1 text-base" style={{ color: "#4c4352" }}>
									{currentStageDescription}
								</p>
							</div>
						</div>
						<div
							className="flex shrink-0 items-center gap-2 rounded-xl px-4 py-3"
							style={{ backgroundColor: BRAND_LIGHT }}
						>
							<Calendar
								className="h-[10px] w-[11px]"
								style={{ color: "#2d004f" }}
							/>
							<span
								className="text-[12px] font-semibold whitespace-nowrap"
								style={{ color: "#2d004f" }}
							>
								{currentStageDateRange}
							</span>
						</div>
					</div>

					{/* Stats row */}
					<div className="mb-6 flex gap-4">
						{stats.map((stat) => (
							<StatCard key={stat.label} {...stat} />
						))}
					</div>

					{/* Current phase preview */}
					<div
						className="rounded-lg p-6"
						style={{
							backgroundColor: "#f7f5f2",
							border: "1px solid #e5e3e0",
						}}
					>
						<div className="mb-4 flex items-start justify-between">
							<div>
								<h3
									className="text-[24px] font-semibold"
									style={{ color: "#1a1a1a" }}
								>
									{currentPhaseName}
								</h3>
								<p className="mt-1 text-[14px]" style={{ color: "#4c4352" }}>
									{currentPhaseDescription}
								</p>
							</div>
							<div className="text-right">
								<p
									className="text-[12px] font-semibold"
									style={{ color: BRAND_DARK }}
								>
									PROGRESS
								</p>
								<p
									className="text-[24px] font-semibold"
									style={{ color: BRAND_DARK }}
								>
									{currentPhaseProgress}%
								</p>
							</div>
						</div>

						<p
							className="mb-3 text-[12px] font-semibold"
							style={{ color: "#1a1a1a" }}
						>
							URGENT TICKETS
						</p>
						<div className="grid grid-cols-2 gap-3">
							{urgentTickets.map((ticket) => (
								<TicketRow key={ticket.code} {...ticket} />
							))}
						</div>
					</div>

					{/* View entire stage button */}
					<button
						onClick={onViewEntireStage}
						className="mt-5 flex w-full items-center justify-center gap-2 rounded px-4 py-3 text-[12px] font-semibold transition-colors hover:bg-gray-50"
						style={{ border: `1px solid ${BRAND_DARK}`, color: BRAND_DARK }}
					>
						<ArrowRight className="h-[11px] w-[10px]" />
						View Entire Stage Structure
					</button>
				</div>

				{/* ── Section 4: Gate Overview ── */}
				<div
					className="relative overflow-hidden rounded-lg bg-white p-8"
					style={{ border: "1px solid #e5e3e0" }}
				>
					{/* Subtle brand tint on left */}
					<div
						className="absolute left-0 top-0 bottom-0 w-[169px]"
						style={{ backgroundColor: `${BRAND}0D` }}
					/>
					<div className="relative flex items-center gap-6">
						<div
							className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
							style={{ backgroundColor: BRAND_DARK }}
						>
							<LayoutGrid className="h-[25px] w-[17px] text-white" />
						</div>
						<div>
							<h3
								className="text-[24px] font-semibold cursor-pointer hover:underline"
								style={{ color: BRAND_DARK }}
								onClick={onViewGateOverview}
							>
								View Gate Overview
							</h3>
							<p className="mt-1 text-[14px]" style={{ color: "#6b6b6b" }}>
								Review mandatory requirements and compliance milestones for
								current stage completion.
							</p>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}

export default ProjectStructure;
