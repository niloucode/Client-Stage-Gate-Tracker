Use the jdocmunch-mcp `index_repo` tool to index each of the following GitHub repositories (pass parameter `url: "owner/repo"`). For every call, pass `use_ai_summaries: false` explicitly — do not use AI summaries even if a key is configured. If a call fails (e.g. rate limit), note it and continue to the next one rather than stopping.

Repos to index:
- vercel/next.js
- supabase/supabase
- prisma/docs
- colinhacks/zod
- tanstack/query
- tanstack/form
- tailwindlabs/tailwindcss
- shadcn-ui/ui
- radix-ui/primitives
- lucide-icons/lucide
- zsa-dev/next-safe-action
- t3-oss/t3-env
- 47ng/nuqs
- date-fns/date-fns
- vitest-dev/vitest
- testing-library/react-testing-library
- microsoft/playwright
- webpro/knip
- javierbrea/eslint-plugin-boundaries
- christopherarter/superpowers-reasonix

After that batch finishes, look at this project's actual dependencies (package.json, lockfile, or equivalent) and at what the loaded skills imply about how it's built (feature-sliced-design, the superpowers-* workflow disciplines) to figure out what other documentation would genuinely earn a spot — things this project actually depends on or follows conventions from, that aren't already covered above. Don't pad the list for the sake of it; each suggestion needs a real, specific reason tied to what's actually in use here.

Show me that shortlist with one line of reasoning per repo before indexing any of it — I'll tell you which ones to go ahead with.

When everything's done, give me a table of what indexed successfully vs. what failed and why.