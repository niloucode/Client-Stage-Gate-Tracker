"use client";

import { useState, useRef, useCallback } from "react";
import { PenLine, UploadCloud, X } from "lucide-react";

const ACCEPTED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/svg+xml",
  "image/webp",
];
const ACCEPT_ATTR = ACCEPTED_TYPES.join(",");

type UploadState = "idle" | "dragging" | "preview" | "error";

interface SignatureUploadProps {
  onSignatureChange?: (file: File | null) => void;
}

export function SignatureUpload({ onSignatureChange }: SignatureUploadProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setErrorMsg("Invalid file type. Please upload a PNG, JPG, or SVG.");
        setState("error");
        onSignatureChange?.(null);
        return;
      }
      if (preview) URL.revokeObjectURL(preview);
      const url = URL.createObjectURL(file);
      setPreview(url);
      setFileName(file.name);
      setErrorMsg("");
      setState("preview");
      onSignatureChange?.(file);
    },
    [preview, onSignatureChange],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setState("idle");
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setState("dragging");
  };

  const handleDragLeave = () =>
    setState((s) => (s === "dragging" ? "idle" : s));

  const handleClear = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFileName("");
    setState("idle");
    onSignatureChange?.(null);
  };

  const open = () => inputRef.current?.click();

  if (state === "preview" && preview) {
    return (
      <div className="relative rounded-xl border border-[#C4BFE6] bg-[#F8F7FF] p-4">
        <button
          type="button"
          onClick={handleClear}
          aria-label="Remove signature"
          className="absolute right-2 top-2 rounded-full bg-white p-1 shadow-sm hover:bg-red-50"
        >
          <X className="h-3.5 w-3.5 text-[#6E6B82]" />
        </button>
        <img
          src={preview}
          alt="Uploaded signature"
          className="mx-auto max-h-20 object-contain"
        />
        <p className="mt-2 truncate text-center text-[11px] text-[#9C9AB0]">
          {fileName}
        </p>
      </div>
    );
  }

  const isError = state === "error";
  const isDragging = state === "dragging";

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        className="hidden"
        onChange={handleInputChange}
      />
      <div
        role="button"
        tabIndex={0}
        onClick={open}
        onKeyDown={(e) => e.key === "Enter" && open()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-7 text-center transition-colors ${
          isError
            ? "border-red-300 bg-red-50"
            : isDragging
              ? "border-[#4338CA] bg-[#EEF0FF]"
              : "border-[#C4BFE6] bg-[#F8F7FF] hover:border-[#4338CA] hover:bg-[#EEF0FF]"
        }`}
      >
        {isError ? (
          <UploadCloud className="h-6 w-6 text-red-400" />
        ) : (
          <PenLine className="h-6 w-6 text-[#6E6B82]" />
        )}

        <p
          className={`text-sm font-medium ${isError ? "text-red-600" : "text-[#181724]"}`}
        >
          {isError ? "Upload failed" : "Click to Add Signature"}
        </p>

        <p className={`text-xs ${isError ? "text-red-400" : "text-[#9C9AB0]"}`}>
          {isError ? errorMsg : "Drag & drop or browse — PNG, JPG, SVG"}
        </p>

        {isError ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setState("idle");
              setErrorMsg("");
            }}
            className="mt-1 rounded-md border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-500 hover:bg-red-50"
          >
            Try again
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              open();
            }}
            className="mt-1 rounded-md border border-[#C4BFE6] bg-white px-3 py-1 text-xs font-medium text-[#4338CA] hover:bg-[#EEF0FF]"
          >
            Browse files
          </button>
        )}
      </div>
    </>
  );
}

export default SignatureUpload;
