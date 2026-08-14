Here is your text formatted in clean, structured Markdown:

# Final Results

## The 20 Requested Repos

| Repo | Status | Sections | Source | Notes |
| :--- | :---: | ---: | :--- | :--- |
| `vercel/next.js` | ✅ | 4,515 | API | |
| `supabase/supabase` | ✅ | 4,245 | API | |
| `prisma/docs` | ✅ | 11,346 | API | ❌ 301 redirect → resolved as `prisma/web` (renamed) |
| `colinhacks/zod` | ✅ | 1,678 | API | |
| `tanstack/query` | ✅ | 2,698 | API | |
| `tanstack/form` | ✅ | 7,437 | API | |
| `tailwindlabs/tailwindcss` | ✅ | 1,876 | API | |
| `shadcn-ui/ui` | ✅ | 12,413 | API | |
| `radix-ui/primitives` | ✅ | 5,101 | API | |
| `lucide-icons/lucide` | ✅ | 5,603 | API | |
| `zsa-dev/next-safe-action` | ✅ | 546 | API | ❌ 404 → resolved as `next-safe-action/next-safe-action` (moved orgs) |
| `t3-oss/t3-env` | ✅ | 694 | API | |
| `47ng/nuqs` | ✅ | 1,954 | API | |
| `date-fns/date-fns` | ✅ | 3,609 | API | |
| `vitest-dev/vitest` | ✅ | 5,207 | API | |
| `testing-library/react-testing-library` | ✅ | 186 | local mirror | ⚠️ rate limit → bypassed (clone + `index_local`, your choice) |
| `microsoft/playwright` | ✅ | 11,673 | local mirror | ⚠️ rate limit → bypassed; sparse checkout of `` only |
| `webpro/knip` | ✅ | 10,203 | local mirror | ⚠️ rate limit → bypassed |
| `javierbrea/eslint-plugin-boundaries` | ✅ | 4,736 | local mirror | ⚠️ rate limit → bypassed |
| `christopherarter/superpowers-reasonix` | ✅ | 726 | local mirror | ⚠️ rate limit → bypassed |

---

## Approved Shortlist (all 10, local mirrors)

| Repo | Status | Sections | Notes |
| :--- | :---: | ---: | :--- |
| `base-ui/react` | ✅ | 4,419 | ❌ 404 → resolved as `mui/base-ui` (the actual repo) |
| `clauderic/dnd-kit` | ✅ | 2,850 | |
| `reactjs/react.dev` | ✅ | 4,000 | |
| `microsoft/TypeScript-Website` | ✅ | 6,598 | |
| `tailwindlabs/tailwindcss.com` | ✅ | 2,935 | |
| `supabase/supabase-js` | ✅ | 3,504 | |
| `feature-sliced-design/feature-sliced-design` | ✅ | 195 | ❌ 404 → resolved as `feature-sliced/skills` (the real FSD v2.1 skill repo `../AGENTS.md` sources from) |
| `nodemailer/nodemailer` | ✅ | 3,783 | |
| `eslint/eslint` | ✅ | 8,866 | |
| `catamphetamine/libphonenumber-js` | ✅ | 3,803 | |

---

## Failures Encountered and Resolutions
*(5 root causes, 0 left behind)*

1. **301 Redirect:** `prisma/docs` had been renamed → re-ran as `prisma/web` (retried immediately, succeeded).
2. **404 Not Found:** `zsa-dev/next-safe-action` moved orgs → re-ran as `next-safe-action/next-safe-action`.
3. **404 Not Found:** `base-ui/react` doesn't exist → resolved to `mui/base-ui` via API.
4. **404 Not Found:** FSD org name wrong → found `feature-sliced/skills` via search (exactly the repo your `../AGENTS.md` skill sources reference).
5. **GitHub API Rate Limit:** (Server egress exhausted, reset ~08:24 UTC, no token configured) — 5 repos blocked; per your choice, bypassed by shallow-cloning to `~/.cache/jdocmunch-mirrors` and indexing the local copies.

---

### Caveats
All 15 local indexes are shallow clones (`HEAD` only, no history), Playwright's is ``-only (sparse), and no embeddings/summaries were generated anywhere (no provider configured; `use_ai_summaries: false` honored on every call). 

The rate limit was the only genuine environmental failure — worth adding a `GITHUB_TOKEN` to the MCP server config before future large indexing batches.

---

# Update Run — 2026-08-14

## What changed

