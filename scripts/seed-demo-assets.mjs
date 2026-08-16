/**
 * Demo-seed asset uploader — pushes the two demo files into Supabase Storage
 * at the exact paths the demo seed (scripts/seed-demo.sql) references:
 *   - Lorem_ipsum.png  → images/demo/lorem-ipsum-{1..4}.png  (public URLs)
 *   - 867-Article….pdf → contracts/<demo-project>/primefoods-portal-agreement.pdf
 *
 * The sources live under docs/ (gitignored — they are local-only demo
 * assets, historically at docs/Lorem_ipsum.png and docs/867-Article…pdf).
 * The script fails fast with a clear message if they are missing.
 *
 * Run from the repo root (uses the service-role key, so buckets are created
 * if missing):
 *   node --env-file=.env scripts/seed-demo-assets.mjs
 *
 * Idempotent: upserts every object.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const DEMO_PROJECT_ID = "d3adbeef-0000-4000-8000-000000000001";
const IMAGE_COPIES = 4; // matches lorem-ipsum-{1..4}.png references in the seed

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
	console.error(
		"Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in env.",
	);
	process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey);

async function ensureBucket(name) {
	const { error } = await admin.storage.createBucket(name, { public: true });
	if (
		error &&
		!String(error.message).toLowerCase().includes("already exists")
	) {
		console.error(`Failed to ensure bucket "${name}":`, error.message);
		process.exit(1);
	}
}

async function uploadFile(bucket, path, bytes, contentType) {
	const { error } = await admin.storage.from(bucket).upload(path, bytes, {
		contentType,
		upsert: true,
	});
	if (error) {
		console.error(`Failed to upload ${bucket}/${path}:`, error.message);
		process.exit(1);
	}
	const { data } = admin.storage.from(bucket).getPublicUrl(path);
	console.log(`✓ ${data.publicUrl}`);
}

function readSourceFile(name) {
	// docs/ is the historical home of the demo assets (gitignored). Relative
	// to this script:  ../docs/<name>   (also accept repo-root <name>).
	const candidates = [
		new URL(`../docs/${name}`, import.meta.url),
		new URL(`../${name}`, import.meta.url),
	];
	for (const url of candidates) {
		try {
			return readFileSync(url);
		} catch {
			// try the next candidate
		}
	}
	console.error(
		`Missing demo asset "${name}". Expected it at docs/${name} (or the repo root).\n` +
			"Add the file back (it is gitignored) and re-run.",
	);
	process.exit(1);
}

const png = readSourceFile("Lorem_ipsum.png");
const pdf = readSourceFile("867-Article Text-2420-1-10-20240722.pdf");

await ensureBucket("images");
await ensureBucket("contracts");

for (let i = 1; i <= IMAGE_COPIES; i++) {
	await uploadFile("images", `demo/lorem-ipsum-${i}.png`, png, "image/png");
}
await uploadFile(
	"contracts",
	`${DEMO_PROJECT_ID}/primefoods-portal-agreement.pdf`,
	pdf,
	"application/pdf",
);

console.log(
	"Assets ready. Now apply the seed: npx prisma db execute --file scripts/seed-demo.sql",
);
