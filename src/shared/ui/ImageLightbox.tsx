"use client";

interface ImageLightboxProps {
	src: string;
	alt?: string;
	onClose: () => void;
}

export default function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
	return (
		<div
			className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/70 p-4"
			onClick={onClose}
		>
			<button
				onClick={onClose}
				className="absolute top-4 right-4 text-neutral-surface/70 hover:text-neutral-surface transition-colors p-1 rounded-lg hover:bg-neutral-surface/10"
				aria-label="Close"
			>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
					<line x1="18" y1="6" x2="6" y2="18" />
					<line x1="6" y1="6" x2="18" y2="18" />
				</svg>
			</button>
			<img
				src={src}
				alt={alt ?? ""}
				className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
				onClick={(e) => e.stopPropagation()}
			/>
		</div>
	);
}
