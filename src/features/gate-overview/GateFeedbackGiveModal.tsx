"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/toast";
import { MessageSquare, Send, Paperclip, X, CheckCircle2, XCircle } from "lucide-react";

export interface GateFeedbackGiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  decisionVariant?: "approved" | "rejected";
  onSubmitFeedback?: (data: {
    feedback: string;
    imageFiles: File[];
    skipFeedback: boolean;
  }) => void;
}

export function GateFeedbackGiveModal({
  isOpen,
  onClose,
  decisionVariant = "approved",
  onSubmitFeedback,
}: GateFeedbackGiveModalProps) {
  const [feedbackText, setFeedbackText] = useState("");
  const [skipFeedback, setSkipFeedback] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isApproved = decisionVariant === "approved";

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        alert(`Image "${file.name}" must be under 5MB.`);
        continue;
      }
      newFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    if (newFiles.length > 0) {
      setImageFiles((prev) => [...prev, ...newFiles]);
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }
    e.target.value = "";
  }

  function removeImage(index: number) {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function handleClose() {
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setFeedbackText("");
    setSkipFeedback(false);
    setImageFiles([]);
    setImagePreviews([]);
    onClose();
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalFeedback = skipFeedback
      ? "No feedback provided."
      : feedbackText.trim();

    if (!skipFeedback && !finalFeedback && imageFiles.length === 0) return;

    onSubmitFeedback?.({
      feedback: finalFeedback,
      imageFiles: skipFeedback ? [] : imageFiles,
      skipFeedback,
    });

    toast.add({
      title: isApproved ? "Gate Approved" : "Gate Rejected",
      description: skipFeedback
        ? `Stage Gate ${decisionVariant} without feedback.`
        : `Feedback and decision submitted successfully.`,
      type: isApproved ? "success" : "delete",
    });

    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isApproved ? (
              <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="size-5 text-red-600 shrink-0" />
            )}
            <span>{isApproved ? "Approve" : "Decline"} Gate Feedback </span>
          </DialogTitle>
          <DialogDescription>
            Place your feedback comment and optional image attachments.
          </DialogDescription>
        </DialogHeader>

        {/* Feedback Form */}
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-brand-600 shrink-0" />
                <span className="text-xs font-bold tracking-wider text-foreground uppercase">
                  {isApproved ? "Approval Comment" : "Rejection Feedback"}
                </span>
              </div>
              {imageFiles.length > 0 && (
                <span className="text-xs text-muted-foreground font-medium">
                  {imageFiles.length} image(s) attached
                </span>
              )}
            </div>

            {/* Comment Textarea */}
            <Textarea
              value={skipFeedback ? "" : feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              disabled={skipFeedback}
              placeholder={
                skipFeedback
                  ? 'Feedback skipped ("I don\'t want to give feedback" is checked)'
                  : `Write your feedback or review for ${isApproved ? "approving" : "declining"} this gate...`
              }
              rows={4}
              className="resize-none text-xs"
            />
          </div>

          {/* Image Attachment Section */}
          {!skipFeedback && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 cursor-pointer"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Attach Images</span>
                </button>
                <span className="text-[11px] text-muted-foreground">
                  (JPG, PNG, WebP · Max 5MB)
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageChange}
                  className="sr-only"
                />
              </div>

              {/* Image Previews Grid */}
              {imagePreviews.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {imagePreviews.map((preview, idx) => (
                    <div key={idx} className="relative inline-block group">
                      <img
                        src={preview}
                        alt={`Attachment ${idx + 1}`}
                        className="h-16 w-16 rounded-md border border-border object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] hover:bg-red-600 transition-colors"
                        title="Remove image"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}


          {/* Footer Actions */}
          <DialogFooter className="pt-2 gap-2" showCloseButton={false}>
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            {isApproved ?
            <Button
              variant="default"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle2 className="size-4" />
              Approve Stage Gate
            </Button>
:
            <Button
              variant="destructive"
              className=""
            >
              <XCircle className="size-4" />
              Decline Stage Gate
            </Button>}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}