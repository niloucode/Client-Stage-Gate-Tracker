"use client";

import Image from "next/image";
import { X } from "lucide-react";

interface ImageLightboxProps {
	src: string;
	alt?: string;
	onClose: () => void;
}

export default function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
	return (
		<div
			className="fixed inset-0 z-60 flex items-center justify-center bg-foreground/70 p-4"
			onClick={onClose}
		>
			<button
				onClick={onClose}
				className="absolute top-4 right-4 text-neutral-surface/70 hover:text-neutral-surface transition-colors p-1 rounded-lg hover:bg-neutral-surface/10"
				aria-label="Close"
			>
				<X size={20} strokeWidth={2.5} />
			</button>
			{/* unoptimized: user-uploaded images of arbitrary size, opened on
			    demand — no LCP benefit, and no remotePatterns are configured
			    for the storage host. width/height 0 + w-auto/h-auto keep the
			    intrinsic auto-sizing of the previous <img>. */}
			<Image
				src={src}
				alt={alt ?? ""}
				unoptimized
				width={0}
				height={0}
				className="max-h-[90vh] max-w-[90vw] w-auto h-auto rounded-lg object-contain"
				onClick={(e) => e.stopPropagation()}
			/>
		</div>
	);
}
