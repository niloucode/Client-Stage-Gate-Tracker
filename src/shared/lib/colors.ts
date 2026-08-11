export const TAG_COLORS = [
	// row 1 — lighter/medium hues
	"#EF4444",
	"#F97316",
	"#EAB308",
	"#84CC16",
	"#22C55E",
	"#06B6D4",
	"#6366F1",
	"#EC4899",
	"#8B5CF6",
	// row 2 — deeper hues
	"#DC2626",
	"#EA580C",
	"#CA8A04",
	"#16A34A",
	"#0D9488",
	"#0284C7",
	"#4338CA",
	"#DB2777",
	"#7C3AED",
];

/** Human-readable names for TAG_COLORS — used for accessible labels. */
export const TAG_COLOR_NAMES: Record<string, string> = {
	"#EF4444": "Red",
	"#F97316": "Orange",
	"#EAB308": "Yellow",
	"#84CC16": "Lime",
	"#22C55E": "Green",
	"#06B6D4": "Cyan",
	"#6366F1": "Indigo",
	"#EC4899": "Pink",
	"#8B5CF6": "Violet",
	"#DC2626": "Dark Red",
	"#EA580C": "Burnt Orange",
	"#CA8A04": "Olive",
	"#16A34A": "Forest Green",
	"#0D9488": "Teal",
	"#0284C7": "Sky Blue",
	"#4338CA": "Deep Indigo",
	"#DB2777": "Magenta",
	"#7C3AED": "Purple",
};

/** Normalizes a hex color string: strips a leading `#`, expands 3-digit
 * shorthand (`abc` → `aabbcc`), uppercases. Returns `null` for anything
 * that is not a valid hex color.
 */
function normalizeHex(input: string): string | null {
	const stripped = input.trim().replace(/^#/, "");
	const expanded =
		stripped.length === 3
			? stripped
					.split("")
					.map((c) => c + c)
					.join("")
			: stripped;
	if (!/^[0-9a-fA-F]{6}$/.test(expanded)) return null;
	return expanded.toUpperCase();
}

export function getPastelStyle(hex: string): {
	bg: string;
	text: string;
	border: string;
} {
	// normalizeHex strips the `#`, so the fallback is stored hash-less
	const normalized = normalizeHex(hex) ?? "94A3B8";
	const r = parseInt(normalized.slice(0, 2), 16);
	const g = parseInt(normalized.slice(2, 4), 16);
	const b = parseInt(normalized.slice(4, 6), 16);
	const bg = `rgba(${r}, ${g}, ${b}, 0.12)`;
	const text = `#${normalized}`;
	const border = `rgba(${r}, ${g}, ${b}, 0.25)`;
	return { bg, text, border };
}

/**
 * Tailwind classes for department/role badges (Task 5.8 #22).
 * Single source of truth — previously duplicated inline in
 * `ManageMembersModal`. Unknown departments fall back to a neutral slate.
 */
export const DEPARTMENT_BADGE_STYLES: Record<string, string> = {
	"Project Owner": "bg-[#FFDAD7] text-[#410004]",
	"Project Team": "bg-brand-500 text-[#DAD7FF]",
	"Client Viewer": "bg-[#DBEAFE] text-[#1E3A8A]",
	"Finance Team": "bg-[#BAE9D4] text-[#00714D]",
};

export function departmentBadgeStyle(name: string): string {
	return DEPARTMENT_BADGE_STYLES[name] ?? "bg-slate-100 text-slate-600";
}
