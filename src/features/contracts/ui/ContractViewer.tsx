"use client";

import { useEffect, useRef, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	FileText,
	Upload,
	ZoomIn,
	ZoomOut,
	X,
	AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getContractUrl } from "@/entities/contract";
import {
	useUploadContract,
	useDeleteContract,
} from "@/entities/contract";
import { ConfirmTextModal } from "./ConfirmTextModal";

interface PDFViewerProps {
	className?: string;
	projectId: string;
	/** Only the Project Owner may upload/delete/rename (2026-08-15 spec). */
	canManage: boolean;
	initialFilePath?: string | null; // null if contract DOESN'T exist yet
	initialContractName?: string | null;
	onSuccess: () => void;
}

export function ContractViewer({
	className = "",
	projectId,
	canManage,
	initialFilePath,
	initialContractName,
	onSuccess,
}: PDFViewerProps) {
	const [file, setFile] = useState<File | null>(null);
	const [fileUrl, setFileUrl] = useState<string | null>(null);
	const [pendingFile, setPendingFile] = useState<File | null>(null);
	const [fileError, setFileError] = useState<string | null>(null);
	const [zoom, setZoom] = useState(100);
	const [isDragging, setIsDragging] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [contractName, setContractName] = useState("");
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);

	const uploadMutation = useUploadContract();
	const deleteMutation = useDeleteContract();

	const delete_client_phrase = "Yes, I'm Sure";
	const delete_client_text = `You're about to permanently delete ${contractName} 
	from this project. This action will also remove all associated signatures from 
	the contract. To proceed, type "${delete_client_phrase}" below.`;

	useEffect(() => {
		if (initialFilePath) {
			let revoked = false;
			getContractUrl(initialFilePath)
				.then(async (result) => {
					if (!revoked && result.success && result.data) {
						setFileUrl(result.data);

						// Reconstruct File from the public URL
						const response = await fetch(result.data);
						const blob = await response.blob();
						const fileName =
							initialFilePath.split("/").pop() ?? "contract.pdf";
						setFile(
							new File([blob], fileName, { type: "application/pdf" }),
						);
					} else if (!revoked && !result.success) {
						setFileError(
							typeof result.error === "string"
								? result.error
								: "Failed to load contract",
						);
					}
				})
				.catch((err) => {
					if (!revoked) {
						console.error(err);
						setFileError(err.message || "Failed to load contract");
					}
				});
			return () => {
				revoked = true;
			};
		}
	}, [initialFilePath]);

	const isPdfFile = (f: File) =>
		f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");

	// Selecting a file (via picker or drag-and-drop) just stages it — it isn't
	// loaded as the active contract until the user confirms in the modal.
	const selectFile = (next: File | null | undefined) => {
		if (!next) return;
		if (!isPdfFile(next)) {
			setFileError(
				"That doesn't look like a PDF. Please choose a .pdf file.",
			);
			return;
		}
		setFileError(null);
		setContractName(initialContractName ?? next.name);
		setPendingFile(next);
	};

	const confirmUpload = async () => {
		if (!pendingFile || !projectId) return;
		setIsUploading(true);

		try {
			const result = await uploadMutation.mutateAsync({
				projectId,
				file: pendingFile,
				contractName: contractName.trim(),
			});

			setContractName("");
			if (!result.success) {
				setFileError(
					typeof result.error === "string"
						? result.error
						: "Upload failed. Please try again.",
				);
				setPendingFile(null); // close modal, error shows in main view
				return;
			}

			if (fileUrl) URL.revokeObjectURL(fileUrl);
			setFile(pendingFile);
			setFileUrl(URL.createObjectURL(pendingFile));
			setZoom(100);
			setPendingFile(null);
		} catch (err) {
			console.error("Upload failed:", err);
			setFileError("Upload failed. Please try again.");
			setPendingFile(null); // close modal on thrown errors too
		} finally {
			setIsUploading(false);
		}
	};

	const cancelUpload = () => {
		setContractName("");
		setPendingFile(null);
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		selectFile(e.target.files?.[0]);
		e.target.value = "";
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragging(false);
		selectFile(e.dataTransfer.files?.[0]);
	};

	const requestRemove = () => {
		setDeleteModalOpen(true);
	};

	// Returns the action result — ConfirmTextModal surfaces failures.
	const confirmRemove = async () => {
		if (!file || !initialFilePath || !projectId) {
			return { success: false, error: "No document to delete." };
		}
		try {
			const result = await deleteMutation.mutateAsync({
				projectId,
				filePath: initialFilePath,
			});
			setContractName("");

			if (result.success) {
				if (fileUrl) URL.revokeObjectURL(fileUrl);
				setFile(null);
				setFileUrl(null);
				setDeleteModalOpen(false);
			} else {
				setFileError(
					typeof result.error === "string"
						? result.error
						: "Deletion failed. Please try again.",
				);
			}
			return result;
		} catch (err) {
			console.error("Deletion failed:", err);
			setFileError("Deletion failed. Please try again.");
			return { success: false, error: "Deletion failed. Please try again." };
		}
	};

	const zoomIn = () => setZoom((z) => Math.min(z + 10, 200));
	const zoomOut = () => setZoom((z) => Math.max(z - 10, 50));

	return (
		<>
			<Card className={`flex flex-col overflow-hidden ${className}`}>
				<CardContent className="flex flex-1 flex-col overflow-hidden p-0">
					{/* Toolbar */}
					<div className="flex items-center justify-between gap-3 border-b border-lavender-100 px-4 py-3">
						<div className="flex min-w-0 items-center gap-2">
							<FileText className="h-5.5 w-5.5 shrink-0 text-brand-600" />
							<span className="truncate text-sm font-medium text-ink">
								{initialContractName ?? "Contract"}
							</span>
						</div>

						<div className="flex shrink-0 items-center gap-1">
							{fileUrl ? (
								<>
									<Button
										variant="ghost"
										size="icon"
										onClick={zoomOut}
										aria-label="Zoom out"
									>
										<ZoomOut className="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setZoom(100)}
										className="min-w-13"
									>
										{zoom}%
									</Button>
									<Button
										variant="ghost"
										size="icon"
										onClick={zoomIn}
										aria-label="Zoom in"
									>
										<ZoomIn className="h-4 w-4" />
									</Button>
									<span className="mx-1 h-4 w-px bg-lavender-100" />
									{canManage && (
										<Button
											variant="ghost"
											size="icon"
											onClick={requestRemove}
											aria-label="Remove document"
											className="hover:bg-[#FEF2F2] hover:text-red-600"
										>
											<X className="h-4 w-4" />
										</Button>
									)}
								</>
							) : (
								canManage && (
									<Button
										variant="default"
										size="sm"
										onClick={() => inputRef.current?.click()}
										className={"px-4 py-5 bg-brand-600"}
									>
										<Upload size={14} />
										Upload Contract
									</Button>
								)
							)}
						</div>
					</div>

					<input
						ref={inputRef}
						type="file"
						accept="application/pdf"
						onChange={handleInputChange}
						className="hidden"
					/>

					{/* Content */}
					{fileUrl ? (
						<div className="flex-1 overflow-auto bg-[#F6F5FB] p-6">
							<div
								style={{
									width: `${10000 / zoom}%`,
									transform: `scale(${zoom / 100})`,
									transformOrigin: "top left",
								}}
							>
								<embed
									src={`${fileUrl}#toolbar=0`}
									type="application/pdf"
									className="aspect-8.5/11 w-full rounded-md border border-lavender-100 bg-[#D2D9F4] shadow-sm"
								/>
							</div>
						</div>
					) : (
						<div
							onDragOver={
								canManage
									? (e) => {
											e.preventDefault();
											setIsDragging(true);
										}
									: undefined
							}
							onDragLeave={canManage ? () => setIsDragging(false) : undefined}
							onDrop={canManage ? handleDrop : undefined}
							onClick={canManage ? () => inputRef.current?.click() : undefined}
							className={`flex flex-1 cursor-pointer flex-col items-center justify-center gap-3 px-6 text-center transition-colors ${
								isDragging ? "bg-lavender-50" : "bg-neutral-surface"
							}`}
						>
							<div
								className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
									isDragging ? "bg-[#E0B9FF]" : "bg-[#F1DAFF]"
								}`}
							>
								<Upload className="h-5 w-5 text-brand-600" />
							</div>
							<div>
								<p className="text-sm font-medium text-ink w-62.5">
									{canManage
										? "Click to upload or drag and drop a PDF"
										: "No contract document has been uploaded yet."}
								</p>
								<p className="mt-1 text-xs text-plum-400 w-62.5">
									{canManage
										? "Select a document from your computer to preview and prepare for signing here."
										: "Only the Project Owner can upload the contract."}
								</p>
								{fileError && (
									<p className="mt-2 text-xs font-medium text-red-600">
										{fileError}
									</p>
								)}
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			<Dialog
				open={!!pendingFile}
				onOpenChange={(open) => !open && cancelUpload()}
			>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-3">
							<span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFFBEB]">
								<AlertTriangle className="h-5 w-5 text-[#B45309]" />
							</span>
							Upload this as the contract?
						</DialogTitle>
						<DialogDescription className="pt-2">
							<span className="font-medium text-ink">{contractName}</span>{" "}
							will become the active contract between you and the client.
							The client will be able to see this document right away.
						</DialogDescription>
					</DialogHeader>
					<label className="block text-xs font-medium text-plum-400">
						Contract name
					</label>
					<Input
						value={contractName}
						onChange={(e) => setContractName(e.target.value)}
						placeholder="e.g. Input Contract Name here"
						autoFocus
						className="mt-1.5"
					/>
					<DialogFooter showCloseButton={false}>
						<Button
							variant="ghost"
							onClick={cancelUpload}
							disabled={isUploading}
							className="flex-1"
						>
							Cancel
						</Button>
						<Button
							variant="default"
							onClick={confirmUpload}
							disabled={!contractName.trim() || isUploading}
							className="flex-1"
						>
							{isUploading ? "Uploading…" : "Yes, upload"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{deleteModalOpen && file && (
				<ConfirmTextModal
					open={deleteModalOpen}
					onClose={() => setDeleteModalOpen(false)}
					noParamFunc={confirmRemove}
					confirmPhrase={delete_client_phrase}
					displayText={delete_client_text}
					displayTitle="Confirm Contract Deletion"
					buttonText="Delete Contract"
					onSuccess={onSuccess}
				/>
			)}
		</>
	);
}

export default ContractViewer;
