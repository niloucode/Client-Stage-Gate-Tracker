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

interface PDFViewerProps {
  className?: string;
}

export function ContractViewer({ className = "" }: PDFViewerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [removeRequested, setRemoveRequested] = useState(false);
  const [removeConfirmText, setRemoveConfirmText] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Revoke the object URL whenever it changes or the component unmounts
  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl]);

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

  const confirmUpload = () => {
    if (!pendingFile) return;
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFile(pendingFile);
    setFileUrl(URL.createObjectURL(pendingFile));
    setZoom(100);
    setPendingFile(null);
  };

  const cancelUpload = () => {
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
    setRemoveConfirmText("");
    setRemoveRequested(true);
  };

  const cancelRemove = () => {
    setRemoveRequested(false);
    setRemoveConfirmText("");
  };

  const confirmRemove = () => {
    if (!file || removeConfirmText !== file.name) return;
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFile(null);
    setFileUrl(null);
    setRemoveRequested(false);
    setRemoveConfirmText("");
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
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border border-[#E6E4F0] bg-white shadow-sm ${className}`}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 border-b border-[#E6E4F0] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <FileText className="h-4 w-4 shrink-0 text-[#4338CA]" />
          <span className="truncate text-sm font-medium text-[#181724]">
            {file ? file.name : "No document loaded"}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {fileUrl ? (
            <>
              <button
                onClick={zoomOut}
                aria-label="Zoom out"
                className="rounded-lg p-1.5 text-[#6E6B82] hover:bg-[#F6F5FB] hover:text-[#181724]"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                onClick={() => setZoom(100)}
                className="min-w-[3.25rem] rounded-lg px-1.5 py-1 text-xs font-medium text-[#6E6B82] hover:bg-[#F6F5FB] hover:text-[#181724]"
              >
                {zoom}%
              </button>
              <button
                onClick={zoomIn}
                aria-label="Zoom in"
                className="rounded-lg p-1.5 text-[#6E6B82] hover:bg-[#F6F5FB] hover:text-[#181724]"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <span className="mx-1 h-4 w-px bg-[#E6E4F0]" />
              <a
                href={fileUrl}
                download={file?.name ?? "document.pdf"}
                aria-label="Download"
                className="rounded-lg p-1.5 text-[#6E6B82] hover:bg-[#F6F5FB] hover:text-[#181724]"
              >
                <Download className="h-4 w-4" />
              </a>
              <button
                onClick={handlePrint}
                aria-label="Print"
                className="rounded-lg p-1.5 text-[#6E6B82] hover:bg-[#F6F5FB] hover:text-[#181724]"
              >
                <Printer className="h-4 w-4" />
              </button>
              <button
                onClick={requestRemove}
                aria-label="Remove document"
                className="rounded-lg p-1.5 text-[#6E6B82] hover:bg-[#FEF2F2] hover:text-[#DC2626]"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg bg-[#4338CA] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#3730A3]"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload Contract
            </button>
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
              className="aspect-[8.5/11] w-full rounded-lg border border-[#E6E4F0] bg-white shadow-sm"
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
          className={`flex flex-1 cursor-pointer flex-col items-center justify-center gap-3 px-6 py-20 text-center transition-colors ${
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
    </div>

    {pendingFile &&
      createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
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
              will become the active contract between you and the client.
              The client will be able to see this document right away.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={cancelUpload}
                className="flex-1 rounded-lg border border-[#E6E4F0] py-2 text-sm font-medium text-[#6E6B82] hover:bg-[#F6F5FB]"
              >
                Cancel
              </button>
              <button
                onClick={confirmUpload}
                className="flex-1 rounded-lg bg-[#4338CA] py-2 text-sm font-medium text-white hover:bg-[#3730A3]"
              >
                Yes, upload
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    {removeRequested &&
      file &&
      createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FEF2F2]">
              <AlertTriangle className="h-5 w-5 text-[#DC2626]" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-[#181724]">
              Remove this contract?
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[#6E6B82]">
              This removes{" "}
              <span className="font-medium text-[#181724]">{file.name}</span>{" "}
              from view. To confirm, type the file name below.
            </p>

            <input
              value={removeConfirmText}
              onChange={(e) => setRemoveConfirmText(e.target.value)}
              placeholder={file.name}
              autoFocus
              className="mt-4 w-full rounded-lg border border-[#E6E4F0] px-3 py-2 text-sm text-[#181724] outline-none focus:border-[#DC2626]"
            />

            <div className="mt-5 flex gap-2">
              <button
                onClick={cancelRemove}
                className="flex-1 rounded-lg border border-[#E6E4F0] py-2 text-sm font-medium text-[#6E6B82] hover:bg-[#F6F5FB]"
              >
                Cancel
              </button>
                <button
                  onClick={confirmRemove}
                  disabled={removeConfirmText !== file.name}
                  className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors disabled:opacity-100 disabled:visible ${
                    removeConfirmText !== file.name
                      ? "border-[#E6E4F0] bg-white text-[#6E6B82] cursor-not-allowed"
                      : "flex-1 rounded-lg bg-[#4338CA] py-2 text-sm font-medium text-white hover:bg-[#3730A3]"
                  }`}
                >
                  Remove
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default ContractViewer;
