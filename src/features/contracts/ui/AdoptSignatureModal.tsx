"use client";

import { useState } from "react";
import { X } from "lucide-react";

const STYLES = [
  { id: "great-vibes", label: "Style 1", font: "'Great Vibes', cursive" },
  { id: "dancing-script", label: "Style 2", font: "'Dancing Script', cursive" },
  { id: "sacramento", label: "Style 3", font: "'Sacramento', cursive" },
  { id: "alex-brush", label: "Style 4", font: "'Alex Brush', cursive" },
  { id: "allura", label: "Style 5", font: "'Allura', cursive" },
];

const GOOGLE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Great+Vibes&family=Dancing+Script:wght@600&family=Sacramento&family=Alex+Brush&family=Allura&display=swap";

export interface AdoptedSignature {
  fullName: string;
  initials: string;
  font: string;
  styleId: string;
}

interface AdoptSignatureModalProps {
  initialName?: string;
  initialInitials?: string;
  onCancel: () => void;
  onAdopt: (signature: AdoptedSignature) => void;
}

export function AdoptSignatureModal({
  initialName = "",
  initialInitials = "",
  onCancel,
  onAdopt,
}: AdoptSignatureModalProps) {
  const [fullName, setFullName] = useState(initialName);
  const [initials, setInitials] = useState(initialInitials);
  const [styleIndex, setStyleIndex] = useState(0);

  const currentStyle = STYLES[styleIndex];
  const cycleStyle = () => setStyleIndex((i) => (i + 1) % STYLES.length);

  const canAdopt = fullName.trim().length > 0 && initials.trim().length > 0;

  const handleAdopt = () => {
    if (!canAdopt) return;
    onAdopt({
      fullName,
      initials,
      font: currentStyle.font,
      styleId: currentStyle.id,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <link rel="stylesheet" href={GOOGLE_FONTS_HREF} />
      <div className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E3F1] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#181724]">
            Adopt Your Signature
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="rounded p-1 text-[#6E6B82] hover:bg-[#F2F1FA]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="mb-5 text-sm text-[#3F3D52]">
            Confirm your name, initials, and signature.
          </p>

          {/* Name / Initials inputs */}
          <div className="mb-5 grid grid-cols-[1fr_auto] gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#181724]">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-md border border-[#D6D3E8] px-3 py-2 text-sm text-[#181724] outline-none focus:border-[#4338CA] focus:ring-1 focus:ring-[#4338CA]"
                placeholder="Your Name"
              />
            </div>
            <div className="w-28">
              <label className="mb-1.5 block text-xs font-semibold text-[#181724]">
                Initials <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={initials}
                onChange={(e) => setInitials(e.target.value.slice(0, 4))}
                className="w-full rounded-md border border-[#D6D3E8] px-3 py-2 text-center text-sm text-[#181724] outline-none focus:border-[#4338CA] focus:ring-1 focus:ring-[#4338CA]"
                placeholder="YN"
              />
            </div>
          </div>

          {/* Tab */}
          <div className="mb-4 border-b border-[#E5E3F1]">
            <div className="inline-block border-b-2 border-[#4338CA] pb-2 text-xs font-semibold tracking-wide text-[#4338CA]">
              SELECT STYLE
            </div>
          </div>

          
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-[#6E6B82]">
              PREVIEW
            </span>
            {/* 
            <button
              type="button"
              onClick={cycleStyle}
              className="text-xs font-medium text-[#4338CA] hover:underline"
            >
              Change Style
            </button>*/}
          </div>

          <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-lg border border-[#E5E3F1] bg-white px-6 py-8">
            <div className="min-w-0 overflow-hidden">
              <div className="mb-1 text-[10px] font-semibold tracking-wide text-[#4338CA]">
                SIGNED BY:
              </div>
              <div
                className="overflow-visible whitespace-nowrap text-[#181724]"
                style={{
                  fontFamily: currentStyle.font,
                  fontSize: "clamp(18px, 5vw, 30px)",
                  lineHeight: 1.6,
                }}
              >
                {fullName || "Your Name"}
              </div>
            </div>

            <div className="h-16 w-px bg-[#E5E3F1]" />

            <div className="min-w-0">
              <div className="mb-1 text-[10px] font-semibold tracking-wide text-[#4338CA]">
                DS:
              </div>
              <div
                className="whitespace-nowrap text-[#181724]"
                style={{
                  fontFamily: currentStyle.font,
                  fontSize: "30px",
                  lineHeight: 1.6,
                }}
              >
                {initials || "YN"}
              </div>
            </div>
          </div>

          <p className="mt-5 text-xs leading-relaxed text-[#6E6B82]">
            By selecting <span className="font-medium text-[#181724]">Adopt and Sign</span>, I
            agree that the signature and initials will be the electronic
            representation of my signature and initials for all purposes when
            I (or my agent) use them on documents, including legally binding
            contracts.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 bg-[#F5F4FB] px-6 py-4">
          <button
            type="button"
            onClick={handleAdopt}
            disabled={!canAdopt}
            className="rounded-md bg-[#4338CA] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#372FB0] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Adopt and Sign
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-[#D6D3E8] bg-white px-5 py-2.5 text-sm font-semibold text-[#3F3D52] hover:bg-[#F2F1FA]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Renders an adopted (typed) signature to a PNG File so it can be handled
 * by the same code path as an uploaded image file.
 */
export function renderSignatureToFile({
  fullName,
  font,
}: Pick<AdoptedSignature, "fullName" | "font">): Promise<File | null> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");
    if (!ctx) return resolve(null);
    ctx.fillStyle = "#181724";
    ctx.font = `64px ${font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(fullName, canvas.width / 2, canvas.height / 2);
    canvas.toBlob((blob) => {
      if (!blob) return resolve(null);
      resolve(new File([blob], "signature.png", { type: "image/png" }));
    }, "image/png");
  });
}

export default AdoptSignatureModal;
