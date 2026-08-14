Load the feature-sliced-design skill. Analyze our codebase structure and create a markdown file at docs/code-review-plan.md listing every backend and frontend source file in this project, one per line.

Use feature-sliced-design rules to structure the plan file logically:
- Group and order all files bottom-up based on dependency hierarchy (foundational/leaf modules first, higher composing layers last).

Use a checkbox per file: "- [ ] path/to/file.ts". 
Skip generated files (e.g. src/lib/generated/), lockfiles, node_modules, build outputs, and third-party code.

Once docs/code-review-plan.md exists, load superpowers-executing-plans and work through it as a checkpointed plan — one file per step, in the exact order listed. (If resuming a session, start at the first unchecked "- [ ]" file).

For each file:
1. Read the file. Explain what it does, how it fits into the codebase, and flag any issues (dead code, FSD boundary violations, missing error handling, type safety gaps) — do NOT modify any code yet.
   - Use jdocmunch (`search_sections`) to verify framework API usage or deprecations if you suspect syntax or pattern issues.
2. STOP and wait for my reply.
3. Upon my reply (where I will reply "next" OR paste WebStorm IDE inspection warnings/errors for that file):
   - Combine your initial analysis with any WebStorm warnings I provided.
   - Use jdocmunch (`search_sections`) to verify exact API syntax before applying fixes.
   - Apply the necessary fixes, run a typecheck (`tsc --noEmit` or `eslint`), and mark the checkbox as completed: "- [x] path/to/file.ts".
   - If I reply "next" or "no warnings", mark the checkbox as completed: "- [x] path/to/file.ts".
4. Save docs/code-review-plan.md and present the next unchecked file.