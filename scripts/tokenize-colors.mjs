/**
 * One-off tokenization sweep: replaces literal-hex Tailwind arbitrary-value
 * classes (text-[#0F172A], bg-[#94A3B8]/10, ...) with palette tokens, so the
 * palette has a single source of truth (globals.css @theme).
 *
 * Mapping uses Tailwind v4 default palette names where they match exactly,
 * plus the custom tokens added to @theme. Safe: only whole utility classes
 * of the form `(bg|text|border|ring|from|to|via|fill|stroke|outline|decoration)-[#HEX]`
 * (with optional /NN opacity) are rewritten.
 *
 * Run from the repo root:  node scripts/tokenize-colors.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const HEX_TO_TOKEN = {
	"0F172A": "slate-900",
	"94A3B8": "slate-400",
	E2E8F0: "slate-200",
	F8FAFC: "slate-50",
	F1F5F9: "slate-100",
	475569: "slate-600",
	"64748B": "slate-500",
	"4338CA": "indigo-700",
	DC2626: "red-600",
	EF4444: "red-500",
	"15803D": "green-700",
	"6B1FA8": "brand-500",
	181724: "ink",
	"6E6B82": "plum-400",
	"4C4352": "plum-700",
	"060D1C": "navy-900",
	E6E4F0: "lavender-100",
	EEF0FF: "lavender-50",
	E5E3F1: "lavender-200",
	E5E3E0: "warm-gray-200",
	"1A1A1A": "charcoal",
};

const UTILITY =
	"(?:bg|text|border|ring|from|to|via|fill|stroke|outline|decoration)";
const CLASS_RE = new RegExp(
	`(${UTILITY})-\\[#([0-9a-fA-F]{6})\\](?:\\/(\\d+))?`,
	"g",
);

function walk(dir) {
	const out = [];
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) out.push(...walk(full));
		else if (full.endsWith(".tsx") || full.endsWith(".ts")) out.push(full);
	}
	return out;
}

const roots = ["src/features", "src/app"].map((p) => join(process.cwd(), p));
const files = roots.flatMap(walk).filter((f) => !f.endsWith("globals.css"));

let total = 0;
for (const file of files) {
	const original = readFileSync(file, "utf8");
	const updated = original.replace(CLASS_RE, (match, util, hex, alpha) => {
		const token = HEX_TO_TOKEN[hex.toUpperCase()];
		if (!token) return match;
		total++;
		return `${util}-${token}${alpha ? `/${alpha}` : ""}`;
	});
	if (updated !== original) writeFileSync(file, updated);
}

console.log(
	`Tokenized ${total} literal-hex classes across ${files.length} files.`,
);
