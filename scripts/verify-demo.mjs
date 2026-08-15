/**
 * Demo-seed verifier — prints a summary of the seeded demo data and checks
 * the invariants the demo relies on (3 projects, dense PrimeFoods project,
 * executed contract, approved gate, client-visible variables, assignments).
 *
 * Run from the repo root:
 *   node --env-file=.env scripts/verify-demo.mjs
 */
import "dotenv/config";
import pg from "pg";

const pool = new pg.Pool({
	connectionString: process.env.DIRECT_URL,
	ssl: { rejectUnauthorized: false },
});

const P1 = "d3adbeef-0000-4000-8000-000000000001";
const P2 = "d3adbeef-0000-4000-8000-000000000201";
const P3 = "d3adbeef-0000-4000-8000-000000000301";

async function one(sql, params) {
	const { rows } = await pool.query(sql, params);
	return rows[0];
}

const summary = {
	"Projects (demo)": await one(`SELECT count(*)::int AS n FROM "Projects" WHERE project_id = $1`, [P1]),
	"Projects (small)": await one(`SELECT count(*)::int AS n FROM "Projects" WHERE project_id IN ($1,$2)`, [P2, P3]),
	"Projects (COMPLETED, seed-2)": await one(`SELECT count(*)::int AS n FROM "Projects" WHERE project_id IN ('d3adbeef-0000-4000-8000-000000000401','d3adbeef-0000-4000-8000-000000000501') AND status = 'COMPLETED'`),
	"Stages": await one(`SELECT count(*)::int AS n FROM "Stages" WHERE project_id = $1`, [P1]),
	"Gates (P1, 1 APPROVED)": await one(`SELECT count(*)::int AS n FROM "Gates" g JOIN "Stages" s ON s.stage_id = g.stage_id WHERE s.project_id = $1 AND g.status = 'APPROVED'`, [P1]),
	"Phases": await one(`SELECT count(*)::int AS n FROM "Phases" p JOIN "Stages" s ON s.stage_id = p.stage_id WHERE s.project_id = $1`, [P1]),
	"Modules": await one(`SELECT count(*)::int AS n FROM "Modules" m JOIN "Phases" p ON p.phase_id = m.phase_id JOIN "Stages" s ON s.stage_id = p.stage_id WHERE s.project_id = $1`, [P1]),
	"Workflows": await one(`SELECT count(*)::int AS n FROM "Workflows" w JOIN "Modules" m ON m.module_id = w.module_id JOIN "Phases" p ON p.phase_id = m.phase_id JOIN "Stages" s ON s.stage_id = p.stage_id WHERE s.project_id = $1`, [P1]),
	"Tickets (demo project)": await one(`SELECT count(*)::int AS n FROM "Tickets" t JOIN "Workflows" w ON w.workflow_id = t.workflow_id JOIN "Modules" m ON m.module_id = w.module_id JOIN "Phases" p ON p.phase_id = m.phase_id JOIN "Stages" s ON s.stage_id = p.stage_id WHERE s.project_id = $1`, [P1]),
	"Tickets (small projects)": await one(`SELECT count(*)::int AS n FROM "Tickets" t JOIN "Workflows" w ON w.workflow_id = t.workflow_id JOIN "Modules" m ON m.module_id = w.module_id JOIN "Phases" p ON p.phase_id = m.phase_id JOIN "Stages" s ON s.stage_id = p.stage_id WHERE s.project_id IN ($1,$2)`, [P2, P3]),
	"Subtasks (parent_id set)": await one(`SELECT count(*)::int AS n FROM "Tickets" WHERE parent_id IS NOT NULL`),
	"History events": await one(`SELECT count(*)::int AS n FROM "HistoryEvent" WHERE history_event_id::text LIKE 'd3adbeef-%'`),
	"Ticket assignments": await one(`SELECT count(*)::int AS n FROM "TicketAssigned" WHERE ticket_id::text LIKE 'd3adbeef-%'`),
	"Ticket tags": await one(`SELECT count(*)::int AS n FROM "TicketTags" WHERE ticket_id::text LIKE 'd3adbeef-%'`),
	"Comments": await one(`SELECT count(*)::int AS n FROM "Comments" WHERE comment_id::text LIKE 'd3adbeef-%'`),
	"Images": await one(`SELECT count(*)::int AS n FROM "Images" WHERE image_id::text LIKE 'd3adbeef-%'`),
	"Issues": await one(`SELECT count(*)::int AS n FROM "Issues" WHERE issue_id::text LIKE 'd3adbeef-%'`),
	"Variables (demo project)": await one(`SELECT count(*)::int AS n FROM "Variables" WHERE project_id = $1`, [P1]),
	"Variables (client-visible)": await one(`SELECT count(*)::int AS n FROM "Variables" WHERE project_id = $1 AND client_visible`, [P1]),
	"Contract executed": await one(`SELECT count(*)::int AS n FROM "Contracts" WHERE project_id = $1 AND client_signed_at IS NOT NULL AND project_owner_signed_at IS NOT NULL`, [P1]),
	"RoleAssignments (JP)": await one(`SELECT count(*)::int AS n FROM "RoleAssignments" WHERE user_id = '5f029f34-81df-4d95-9d9b-89e7f511778d' AND project_id = $1`, [P1]),
	"RoleAssignments (Angela)": await one(`SELECT count(*)::int AS n FROM "RoleAssignments" WHERE user_id = '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2' AND project_id = $1`, [P1]),
	// ── Seed-2 checks ────────────────────────────────────────────────────────
	"Velocity JP (this week)": await one(`SELECT count(*)::int AS n FROM "TicketAssigned" ta JOIN "Tickets" t ON t.ticket_id = ta.ticket_id WHERE ta.profile_id = '5f029f34-81df-4d95-9d9b-89e7f511778d' AND t.status = 'FINISHED' AND t.actual_end_at >= '2026-08-10T00:00:00Z' AND t.actual_end_at < '2026-08-17T00:00:00Z'`),
	"Velocity JP (last week)": await one(`SELECT count(*)::int AS n FROM "TicketAssigned" ta JOIN "Tickets" t ON t.ticket_id = ta.ticket_id WHERE ta.profile_id = '5f029f34-81df-4d95-9d9b-89e7f511778d' AND t.status = 'FINISHED' AND t.actual_end_at >= '2026-08-03T00:00:00Z' AND t.actual_end_at < '2026-08-10T00:00:00Z'`),
	"Velocity Angela (this week)": await one(`SELECT count(*)::int AS n FROM "TicketAssigned" ta JOIN "Tickets" t ON t.ticket_id = ta.ticket_id WHERE ta.profile_id = '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2' AND t.status = 'FINISHED' AND t.actual_end_at >= '2026-08-10T00:00:00Z' AND t.actual_end_at < '2026-08-17T00:00:00Z'`),
	"Velocity Angela (last week)": await one(`SELECT count(*)::int AS n FROM "TicketAssigned" ta JOIN "Tickets" t ON t.ticket_id = ta.ticket_id WHERE ta.profile_id = '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2' AND t.status = 'FINISHED' AND t.actual_end_at >= '2026-08-03T00:00:00Z' AND t.actual_end_at < '2026-08-10T00:00:00Z'`),
	"Completed projects visible to JP": await one(`SELECT count(*)::int AS n FROM "RoleAssignments" ra JOIN "Projects" p ON p.project_id = ra.project_id WHERE ra.user_id = '5f029f34-81df-4d95-9d9b-89e7f511778d' AND p.status = 'COMPLETED'`),
	"Completed projects visible to Angela": await one(`SELECT count(*)::int AS n FROM "RoleAssignments" ra JOIN "Projects" p ON p.project_id = ra.project_id WHERE ra.user_id = '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2' AND p.status = 'COMPLETED'`),
	"PrimeFoods stages (stepper)": await one(`SELECT count(*)::int AS n FROM "Stages" WHERE project_id = $1 AND is_deleted = false`, [P1]),
	"Angela overdue ticket (t245)": await one(`SELECT count(*)::int AS n FROM "TicketAssigned" ta JOIN "Tickets" t ON t.ticket_id = ta.ticket_id WHERE ta.profile_id = '1b244a5a-0738-4a7e-a4b8-61b0f8bbafe2' AND t.status <> 'FINISHED' AND t.plan_end_at < '2026-08-15T00:00:00Z'`),
};

for (const [label, row] of Object.entries(summary)) {
	console.log(`${label}: ${row.n}`);
}

await pool.end();
