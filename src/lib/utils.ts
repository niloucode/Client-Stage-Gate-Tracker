import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind classes with clsx + tailwind-merge (later wins).
 * @param {...any} inputs
 * @returns The result.
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
