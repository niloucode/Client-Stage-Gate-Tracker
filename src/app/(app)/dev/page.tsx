"use client";

import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	CheckCircle2,
	Info,
	AlertTriangle,
	XCircle,
	Trash2,
	Loader2,
} from "lucide-react";

export default function ToastShowcasePage() {
	const triggerSuccessToast = () => {
		toast.add({
			title: "Phase Created",
			description: '"Discovery & UX" phase has been created successfully.',
			type: "success",
		});
	};

	const triggerInfoToast = () => {
		toast.add({
			title: "System Update",
			description: "A new version of the dashboard is available.",
			type: "info",
		});
	};

	const triggerWarningToast = () => {
		toast.add({
			title: "Approaching Deadline",
			description: "Stage 2 milestone is due in less than 24 hours.",
			type: "warning",
		});
	};

	const triggerErrorToast = () => {
		toast.add({
			title: "Action Failed",
			description: "Unable to connect to the server. Please check your network.",
			type: "error",
		});
	};

	const triggerDeleteToast = () => {
		toast.add({
			title: "Item Deleted",
			description: '"Database Migration" workflow has been permanently removed.',
			type: "delete",
		});
	};

	const triggerLoadingToast = () => {
		toast.add({
			title: "Uploading Contract",
			description: "Please wait while we process and verify your file...",
			type: "loading",
		});
	};

	return (
		<div className="min-h-screen bg-background p-8 md:p-12 max-w-5xl mx-auto space-y-8">
			{/* Page Header */}
			<div>
				<h1 className="text-3xl font-bold tracking-tight text-foreground">
					Toast Notification Showcase
				</h1>
				<p className="text-muted-foreground mt-2 text-sm">
					Click any button below to trigger and preview the corresponding toast variation.
				</p>
			</div>

			{/* Interactive Trigger Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{/* Success Toast */}
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-semibold flex items-center gap-2">
							<CheckCircle2 className="w-4 h-4 text-emerald-600" />
							Success Toast
						</CardTitle>
						<CardDescription className="text-xs">
							Used for successful mutations, saves, and additions.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button onClick={triggerSuccessToast} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
							Show Success Toast
						</Button>
					</CardContent>
				</Card>

				{/* Info Toast */}
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-semibold flex items-center gap-2">
							<Info className="w-4 h-4 text-brand-600" />
							Info Toast
						</CardTitle>
						<CardDescription className="text-xs">
							Used for general system notifications and updates.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button onClick={triggerInfoToast} variant="outline" className="w-full">
							Show Info Toast
						</Button>
					</CardContent>
				</Card>

				{/* Warning Toast */}
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-semibold flex items-center gap-2">
							<AlertTriangle className="w-4 h-4 text-amber-600" />
							Warning Toast
						</CardTitle>
						<CardDescription className="text-xs">
							Used for approaching deadlines and non-blocking cautions.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button onClick={triggerWarningToast} variant="secondary" className="w-full bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-200">
							Show Warning Toast
						</Button>
					</CardContent>
				</Card>

				{/* Error Toast */}
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-semibold flex items-center gap-2">
							<XCircle className="w-4 h-4 text-destructive" />
							Error Toast
						</CardTitle>
						<CardDescription className="text-xs">
							Used for server exceptions, failed validation, or offline status.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button onClick={triggerErrorToast} variant="destructive" className="w-full">
							Show Error Toast
						</Button>
					</CardContent>
				</Card>

				{/* Delete Toast */}
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-semibold flex items-center gap-2">
							<Trash2 className="w-4 h-4 text-red-600" />
							Delete Toast
						</CardTitle>
						<CardDescription className="text-xs">
							Used when a phase, module, workflow, or ticket is deleted.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button onClick={triggerDeleteToast} className="w-full bg-red-600 hover:bg-red-700 text-white">
							Show Delete Toast
						</Button>
					</CardContent>
				</Card>

				{/* Loading Toast */}
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-semibold flex items-center gap-2">
							<Loader2 className="w-4 h-4 text-brand-600 animate-spin" />
							Loading Toast
						</CardTitle>
						<CardDescription className="text-xs">
							Used for asynchronous operations currently in progress.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button onClick={triggerLoadingToast} variant="outline" className="w-full border-brand-500 text-brand-600 hover:bg-brand-50">
							Show Loading Toast
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}