"use client";

import { createClient } from "@/lib/supabase/client";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export interface CollectedImage {
	file: File;
	preview: string;
}

/**
 * Filters a file picker's FileList: enforces the 5MB cap and creates
 * object-URL previews. Callers keep `e.target.value = ""` so re-selecting
 * the same file re-fires change.
 */
export function collectImages(fileList: FileList | null): {
	images: CollectedImage[];
	tooLarge: string[];
} {
	if (!fileList || fileList.length === 0) return { images: [], tooLarge: [] };
	const images: CollectedImage[] = [];
	const tooLarge: string[] = [];
	for (const file of Array.from(fileList)) {
		if (file.size > MAX_IMAGE_BYTES) {
			tooLarge.push(file.name);
			continue;
		}
		images.push({ file, preview: URL.createObjectURL(file) });
	}
	return { images, tooLarge };
}

/**
 * All-or-nothing upload into the `images` bucket under `<folder>/` (e.g.
 * "gates", "issues", "tickets"). On failure returns the already-uploaded
 * paths so callers can remove orphans (shared ticket-board pattern).
 */
export async function uploadImages(
	files: File[],
	folder: string,
): Promise<{
	imageUrls: string[];
	uploadedPaths: string[];
	error: string | null;
}> {
	const uploadedPaths: string[] = [];
	const imageUrls: string[] = [];
	let uploadError: string | null = null;
	const supabase = createClient();
	for (const file of files) {
		try {
			const fileExt = file.name.split(".").pop() ?? "img";
			const fileName = `${crypto.randomUUID()}.${fileExt}`;
			const filePath = `${folder}/${fileName}`;
			const { error } = await supabase.storage
				.from("images")
				.upload(filePath, file, { cacheControl: "3600", upsert: false });
			if (error) {
				uploadError = `Failed to upload image: ${error.message}`;
				break;
			}
			uploadedPaths.push(filePath);
			const { data } = supabase.storage.from("images").getPublicUrl(filePath);
			imageUrls.push(data.publicUrl);
		} catch (err) {
			uploadError =
				err instanceof Error ? err.message : "Failed to upload images.";
			break;
		}
	}
	return { imageUrls, uploadedPaths, error: uploadError };
}

/** Releases every object URL (call on remove/close/unmount). */
export function revokeImagePreviews(previews: string[]) {
	for (const url of previews) URL.revokeObjectURL(url);
}
