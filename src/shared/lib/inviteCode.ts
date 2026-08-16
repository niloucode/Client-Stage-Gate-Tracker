import { createHmac, randomBytes } from "node:crypto";
import { env } from "@/env";

/**
 * Client invite-code utilities (server-side — imported from "use server"
 * modules). The plain code is shown to the project owner exactly once at
 * creation/regeneration; only the HMAC-SHA256 hash is persisted
 * (Clients.invite_code_hash), peppered with CLIENT_INVITE_PEPPER.
 */

// No 0/O/1/I — codes stay unambiguous when read aloud or typed by hand.
// 32 chars divides 256 evenly, so `% ALPHABET.length` has zero modulo bias.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 12;

// Deterministic fallback so local dev works without configuration. Codes
// hashed with this pepper are NOT valid in production — production fails
// closed when the pepper is missing.
const DEV_PEPPER = "dev-client-invite-pepper-change-me";

function getPepper(): string {
	const pepper = env.CLIENT_INVITE_PEPPER;
	if (!pepper) {
		if (process.env.NODE_ENV === "production") {
			throw new Error(
				"CLIENT_INVITE_PEPPER must be set in production — invite codes cannot be hashed without it.",
			);
		}
		console.warn(
			"CLIENT_INVITE_PEPPER is not set — using the development pepper. " +
				"Set it in production so invite codes can't be forged with the known dev value.",
		);
		return DEV_PEPPER;
	}
	return pepper;
}

/** Generate a fresh invite code (12 chars from an unambiguous alphabet). 
 * @returns The generated code.
 */
export function generateInviteCode(): string {
	const bytes = randomBytes(CODE_LENGTH);
	let code = "";
	for (let i = 0; i < CODE_LENGTH; i++) {
		code += ALPHABET[bytes[i] % ALPHABET.length];
	}
	return code;
}

/**
 * Hash a code for storage/lookup. Codes are compared case-insensitively:
 * the input is trimmed + uppercased before hashing.
 * @param code - The raw code to hash.
 * @returns The HMAC-SHA256 hex digest.
 */
export function hashInviteCode(code: string): string {
	return createHmac("sha256", getPepper())
		.update(code.trim().toUpperCase())
		.digest("hex");
}
