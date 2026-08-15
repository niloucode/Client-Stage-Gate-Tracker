"use client";

import { useState, type ChangeEvent } from "react";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Paperclip } from "lucide-react";
import { useCreateComment } from "@/entities/comment";
import { createClient } from "@/lib/supabase/client";
import {
	collectImages,
	revokeImagePreviews,
	uploadImages,
} from "@/shared/lib/imageUpload";
import { CommentParentType } from "@/lib/generated/prisma";
import { ProfileType } from "@/shared/types";
import type { CommentWithImages } from "@/entities/comment";
import { toast } from "@/components/ui/toast";
import TicketHistoryLog from "../TicketHistoryLog";
import { UserAvatar } from "./helpers";

export function TicketActivitySection({
  ticketId,
  comments,
  currentUser,
  onImageClickAction,
}: {
  ticketId: string;
  comments: CommentWithImages[];
  currentUser: ProfileType | null;
  onImageClickAction: (src: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"all" | "comments" | "history">("all");
  const [commentText, setCommentText] = useState("");
  const [commentImages, setCommentImages] = useState<File[]>([]);
  const [commentImagePreviews, setCommentImagePreviews] = useState<string[]>([]);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createCommentMutation = useCreateComment();

  function handleCommentImageChange(e: ChangeEvent<HTMLInputElement>) {
    const { images, tooLarge } = collectImages(e.target.files);
    for (const name of tooLarge) {
      toast.add({
        title: "File Too Large",
        description: `"${name}" must be under 5MB.`,
        type: "error",
      });
    }
    if (images.length > 0) {
      setCommentImages((prev) => [...prev, ...images.map((i) => i.file)]);
      setCommentImagePreviews((prev) => [...prev, ...images.map((i) => i.preview)]);
    }
    e.target.value = "";
  }

  function removeImage(index: number) {
    revokeImagePreviews([commentImagePreviews[index]]);
    setCommentImages((prev) => prev.filter((_, i) => i !== index));
    setCommentImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleAddComment() {
    if (!commentText.trim()) {
      if (commentImages.length > 0) setCommentError("Add some text to go with your image.");
      return;
    }
    setCommentError(null);

    // Hoisted so the catch block can clean up uploaded files on failure.
    let supabase: ReturnType<typeof createClient> | null = null;
    const uploadedPaths: string[] = [];

    try {
      setIsSubmitting(true);
      supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCommentError("You must be logged in to post a comment.");
        return;
      }

      const { imageUrls, uploadedPaths: paths, error: uploadError } = await uploadImages(
        commentImages,
        "comments",
      );
      uploadedPaths.push(...paths);

      if (uploadError) {
        if (uploadedPaths.length > 0) {
          await supabase.storage.from("images").remove(uploadedPaths);
        }
        setCommentError(uploadError);
        return;
      }

      await createCommentMutation.mutateAsync({
        profile_id: user.id,
        description: commentText.trim(),
        parent_type: CommentParentType.TICKET_COMMENT,
        parent_id: ticketId,
        imageUrls,
      });

      setCommentText("");
      setCommentImages([]);
      setCommentImagePreviews([]);
    } catch (error) {
      console.error("Error adding comment:", error);
      // All-or-nothing: remove already-uploaded files so no orphaned blobs
      // remain when the comment fails to post.
      if (uploadedPaths.length > 0 && supabase) {
        await supabase.storage.from("images").remove(uploadedPaths);
      }
      setCommentError("Failed to post comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <div className="px-5 border-b border-gray-200 my-4">
        <Label className="text-md text-neutral-border font-bold tracking-wider uppercase">ACTIVITY</Label>
        <div className="flex gap-3 text-xs mt-1">
          {(["all", "comments", "history"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`relative py-2 font-medium uppercase transition-colors ${activeTab === tab ? "text-brand-600 font-semibold" : "text-gray-500 hover:text-gray-700"}`}
            >
              {tab}
              {activeTab === tab && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 rounded-full" />}
            </button>
          ))}
        </div>
      </div>

      {(activeTab === "history" || activeTab === "all") && (
        <TicketHistoryLog ticketId={ticketId} />
      )}

      {(activeTab === "comments" || activeTab === "all") && (
        <div className="px-5 pb-5">
          {comments.length > 0 && (
            <div className="space-y-3 mb-4">
              {comments.map((comment) => (
                <div key={comment.comment_id} className="flex gap-2.5">
                  <UserAvatar name={`${comment.Profile?.first_name ?? ""} ${comment.Profile?.last_name ?? ""}`} />
                  <div className="flex-1 min-w-0">
                    <div className="bg-neutral-surface border-brand-100 border rounded-md px-3 py-2.5">
                      {comment.images?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {comment.images.map((img) => (
                            <Image
                              key={img.image_id}
                              src={img.image_src}
                              alt="attachment"
                              width={400}
                              height={300}
                              unoptimized
                              className="max-h-40 w-auto rounded-md object-contain cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => onImageClickAction(img.image_src)}
                            />
                          ))}
                        </div>
                      )}
                      {comment.description && <p className="text-sm text-gray-700 leading-relaxed">{comment.description}</p>}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(comment.creation_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 w-full">
            <UserAvatar name={`${currentUser?.first_name ?? ""} ${currentUser?.last_name ?? ""}`} />
            <div className="w-full border border-brand-100 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-brand-500 transition-shadow">
              {commentImagePreviews.length > 0 && (
                <div className="px-3 pt-2.5 flex flex-wrap gap-2">
                  {commentImagePreviews.map((preview, idx) => (
                    <div key={idx} className="relative inline-block">
                      {/* blob: previews are not supported by next/image — plain img is intentional */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preview} alt={`Preview ${idx + 1}`} className="h-16 w-auto rounded-md border border-gray-200 object-cover" />
                      <button type="button" onClick={() => removeImage(idx)} className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-gray-800 text-white flex items-center justify-center text-[10px] hover:bg-red-600">×</button>
                    </div>
                  ))}
                </div>
              )}
              <textarea
                value={commentText}
                onChange={(e) => { setCommentText(e.target.value); setCommentError(null); }}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) void handleAddComment(); }}
                placeholder="Add a comment... (Ctrl+Enter to post)"
                rows={2}
                className="w-full px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none resize-none bg-transparent"
              />
              <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-brand-50">
                <label className="cursor-pointer text-gray-400 hover:text-brand-500 transition-colors" title="Attach images (jpg, png · Max 5MB)">
                  <Paperclip size={16} />
                  <input type="file" accept="image/jpeg,image/png" multiple onChange={handleCommentImageChange} className="sr-only" />
                </label>
                <div className="flex items-center gap-2">
                  {commentError && <p className="text-xs text-destructive">{commentError}</p>}
                  <button type="button" onClick={() => void handleAddComment()} disabled={(!commentText.trim() && commentImages.length === 0) || isSubmitting} className="text-xs font-semibold text-neutral-surface bg-brand-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-md transition-colors">
                    {isSubmitting ? "Posting..." : "Comment"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

