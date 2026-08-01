"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
	FileText,
	Upload,
	ZoomIn,
	ZoomOut,
	Download,
	Printer,
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
	useChangeContractName,
} from "@/entities/contract";

interface PDFViewerProps {
	className?: string;
	projectId: string;
	clientId: string;
	profileId?: string | null;
	initialFilePath?: string | null; //null if contract DOESN'T exist yet
	initialContractName?: string | null;
}

export function ContractViewer({
	className = "",
	projectId,
	clientId,
	initialFilePath,
	initialContractName,
}: PDFViewerProps) {
	const [file, setFile] = useState<File | null>(null);
	const [fileUrl, setFileUrl] = useState<string | null>(null);
	const [pendingFile, setPendingFile] = useState<File | null>(null);
	const [removeRequested, setRemoveRequested] = useState(false);
	const [removeConfirmText, setRemoveConfirmText] = useState("");
	const [fileError, setFileError] = useState<string | null>(null);
	const [zoom, setZoom] = useState(100);
	const [isDragging, setIsDragging] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [contractName, setContractName] = useState(
		file && fileUrl ? file.name : "",
	); //ADDED THISSS
	const [changeName, setChangeName] = useState(
		file && fileUrl ? file.name : "",
	);

	const uploadMutation = useUploadContract();
	const deleteMutation = useDeleteContract();
	const changeNameMutation = useChangeContractName();

	// Revoke the object URL whenever it changes or the component unmounts
	useEffect(() => {
		if (file && fileUrl) {
			setContractName((prev) => prev || initialContractName || file.name);
			setChangeName((prev) => prev || initialContractName || file.name);
		}
	}, [file, fileUrl]);

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
						const fileName = initialFilePath.split("/").pop() ?? "contract.pdf";
						setFile(new File([blob], fileName, { type: "application/pdf" }));
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

	// Selecting a file (via picker or drag-drop) just stages it — it isn't
	// loaded as the active contract until the user confirms in the modal.
	const selectFile = (next: File | null | undefined) => {
		if (!next) return;
		if (!isPdfFile(next)) {
			setFileError("That doesn't look like a PDF. Please choose a .pdf file.");
			return;
		}
		setFileError(null);
		setPendingFile(next);
	};

	const confirmUpload = async () => {
		if (!pendingFile || !projectId) return;
		setIsUploading(true);

		try {
			const result = await uploadMutation.mutateAsync({
				clientId,
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

	const handleDownload = async () => {
		if (!fileUrl) return;
		const response = await fetch(fileUrl);
		const blob = await response.blob();
		const blobUrl = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = blobUrl;
		a.download = changeName || file?.name || "document.pdf";
		if (!a.download.endsWith(".pdf")) a.download += ".pdf";
		a.click();
		URL.revokeObjectURL(blobUrl);
	};

	const requestRemove = () => {
		setRemoveConfirmText("");
		setRemoveRequested(true);
	};

	const cancelRemove = () => {
		setRemoveRequested(false);
		setContractName("");
		setRemoveConfirmText("");
	};

	const confirmRemove = async () => {
		if (
			!file ||
			removeConfirmText !== contractName ||
			!initialFilePath ||
			!projectId
		)
			return;
		try {
			const result = await deleteMutation.mutateAsync({
				projectId,
				filePath: initialFilePath,
			});
			setContractName("");

			if (!result.success) {
				setFileError(
					typeof result.error === "string"
						? result.error
						: "Deletion failed. Please try again.",
				);
				return;
			}

			if (fileUrl) URL.revokeObjectURL(fileUrl);
			setFile(null);
			setFileUrl(null);
			setRemoveRequested(false);
			setRemoveConfirmText("");
		} catch (err) {
			setFileError("Deletion failed. Please try again.");
		}
	};

	const handlePrint = () => {
		if (!fileUrl) return;
		const win = window.open(fileUrl, "_blank");
		if (!win) return;
		win.addEventListener("load", () => win.print());
	};

	const zoomIn = () => setZoom((z) => Math.min(z + 10, 200));
	const zoomOut = () => setZoom((z) => Math.max(z - 10, 50));

	return (
		<>
			<Card className={`flex flex-col overflow-hidden ${className}`}>
				<CardContent className="flex flex-col overflow-hidden p-0">
					{/* Toolbar */}
					<div className="flex items-center justify-between gap-3 border-b border-[#E6E4F0] px-4 py-3">
						<div className="flex min-w-0 items-center gap-2">
							<FileText className="h-5 w-5 shrink-0 text-[#4338CA]" />
							{contractName.trim() != "" && (
								<input
									type="text"
									className="block leading-none py-0 truncate text-sm font-medium text-[#181724] border border-transparent hover:border-foreground"
									value={changeName}
									onChange={(e) => setChangeName(e.target.value)}
									//trigger saving when I click enter
									onKeyDown={(e) => {
										if (e.key === "Enter") e.currentTarget.blur();
									}}
									onBlur={() => {
										//check if contract exists first
										if (!changeName || !file) return;
										changeNameMutation.mutate({
											projectId,
											contractName: changeName.trim(),
										});
									}}
								/>
							)}
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
										className="min-w-[3.25rem]"
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
									<span className="mx-1 h-4 w-px bg-[#E6E4F0]" />
									<Button
										variant="ghost"
										size="icon"
										onClick={handleDownload}
										aria-label="Download"
									>
										<Download className="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										onClick={handlePrint}
										aria-label="Print"
									>
										<Printer className="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										onClick={requestRemove}
										aria-label="Remove document"
										className="hover:bg-[#FEF2F2] hover:text-[#DC2626]"
									>
										<X className="h-4 w-4" />
									</Button>
								</>
							) : (
								<Button
									variant="default"
									size="sm"
									onClick={() => inputRef.current?.click()}
								>
									<Upload size={14} />
									Upload
								</Button>
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
									className="aspect-[8.5/11] w-full rounded-lg border border-[#E6E4F0] bg-neutral-surface shadow-sm"
								/>
							</div>
						</div>
					) : (
						<div
							onDragOver={(e) => {
								e.preventDefault();
								setIsDragging(true);
							}}
							onDragLeave={() => setIsDragging(false)}
							onDrop={handleDrop}
							onClick={() => inputRef.current?.click()}
							className={`flex flex-1 min-h-full cursor-pointer flex-col items-center justify-center gap-3 px-6 py-20 text-center transition-colors ${
								isDragging ? "bg-[#EEF0FF]" : "bg-[#FAFAFD]"
							}`}
						>
							<div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF0FF]">
								<Upload className="h-5 w-5 text-[#4338CA]" />
							</div>
							<div>
								<p className="text-sm font-medium text-[#181724]">
									Click to upload or drag and drop a PDF
								</p>
								<p className="mt-1 text-xs text-[#6E6B82]">
									Select a document from your computer to preview it here
								</p>
								{fileError && (
									<p className="mt-2 text-xs font-medium text-[#DC2626]">
										{fileError}
									</p>
								)}
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{pendingFile &&
				createPortal(
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-foregroundal-main/40 px-4">
						<div className="w-full max-w-sm rounded-2xl bg-neutral-surface p-6 shadow-xl">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFFBEB]">
								<AlertTriangle className="h-5 w-5 text-[#B45309]" />
							</div>
							<h3 className="mt-4 text-sm font-semibold text-[#181724]">
								Upload this as the contract?
							</h3>
							<p className="mt-1.5 text-sm leading-relaxed text-[#6E6B82]">
								<span className="font-medium text-[#181724]">
									{pendingFile.name}
								</span>{" "}
								will become the active contract between you and the client. The
								client will be able to see this document right away.
							</p>
							<label className="mt-4 block text-xs font-medium text-[#6E6B82]">
								{" "}
								{/* ALSO ADDED THIS */}
								Contract name
							</label>
							<Input
								value={contractName}
								onChange={(e) => setContractName(e.target.value)}
								placeholder="e.g. Input Contract Name here"
								autoFocus
								className="mt-1.5"
							/>
							<div className="mt-5 flex gap-2">
								<Button
									variant="ghost"
									onClick={cancelUpload}
									className="flex-1"
								>
									Cancel
								</Button>
								<Button
									variant="default"
									onClick={confirmUpload}
									disabled={!contractName.trim()}
									className="flex-1"
								>
									Yes, upload
								</Button>
							</div>
						</div>
					</div>,
					document.body,
				)}

			{removeRequested &&
				file &&
				createPortal(
					<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-foreground/70 backdrop-blur-sm px-4">
						<div className="w-full max-w-sm rounded-2xl bg-neutral-surface p-6 shadow-xl">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FEF2F2]">
								<AlertTriangle className="h-5 w-5 text-[#DC2626]" />
							</div>
							<h3 className="mt-4 text-sm font-semibold text-[#181724]">
								Remove this contract?
							</h3>
							<p className="mt-1.5 text-sm leading-relaxed text-[#6E6B82]">
								This removes{" "}
								<span className="font-medium text-[#181724]">
									{contractName}
								</span>{" "}
								from view. To confirm, type the file name below.
							</p>

							<Input
								value={removeConfirmText}
								onChange={(e) => setRemoveConfirmText(e.target.value)}
								placeholder={contractName}
								autoFocus
								className="mt-4 focus-visible:border-[#DC2626]"
							/>

							<div className="mt-5 flex gap-2">
								<Button
									variant="ghost"
									onClick={cancelRemove}
									className="flex-1"
								>
									Cancel
								</Button>
								<Button
									variant="default"
									onClick={confirmRemove}
									disabled={removeConfirmText !== contractName}
									className="flex-1"
								>
									Remove
								</Button>
							</div>
						</div>
					</div>,
					document.body,
				)}
		</>
	);
}

export default ContractViewer;
