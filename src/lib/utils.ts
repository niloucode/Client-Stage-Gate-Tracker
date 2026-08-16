import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merges Tailwind classes with clsx + tailwind-merge (later wins). */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
