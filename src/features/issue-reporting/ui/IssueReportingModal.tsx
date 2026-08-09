"use client";

import React, { useState, ChangeEvent, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
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
import { FormInput } from "@/shared/ui/forminput";

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
  urgency: UrgencyLevel;
  description: string;
  systemEnv: string;
  timeOfError: string;
  steps: StepData[];
}

interface IssueReportingModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmitSuccess?: (data: IssueFormState) => void;
}

/* -------------------------------------------------------------------------- */
/* HELPER COMPONENTS                                                         */
/* -------------------------------------------------------------------------- */

/** Label Wrapper for non-input elements (Select & Urgency) */
const FormField = ({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <Label>
      {label}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </Label>
    {children}
  </div>
);

/** Urgency Level Selector Component - Matched h-10 height with SelectTrigger */
const UrgencySelector = ({
  value,
  onChange,
}: {
  value: UrgencyLevel;
  onChange: (level: UrgencyLevel) => void;
}) => {
  const options: { level: UrgencyLevel; label: string; dot: string }[] = [
    { level: "low", label: "Low", dot: "bg-green-600" },
    { level: "medium", label: "Medium", dot: "bg-yellow-500" },
    { level: "high", label: "High", dot: "bg-destructive" },
  ];

  return (
    <div className="mt-2 flex items-center gap-2">
      {options.map((opt) => (
        <Button
          key={opt.level}
          type="button"
          variant={value === opt.level ? "secondary" : "outline"}
          onClick={() => onChange(opt.level)}
          className={`flex-1 text-xs font-medium gap-2 px-2 bg-neutral-surface ${
            value === opt.level ? "border-primary ring-1 ring-primary" : "border-border"
          }`}
        >
          <span className={`h-2 w-2 rounded-full shrink-0 ${opt.dot}`} />
          <span>{opt.label}</span>
        </Button>
      ))}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* MAIN MODAL COMPONENT                                                      */
/* -------------------------------------------------------------------------- */

export const IssueReportingModal: React.FC<IssueReportingModalProps> = ({
  open = true,
  onOpenChange,
  onSubmitSuccess,
}) => {
  const [formData, setFormData] = useState<IssueFormState>({
    name: "",
    type: "",
    specificType: "",
    urgency: "low",
    description: "",
    systemEnv: "",
    timeOfError: "",
    steps: [
      { id: "1", description: "" },
      { id: "2", description: "" },
    ],
  });

  // Ref to target the scrollable steps container
  const stepsContainerRef = useRef<HTMLDivElement>(null);

  const handleTextChange =
    (field: keyof IssueFormState, maxLength?: number) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const val = e.target.value;
      if (maxLength && val.length > maxLength) return;
      setFormData((prev) => ({ ...prev, [field]: val }));
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

    // Smoothly scroll container to the bottom after React renders the new step
    setTimeout(() => {
      stepsContainerRef.current?.scrollTo({
        top: stepsContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 50);
  };

  const handleImageAttach = (id: string, file: File) => {
    const imageUrl = URL.createObjectURL(file);
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.map((s) => (s.id === id ? { ...s, image: imageUrl } : s)),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitSuccess?.(formData);
    onOpenChange?.(false);
  };

  const isFeatureRequest = formData.type === "feature_request";
  const isOtherType = formData.type === "other";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl overflow-hidden">
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Report an Issue</DialogTitle>
        </DialogHeader>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5 overflow-y-auto">
            {/* Issue Name */}
            <FormInput
              label="Name"
              required
              maxLength={60}
              value={formData.name}
              placeholder="Issue Name"
              onChange={handleTextChange("name", 60)}
            />

            {/* Type & Urgency Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 gap-y-7">
              <FormField label="Type" required>
                <Select
                  value={formData.type || "none"}
                  onValueChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      type: val === "none" ? "" : (val as BugType),
                    }))
                  }
                >
                  <SelectTrigger className="h-10 text-xs bg-neutral-surface border-border">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent side="bottom" sideOffset={4}>
                    <SelectItem value="none">Select...</SelectItem>
                    <SelectItem value="feature_request">Feature Request</SelectItem>
                    <SelectItem value="deadlinks">Deadlinks</SelectItem>
                    <SelectItem value="missing_fields">Missing Fields</SelectItem>
                    <SelectItem value="not_saving">Not Saving to Database</SelectItem>
                    <SelectItem value="slow_loading">Slow Loading</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Urgency" required>
                <UrgencySelector
                  value={formData.urgency}
                  onChange={(urgency) => setFormData((prev) => ({ ...prev, urgency }))}
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
                onChange={handleTextChange("specificType", 60)}
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
                placeholder="Specify the device used in encountering the event"
                onChange={handleTextChange("systemEnv", 60)}
              />

              <FormInput
                variant="datetime-local"
                type="datetime-local"
                label="Time of Error"
                value={formData.timeOfError}
                onChange={(e) => setFormData((prev) => ({ ...prev, timeOfError: e.target.value }))}
              />
            </div>

            {/* Steps to Reproduce (Hidden for Feature Requests) */}
            {!isFeatureRequest && (
              <div className="space-y-3 pt-1">
                <Label>Steps to Reproduce</Label>
                <div
                  ref={stepsContainerRef}
                  className="mt-2 space-y-3 max-h-[160px] overflow-y-scroll"
                >
                  {formData.steps.map((step, idx) => (
                    <StepRow
                      key={step.id}
                      index={idx}
                      step={step}
                      onUpdate={(text) => handleStepUpdate(step.id, text)}
                      onRemove={() =>
                        setFormData((prev) => ({
                          ...prev,
                          steps: prev.steps.filter((s) => s.id !== step.id),
                        }))
                      }
                      onAttach={(file) => handleImageAttach(step.id, file)}
                    />
                  ))}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleAddStep}
                  className="text-primary hover:text-primary/90 p-0 h-auto font-semibold text-xs flex items-center gap-1.5 mt-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add another step
                </Button>
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="px-6 py-4 border-t bg-secondary/50 flex items-center justify-end">
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold h-9 px-5">
              Report Bug
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/** Individual Step Row Helper */
const StepRow = ({
  index,
  step,
  onUpdate,
  onRemove,
  onAttach,
}: {
  index: number;
  step: StepData;
  onUpdate: (text: string) => void;
  onRemove: () => void;
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
          className="min-h-[42px] h-[42px] py-2 text-xs resize-none bg-neutral-surface border-border"
        />
        {step.image && (
          <div className="mt-2 relative inline-block group">
            <img src={step.image} alt="Attachment" className="h-12 w-12 object-cover rounded border" />
            <button
              type="button"
              onClick={() => onUpdate(step.description)}
              className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
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
        className="h-[42px] w-[42px] border-dashed shrink-0 bg-neutral-surface border-border hover:bg-neutral-subtle"
        title="Attach Image"
      >
        <ImageIcon className="w-4 h-4 text-muted-foreground" />
      </Button>

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={onRemove}
        className="h-[42px] w-[42px] shrink-0 bg-neutral-surface border-border hover:bg-neutral-subtle hover:text-destructive"
        title="Remove Step"
      >
        <Trash2 className="w-4 h-4 text-muted-foreground" />
      </Button>
    </div>
  );
};

export default IssueReportingModal;