All 30 indexes refreshed to current upstream (previous run: 2026-08-11). Built in a **staged store**
(`~/.cache/doc-index` via `DOC_INDEX_PATH`) because the Reasonix sandbox mounts `/home` read-only;
apply with `~/.cache/jcm-update/apply.sh` on the host (full pipeline) or `apply.sh --staged` (rsync).

### Index refresh (30/30 succeeded)

| Repo | Sections (before → after) | Notes |
| :--- | ---: | :--- |
| `vercel/next.js` | 4,515 → 4,545 | new SHA |
| `supabase/supabase` | 4,245 → 4,310 | new SHA |
| `supabase/supabase-js` | 3,504 → 3,504 | new SHA |
| `colinhacks/zod` | 1,678 → 1,695 | new SHA |
| `tanstack/query` | 2,698 → 2,698 | |
| `tanstack/form` | 7,437 → 7,437 | |
| `tailwindlabs/tailwindcss` | 1,876 → 1,876 | new SHA |
| `tailwindlabs/tailwindcss.com` | 2,935 → 2,935 | new SHA |
| `shadcn-ui/ui` | 12,413 → 12,414 | new SHA |
| `radix-ui/primitives` | 5,101 → 5,101 | |
| `lucide-icons/lucide` | 5,603 → 5,603 | ⚠️ mid-fetch rate-limit pruned it to 1,567; repaired via full re-index |
| `t3-oss/t3-env` | 694 → 694 | |
| `47ng/nuqs` | 1,954 → 1,954 | new SHA |
| `date-fns/date-fns` | 3,609 → 3,609 | |
| `vitest-dev/vitest` | 5,207 → 5,219 | new SHA |
| `next-safe-action/next-safe-action` | 546 → 4,344 | same SHA — corpus grew 39 → 298 files (previous index was incomplete) |
| `testing-library/react-testing-library` | 186 → 186 | |
| `nodemailer/nodemailer` | 3,783 → 3,783 | new SHA |
| `catamphetamine/libphonenumber-js` | 3,803 → 3,803 | |
| `mui/base-ui` | 4,419 → 4,436 | new SHA |
| `clauderic/dnd-kit` | 2,850 → 2,850 | |
| `reactjs/react.dev` | 4,000 → 4,000 | new SHA |
| `microsoft/TypeScript-Website` | 6,598 → 6,598 | new SHA |
| `eslint/eslint` | 7,612 → 7,612 | new SHA |
| `javierbrea/eslint-plugin-boundaries` | 4,771 → 4,771 | |
| `webpro-nl/knip` | 3,758 → 3,756 | new SHA (org is `webpro-nl`, not `webpro`) |
| `christopherarter/superpowers-reasonix` | 726 → 726 | |
| `local/playwright` | 11,673 → 11,681 | mirror re-cloned to 2026-08-13 SHA |

### Handle renames (the "DeepSeek can't find prisma" fix)

Root cause: models guess repo names from training data (`prisma/docs`, `prisma/prisma`, `prisma`),
but bare-name resolution is a case-sensitive glob on `~/.doc-index/*/<name>.json`, and the index was
stored as `prisma/web` (repo renamed). Re-indexed with the `name` override so the *guessable* handle exists:

| Before (unguessable) | After (guessable) | Source repo |
| :--- | :--- | :--- |
| `prisma/web` | **`prisma/prisma`** (11,351 sections) | `prisma/web` |
| `feature-sliced/skills` | **`feature-sliced/feature-sliced-design`** (195 sections) | `feature-sliced/skills` |

Verified through the real server: `search_sections(repo:"prisma")` and `search_titles(repo:"feature-sliced-design")`
now resolve; `prisma/web` and `feature-sliced/skills` are deleted.

## Failures encountered

1. **Sandbox read-only `/home`** — `~/.doc-index` not writable from the sandbox (mount is rw for the
   host, ro inside the sandbox; `sudo` blocked by `no_new_privs`). → staged via `DOC_INDEX_PATH`,
   apply on host.
2. **GitHub token quota exhausted** (hourly window, shared with the desktop app) — hit mid-batch.
   ⚠️ A mid-fetch 403 makes failed file fetches look "deleted", pruning sections (lucide: 5,603 → 1,567).
   → stop on rate-limit error; repair with full re-index (`incremental: false`). Quota resets hourly.

## Tooling left in place

- `~/.cache/jcm-update/` — venv + driver + `update_batch.sh`, `rename.sh`, `apply.sh` (+ `--staged`).
- Staged store: `~/.cache/doc-index/` (30 repos, fully verified — `doc_list_repos` count=30).
- JDocMunch usage rules documented in `../REASONIX.md` (call `doc_list_repos`, don't guess handles).
