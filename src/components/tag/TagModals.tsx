"use client";

import { Tag } from '../tickets/types';
import { getPastelStyle, TAG_COLORS } from "@/components/tickets/assets";
import {useState} from "react";
import TagModalDelete from "@/components/tag/TagModalDelete";
import TagListModal from "@/components/tag/TagListModal";
import TagFormModal from "@/components/tag/TagFormModal";


export function CloseButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
        >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
        </button>
    );
}

export function TagBadge({ tag }: { tag: Tag }) {
    const { bg, text, border } = getPastelStyle(tag?.color ?? "#06B6D4");
    return (
        <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
            style={{ backgroundColor: bg, color: text, borderColor: border }}
        >
            {tag.name}
        </span>
    );
}

// ── Color picker ──────────────────────────────────────────────────────────────

export function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
    return (
        <div className="grid grid-cols-9 gap-1.5">
            {TAG_COLORS.map((color) => {
                const isSelected = value === color;
                return (
                    <button
                        key={color}
                        onClick={() => onChange(color)}
                        className="w-7 h-7 rounded-md transition-all hover:scale-110 border-2"
                        style={{
                            backgroundColor: color,
                            borderColor: isSelected ? "#1E1B4B" : "transparent",
                            boxShadow: isSelected ? `0 0 0 2px white, 0 0 0 4px ${color}` : "none",
                        }}
                        aria-label={color}
                    >
                        {isSelected && (
                            <span style={{ color: "white", fontSize: 10, lineHeight: 1, textShadow: "0 0 2px rgba(0,0,0,0.4)" }}>✓</span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

// ── Modal backdrop ────────────────────────────────────────────────────────────

export function Backdrop({ onClick }: { onClick: () => void }) {
    return (
        <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClick}
        />
    );
}

// ── Tag List Modal ────────────────────────────────────────────────────────────



export function TagManager({ isOpen, onClose, onSave, onDelete, tags }: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (
        {name,tag_id,description,color}:{
            name: string,
            tag_id?: string,
            description?: string,
            color?: string
        }) => void;
    onDelete: (tag_id: string) => void;
    tags : Tag[]
}) {
    const [view, setView] = useState<"list" | "create" | "edit" | "delete" | null>("list");
    const [selectedTag, setSelectedTag] = useState<Tag | null>(null);

    if (!isOpen) return null;

    function handleClose() {
        setView("list");
        setSelectedTag(null);
        onClose();
    }

    function handleEditTag(tag: Tag) {
        setSelectedTag(tag);
        setView("edit");
    }

    function handleSaveTag({name,tag_id,description,color}:{name: string, tag_id?: string, description?: string, color?: string
    }) {
        if (!name.trim()) return;
        onSave(
            {
                name:name.trim(),
                description:description?.trim() ?? "",
                color:color,
                tag_id:tag_id ?? ""
            },
        );
        setView("list");
        setSelectedTag(null);
    }

    function handleDeleteTag(tag_id:string) {
        onDelete(tag_id);
        setView("list");
        setSelectedTag(null);
    }

    if (view === "list") {
        return (
            <TagListModal
                tags={tags}
                onClose={handleClose}
                onCreateTag={() => setView("create")}
                onEditTag={handleEditTag}
                onDeleteTag={handleDeleteTag}
            />
        );
    }

    if (view === "create") {
        return (
            <TagFormModal
                mode="create"
                onClose={() => setView("list")}
                onSubmit={handleSaveTag}
            />
        );
    }

    if (view === "edit" && selectedTag) {
        return (
            <TagFormModal
                mode="edit"
                initial={selectedTag}
                onClose={() => setView("list")}
                onSubmit={handleSaveTag}
            />
        );
    }

    if (view === "delete" && selectedTag) {
        return (
            <TagModalDelete
                tag={selectedTag}
                onClose={() => setView("list")}
                onConfirm={handleDeleteTag}
            />
        );
    }

    return null;
}


