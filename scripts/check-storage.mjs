/**
 * Storage diagnostic — checks whether the contracts/images buckets are
 * public and whether objects exist under the expected paths.
 * Run: node --env-file=.env scripts/check-storage.mjs
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
	console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
	process.exit(1);
}
const admin = createClient(supabaseUrl, serviceRoleKey);

const { data: buckets, error: bucketError } = await admin.storage.listBuckets();
if (bucketError) {
	console.error("listBuckets failed:", bucketError.message);
	process.exit(1);
}
for (const b of buckets ?? []) {
	console.log(`bucket: ${b.name}  public=${b.public}`);
}

const demoContractPath =
	"d3adbeef-0000-4000-8000-000000000001/primefoods-portal-agreement.pdf";
const { data: contractObjects, error: listError } = await admin.storage
	.from("contracts")
	.list("", { limit: 50 });
console.log(
	"contracts bucket objects:",
	listError?.message ??
		contractObjects?.map((o) => o.name).join(", ") ??
		"(none)",
);

const { data: existing } = await admin.storage
	.from("contracts")
	.info(demoContractPath);
console.log("demo contract object exists:", existing ? "YES" : "NO");
if (existing) {
	const { data: pub } = admin.storage
		.from("contracts")
		.getPublicUrl(demoContractPath);
	console.log("public URL:", pub.publicUrl);
	const probe = await fetch(pub.publicUrl, { method: "HEAD" });
	console.log("public URL HEAD status:", probe.status);
}
