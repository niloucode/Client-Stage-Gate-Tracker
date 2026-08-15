"use client";

import React, { useState, ChangeEvent, useRef, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, Image as ImageIcon, Trash2 } from "lucide-react";
import { FormInput } from "@/components/ui/forminput";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { useResetOnOpen } from "@/shared/hooks/useResetOnOpen";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { toast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { useCreateIssue } from "@/entities/issue";
import type { IssueCreateInput } from "@/shared/schemas/issue";

/* -------------------------------------------------------------------------- */
/* TYPES & INTERFACES                                                        */
/* -------------------------------------------------------------------------- */

export type UrgencyLevel = "low" | "medium" | "high";
export type BugType =
  | "feature_request"
  | "deadlinks"
  | "missing_fields"
  | "not_saving"
  | "slow_loading"
  | "other";

export interface StepData {
  id: string;
  description: string;
  image?: string;
}

export interface IssueFormState {
  name: string;
  type: BugType | "";
  specificType: string;
  urgency: UrgencyLevel | "";
  description: string;
  systemEnv: string;
  timeOfError: string;
  steps: StepData[];
}

interface IssueReportingModalProps {
  /** Project the reported issue belongs to (issue-reporting spec). */
  projectId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const initialFormState: IssueFormState = {
  name: "",
  type: "",
  specificType: "",
  urgency: "", // No default priority
  description: "",
  systemEnv: "",
  timeOfError: "",
  steps: [
    { id: "1", description: "" },
    { id: "2", description: "" },
  ],
};

const BUG_TYPE_OPTIONS: { value: BugType; label: string }[] = [
  { value: "feature_request", label: "Feature Request" },
  { value: "deadlinks", label: "Deadlinks" },
  { value: "missing_fields", label: "Missing Fields" },
  { value: "not_saving", label: "Not Saving to Database" },
  { value: "slow_loading", label: "Slow Loading" },
  { value: "other", label: "Other" },
];

/* -------------------------------------------------------------------------- */
/* HELPER COMPONENTS                                                         */
/* -------------------------------------------------------------------------- */

/** Label Wrapper for non-input elements (Select & Priority) */
const FormField = ({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5 w-full">
    <div className="flex justify-between items-center">
      <Label error={!!error}>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {error && (
        <span className="text-xs text-destructive font-medium animate-in fade-in-50">
          {error}
        </span>
      )}
    </div>
    {children}
  </div>
);

/** Priority Selector Component with active highlights and error state */
const UrgencySelector = ({
  value,
  onChange,
  error,
}: {
  value: UrgencyLevel | "";
  onChange: (level: UrgencyLevel) => void;
  error?: boolean;
}) => {
  const options: {
    level: UrgencyLevel;
    label: string;
    dot: string;
    activeClass: string;
  }[] = [
    {
      level: "low",
      label: "Low",
      dot: "bg-yellow-500",
      activeClass:
        "border-yellow-500 ring-2 ring-yellow-500/30 bg-yellow-500/10 text-foreground font-semibold",
    },
    {
      level: "medium",
      label: "Medium",
      dot: "bg-orange-500",
      activeClass:
        "border-orange-500 ring-2 ring-orange-500/30 bg-orange-500/10 text-foreground font-semibold",
    },
    {
      level: "high",
      label: "High",
      dot: "bg-red-500",
      activeClass:
        "border-red-500 ring-2 ring-red-500/30 bg-red-500/10 text-foreground font-semibold",
    },
  ];

  return (
    <div className="flex items-center gap-2 w-full">
      {options.map((opt) => {
        const isSelected = value === opt.level;
        return (
          <Button
            key={opt.level}
            type="button"
            variant={isSelected ? "secondary" : "outline"}
            onClick={() => onChange(opt.level)}
            className={`h-10 flex-1 text-xs font-medium gap-2 px-2 transition-all ${
              isSelected
                ? opt.activeClass
                : error
                  ? "border-destructive/60 bg-neutral-surface hover:border-destructive text-destructive"
                  : "border-border bg-neutral-surface hover:bg-neutral-subtle"
            }`}
          >
            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${opt.dot}`} />
            <span>{opt.label}</span>
          </Button>
        );
      })}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* MAIN MODAL COMPONENT                                                      */
/* -------------------------------------------------------------------------- */

export const IssueReportingModal: React.FC<IssueReportingModalProps> = ({
  projectId,
  open = true,
  onOpenChange,
}) => {
  const [formData, setFormData] = useState<IssueFormState>(initialFormState);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Original Files for step images (object URLs alone cannot be re-uploaded).
  const [attachedFiles, setAttachedFiles] = useState<Record<string, File>>({});
  // Every object URL we create, revoked on close and on unmount (no leaks).
  const objectUrlsRef = useRef<string[]>([]);

  // Ref to target the scrollable steps container
  const stepsContainerRef = useRef<HTMLDivElement>(null);

  const createIssueMutation = useCreateIssue(projectId);

  // Revoke every preview URL created by this modal instance.
  const revokeObjectUrls = () => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current = [];
  };

  // Unmount safety net (modal is kept mounted, but be safe).
  useEffect(() => {
    return () => {
      revokeObjectUrls();
    };
  }, []);

  // Check if form is modified
  const isDirty = useMemo(() => {
    return (
      formData.name.trim() !== "" ||
      formData.type !== "" ||
      formData.specificType.trim() !== "" ||
      formData.urgency !== "" ||
      formData.description.trim() !== "" ||
      formData.systemEnv.trim() !== "" ||
      formData.timeOfError !== "" ||
      formData.steps.some((s) => s.description.trim() !== "" || !!s.image)
    );
  }, [formData]);

  // Reset form when modal opens
  useResetOnOpen(open, () => {
    setFormData(initialFormState);
    setFieldErrors({});
    setShowDiscardConfirm(false);
    setAttachedFiles({});
  });

  const handleClose = () => {
    revokeObjectUrls();
    setFormData(initialFormState);
    setFieldErrors({});
    setShowDiscardConfirm(false);
    setAttachedFiles({});
    onOpenChange?.(false);
  };

  const handleAttemptClose = () => {
    // A submit in flight cannot be canceled — the upload + create finish
    // regardless, so keep the modal open until they resolve.
    if (isSubmitting) return;
    if (isDirty) {
      setShowDiscardConfirm(true);
      return;
    }
    handleClose();
  };

  const handleConfirmDiscard = () => {
    setShowDiscardConfirm(false);
    handleClose();
  };

  const clearFieldError = (key: string) => {
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleTextChange =
    (field: keyof IssueFormState, maxLength?: number) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const val = e.target.value;
      if (maxLength && val.length > maxLength) return;
      setFormData((prev) => ({ ...prev, [field]: val }));
      clearFieldError(field);
    };

  const handleStepUpdate = (id: string, text: string) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.map((s) => (s.id === id ? { ...s, description: text } : s)),
    }));
  };

  const handleAddStep = () => {
    setFormData((prev) => ({
      ...prev,
      steps: [...prev.steps, { id: Date.now().toString(), description: "" }],
    }));

    setTimeout(() => {
      stepsContainerRef.current?.scrollTo({
        top: stepsContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 50);
  };

  const handleImageAttach = (id: string, file: File) => {
    // Mirror the ticket-board 5MB cap; reject early so nothing is uploaded.
    if (file.size > 5 * 1024 * 1024) {
      toast.add({
        title: "File Too Large",
        description: `"${file.name}" must be under 5MB.`,
        type: "error",
      });
      return;
    }
    const imageUrl = URL.createObjectURL(file);
    objectUrlsRef.current.push(imageUrl);
    setAttachedFiles((prev) => ({ ...prev, [id]: file }));
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.map((s) => (s.id === id ? { ...s, image: imageUrl } : s)),
    }));
  };

  // Fix: the ✕ button on a preview clears the IMAGE (previously it re-set the
  // description and could never remove the attachment).
  const handleRemoveStepImage = (id: string) => {
    const target = formData.steps.find((s) => s.id === id);
    if (target?.image) URL.revokeObjectURL(target.image);
    setAttachedFiles((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.map((s) => (s.id === id ? { ...s, image: undefined } : s)),
    }));
  };

  const handleRemoveStep = (id: string) => {
    const target = formData.steps.find((s) => s.id === id);
    if (target?.image) URL.revokeObjectURL(target.image);
    setAttachedFiles((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.filter((s) => s.id !== id),
    }));
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.type) errors.type = "Issue type is required";
    if (!formData.urgency) errors.urgency = "Priority level is required";
    if (formData.type === "other" && !formData.specificType.trim()) {
      errors.specificType = "Specific type is required";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;
    setIsSubmitting(true);

    // 1. Upload step images first (all-or-nothing, ticket-board pattern).
    //    No throws inside the loop — collect the error and bail (WebStorm
    //    flags locally-caught throws).
    const uploadedPaths: string[] = [];
    const stepImages: Record<string, string> = {};
    let uploadError: string | null = null;
    const supabase = createClient();
    for (const step of formData.steps) {
      const file = attachedFiles[step.id];
      if (!step.image || !file) continue;
      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `issues/${fileName}`;

        const { error } = await supabase.storage
          .from("images")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });
        if (error) {
          uploadError = `Failed to upload image: ${error.message}`;
          break;
        }

        uploadedPaths.push(filePath);
        const {
          data: { publicUrl },
        } = supabase.storage.from("images").getPublicUrl(filePath);
        stepImages[step.id] = publicUrl;
      } catch (err) {
        uploadError = err instanceof Error ? err.message : "Failed to upload images.";
        break;
      }
    }

    if (uploadError) {
      // All-or-nothing: remove already-uploaded files and abort so no issue
      // is created without its images.
      if (uploadedPaths.length > 0) {
        await supabase.storage.from("images").remove(uploadedPaths);
      }
      toast.add({
        title: "Upload Failed",
        description: uploadError,
        type: "error",
      });
      setIsSubmitting(false);
      return;
    }

    // 2. Create the issue with the uploaded image URLs.
    const payload: IssueCreateInput = {
      name: formData.name,
      type: formData.type || "other",
      specificType: formData.specificType,
      urgency: formData.urgency || "low",
      description: formData.description,
      systemEnv: formData.systemEnv,
      timeOfError: formData.timeOfError ? new Date(formData.timeOfError) : null,
      steps: formData.steps
        .filter((s) => s.description.trim() !== "" || !!s.image)
        .map((s) => ({ description: s.description, image: stepImages[s.id] ?? null })),
    };

    try {
      await createIssueMutation.mutateAsync(payload);
      toast.add({
        title: "Issue Reported",
        description: `"${formData.name}" has been reported successfully.`,
        type: "success",
      });
      handleClose();
    } catch (error) {
      // Creation failed — drop the just-uploaded images (no orphans).
      if (uploadedPaths.length > 0) {
        const supabase = createClient();
        await supabase.storage.from("images").remove(uploadedPaths);
      }
      toast.add({
        title: "Failed to Report Issue",
        description: error instanceof Error ? error.message : "Please try again.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFeatureRequest = formData.type === "feature_request";
  const isOtherType = formData.type === "other";

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) handleAttemptClose();
        }}
      >
        <DialogContent>
          {/* Header */}
          <DialogHeader>
            <DialogTitle>Report an Issue</DialogTitle>
          </DialogHeader>

          {/* Form Body */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-5 pb-5">
              {/* Issue Name */}
              <FormInput
                label="Name"
                required
                maxLength={60}
                value={formData.name}
                placeholder="Issue Name"
                error={fieldErrors.name}
                onChange={handleTextChange("name", 60)}
                onClearError={() => clearFieldError("name")}
              />

              <div className="flex gap-5">
                {/* Issue Type (w-full with error highlighting) */}
                <FormField label="Type" required error={fieldErrors.type}>
                  <Select
                    value={formData.type || ""}
                    onValueChange={(val) => {
                      setFormData((prev) => ({
                        ...prev,
                        type: val as BugType,
                      }));
                      clearFieldError("type");
                    }}
                  >
                    <SelectTrigger
                      className={`w-full h-10 text-xs bg-neutral-surface transition-colors ${
                        fieldErrors.type
                          ? "border-destructive ring-1 ring-destructive text-destructive"
                          : "border-border"
                      }`}
                    >
                      <SelectValue placeholder="Select issue type..." />
                    </SelectTrigger>
                    <SelectContent side="bottom" sideOffset={4}>
                      {BUG_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                {/* Priority (w-full, no default, highlighted states) */}
                <FormField label="Priority" required error={fieldErrors.urgency}>
                  <UrgencySelector
                    value={formData.urgency}
                    error={!!fieldErrors.urgency}
                    onChange={(urgency) => {
                      setFormData((prev) => ({ ...prev, urgency }));
                      clearFieldError("urgency");
                    }}
                  />
                </FormField>
              </div>
              {/* Conditional Specific Type for 'Other' */}
              {isOtherType && (
                <FormInput
                  label="Specific Issue Type"
                  required
                  maxLength={60}
                  value={formData.specificType}
                  placeholder="Please specify the kind of issue you encountered"
                  error={fieldErrors.specificType}
                  onChange={handleTextChange("specificType", 60)}
                  onClearError={() => clearFieldError("specificType")}
                />
              )}

              {/* Description */}
              <FormInput
                variant="textarea"
                label="Description"
                maxLength={300}
                value={formData.description}
                placeholder="You may include error messages or any descriptive events that occurred in your experience"
                onChange={handleTextChange("description", 300)}
                rows={4}
              />

              {/* System Environment & Time of Error */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="System Environment"
                  maxLength={60}
                  value={formData.systemEnv}
                  placeholder="Specify the device used"
                  onChange={handleTextChange("systemEnv", 60)}
                />

                <DateTimePicker
                  label="Time of Error"
                  value={
                    formData.timeOfError
                      ? new Date(formData.timeOfError)
                      : undefined
                  }
                  onChange={(date) => {
                    setFormData((prev) => ({
                      ...prev,
                      timeOfError: date ? date.toISOString() : "",
                    }));
                    clearFieldError("timeOfError");
                  }}
                  placeholder="Set time of error"
                  error={fieldErrors.timeOfError}
                />
              </div>

              {/* Steps to Reproduce (Hidden for Feature Requests) */}
              {!isFeatureRequest && (
                <div className="space-y-3 pt-1">
                  <Label>Steps to Reproduce</Label>
                  <div
                    ref={stepsContainerRef}
                    className="mt-2 space-y-3 max-h-40 overflow-y-scroll"
                  >
                    {formData.steps.map((step, idx) => (
                      <StepRow
                        key={step.id}
                        index={idx}
                        step={step}
                        onUpdate={(text) => handleStepUpdate(step.id, text)}
                        onRemove={() => handleRemoveStep(step.id)}
                        onRemoveImage={() => handleRemoveStepImage(step.id)}
                        onAttach={(file) => handleImageAttach(step.id, file)}
                      />
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleAddStep}
                    className="text-primary hover:text-primary/90 p-0 h-auto font-semibold text-xs flex items-center gap-1.5 mt-2 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add another step
                  </Button>
                </div>
              )}
            </div>

            {/* Footer */}
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={handleAttemptClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Reporting…" : "Report Bug"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Discard Unsaved Changes Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDiscardConfirm}
        title="Discard Unsaved Issue Report?"
        description="You have entered information for this issue report. Are you sure you want to discard your changes?"
        cancelLabel="Keep Editing"
        confirmLabel="Discard Changes"
        variant="destructive"
        onConfirm={handleConfirmDiscard}
        onCancel={() => setShowDiscardConfirm(false)}
      />
    </>
  );
};

/** Individual Step Row Helper */
const StepRow = ({
  index,
  step,
  onUpdate,
  onRemove,
  onRemoveImage,
  onAttach,
}: {
  index: number;
  step: StepData;
  onUpdate: (text: string) => void;
  onRemove: () => void;
  onRemoveImage: () => void;
  onAttach: (file: File) => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-start gap-2">
      <div className="flex items-center justify-center shrink-0 w-8 h-8 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold mt-1">
        {index + 1}
      </div>

      <div className="flex-1 min-w-0">
        <Textarea
          value={step.description}
          onChange={(e) => onUpdate(e.target.value)}
          placeholder="Describe the action taken..."
          className="min-h-10.5 h-10.5 py-2 text-xs resize-none bg-neutral-surface border-border"
        />
        {step.image && (
          <div className="mt-2 relative inline-block group">
            {/* eslint-disable-next-line @next/next/no-img-element -- object-URL preview; upload happens on submit */}
            <img
              src={step.image}
              alt="Attachment"
              className="h-12 w-12 object-cover rounded border"
            />
            <button
              type="button"
              aria-label="Remove image"
              onClick={onRemoveImage}
              className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onAttach(e.target.files[0])}
      />

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        className="h-10.5 w-10.5 border-dashed shrink-0 bg-neutral-surface border-border hover:bg-neutral-subtle"
        title="Attach Image"
      >
        <ImageIcon className="w-4 h-4 text-muted-foreground" />
      </Button>

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={onRemove}
        className="h-10.5 w-10.5 shrink-0 bg-neutral-surface border-border hover:bg-neutral-subtle hover:text-destructive"
        title="Remove Step"
      >
        <Trash2 className="w-4 h-4 text-muted-foreground" />
      </Button>
    </div>
  );
};

