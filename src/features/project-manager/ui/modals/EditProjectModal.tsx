"use client"

import { useState, useEffect, useRef } from "react"
import { projectCreateSchema } from "@/shared/schemas"
import { clientSelectAll } from "@/entities/client/clientActions"
import { FormInput, SelectOption } from "@/shared/ui/"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface EditProjectFormData {
  name: string
  description: string
  client_id: string | null
  start_date: Date | null
  deadline_date: Date | null
}

interface EditProjectModalProps {
  isOpen: boolean
  project: {
    project_id: string
    name: string
    description?: string | null
    client_id?: string | null
    start_date?: Date | null
    deadline_date?: Date | null
  } | null // null = "Add" mode
  onClose: () => void
  onSubmit: (data: EditProjectFormData) => void
}

const emptyFormData: EditProjectFormData = {
  name: "",
  description: "",
  client_id: null,
  start_date: null,
  deadline_date: null,
}

type FieldErrors = Partial<Record<keyof EditProjectFormData, string>>

function toDateInput(date: Date | null): string {
  if (!date) return ""
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return d.toISOString().slice(0, 16)
}

export function EditProjectModal({
  isOpen,
  project,
  onClose,
  onSubmit,
}: EditProjectModalProps) {
  const isEditMode = project !== null

  const getInitialFormData = (): EditProjectFormData => {
    if (project) {
      return {
        name: project.name,
        description: project.description ?? "",
        client_id: project.client_id ?? null,
        start_date: project.start_date ?? null,
        deadline_date: project.deadline_date ?? null,
      }
    }
    return emptyFormData
  }

  const [formData, setFormData] = useState<EditProjectFormData>(getInitialFormData)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [clients, setClients] = useState<Awaited<ReturnType<typeof clientSelectAll>>>([])
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    clientSelectAll()
      .then((data) => {
        if (mountedRef.current) setClients(data)
      })
      .catch((err) => console.error("Failed to load clients", err))
  }, [])

  // Sync form data when project prop changes
  useEffect(() => {
    if (isOpen) {
      setFormData(
        project
          ? {
              name: project.name,
              description: project.description ?? "",
              client_id: project.client_id ?? null,
              start_date: project.start_date ?? null,
              deadline_date: project.deadline_date ?? null,
            }
          : emptyFormData
      )
      setFieldErrors({})
    }
  }, [isOpen, project])

  // Reset form state on Add mode open
  useEffect(() => {
    if (isOpen && !project) {
      const id = setTimeout(() => {
        setFormData(emptyFormData)
        setFieldErrors({})
      }, 0)
      return () => clearTimeout(id)
    }
  }, [isOpen, project])

  const formKey = isEditMode ? project.project_id : "new"

  const handleClose = () => {
    setFormData(emptyFormData)
    setFieldErrors({})
    onClose()
  }

  const clearFieldError = (field: keyof EditProjectFormData) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = () => {
    const result = projectCreateSchema.safeParse(formData)
    if (!result.success) {
      const flattened = result.error.flatten().fieldErrors
      const mapped: FieldErrors = {}
      for (const [key, msgs] of Object.entries(flattened)) {
        if (msgs && msgs.length > 0)
          mapped[key as keyof EditProjectFormData] = msgs[0]
      }
      setFieldErrors(mapped)
      return
    }

    setFieldErrors({})
    onSubmit(formData)
  }

  // Format options for the client select dropdown
  const clientOptions: SelectOption[] = [
    { label: "Select client...", value: null },
    ...clients.map((c) => ({
      label: c.client_name,
      value: c.client_id,
    })),
  ]

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Project" : "Create New Project"}</DialogTitle>
          <DialogDescription>Fill in the details for this project.</DialogDescription>
        </DialogHeader>
        <div key={formKey}>
          <div className="space-y-4 p-6">
            {/* Project Name */}
            <FormInput
              variant="input"
              label="Project Name"
              required
              maxLength={50}
              value={formData.name}
              placeholder="Project Name"
              error={fieldErrors.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              onClearError={() => clearFieldError("name")}
            />

            {/* Description */}
            <FormInput
              variant="textarea"
              label="Description"
              maxLength={160}
              rows={4}
              value={formData.description}
              placeholder="Project Description"
              error={fieldErrors.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              onClearError={() => clearFieldError("description")}
            />

            {/* Client Selection (Create Mode Only) */}
            {!isEditMode && (
              <FormInput
                variant="select"
                label="Client"
                required
                placeholder="Select client..."
                options={clientOptions}
                value={formData.client_id}
                isOpen={clientDropdownOpen}
                onToggleOpen={() => setClientDropdownOpen(!clientDropdownOpen)}
                onSelect={(val) => setFormData({ ...formData, client_id: val })}
                error={fieldErrors.client_id}
                onClearError={() => clearFieldError("client_id")}
              />
            )}

            {/* Dates Section */}
            <div className="flex gap-4">
              <FormInput
                variant="datetime-local"
                label="Start Date"
                type="datetime-local"
                value={toDateInput(formData.start_date)}
                error={fieldErrors.start_date}
                containerClassName="flex-1"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    start_date: e.target.value ? new Date(e.target.value) : null,
                  })
                }
                onClearError={() => clearFieldError("start_date")}
              />

              <FormInput
                variant="datetime-local"
                label="Deadline Date"
                type="datetime-local"
                value={toDateInput(formData.deadline_date)}
                error={fieldErrors.deadline_date}
                containerClassName="flex-1"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    deadline_date: e.target.value ? new Date(e.target.value) : null,
                  })
                }
                onClearError={() => clearFieldError("deadline_date")}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleClose} variant="ghost">
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {isEditMode ? "Save Changes" : "Create Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}