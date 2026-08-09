# Project Guidance

<!-- intent-skills:start -->
## Skill Loading

Before editing files for a substantial task:
- Run `npx @tanstack/intent@latest list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `npx @tanstack/intent@latest load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

## Reasonix & Superpowers Skills — STOP. Load a skill before you act.

This project ships skills under `skills/` and global skill sources (including `feature-sliced-design`). They only work if you load them.

**The rule:** before you do ANYTHING non-trivial — before you `explore`, run `bash`, write code, or answer — STOP and check the skills index. If a skill might fit, load it. Process skill FIRST. Action SECOND.

Match the situation:

| If… | Load this FIRST |
|---|---|
| starting a feature, or you have a rough idea | **superpowers-brainstorming** |
| organizing project structure, deciding component/action placement, layer boundaries (`app`/`features`/`entities`/`shared`), or resolving cross-imports | **feature-sliced-design** |
| a bug, a failing or flaky test, or anything surprising | **superpowers-systematic-debugging** |
| writing or fixing any code | **superpowers-test-driven-development** |
| you have a spec for a multi-step task | **superpowers-writing-plans** |
| executing a written plan in this session | **superpowers-executing-plans** |
| about to say "done" / "fixed" / "passing" | **superpowers-verification-before-completion** |
| work is done and tests pass | **superpowers-finishing-a-development-branch** |
| you got code-review feedback (from `review` or a human) | **superpowers-receiving-code-review** |
| need an isolated workspace | **superpowers-using-git-worktrees** |
| making or editing a skill | **superpowers-writing-skills** |

Load it: `run_skill({ name: "<skill-name>", arguments: "<the task>" })`.

### Feature-Sliced Design (FSD) v2.1 Rule Set
Whenever creating, moving, or refactoring files, strictly enforce FSD rules:
1. **Layer Hierarchy:** Imports can only move downwards: `app` → `features` → `entities` → `shared`.
2. **Entity Isolation:** Entities cannot import from other entities directly. Move shared types/actions to `src/entities/types.ts` or `src/shared/`.
3. **UI Placement:** Reusable UI primitives (buttons, modals, toasts, inputs) belong in `src/shared/ui/` (Shadcn components). Business UI belongs in `src/features/<feature>/ui/`.

These skills **supplement** Reasonix's native tools: use **`task`** (run a subagent), **`review`** (code-review a diff), **`wait`** (join parallel jobs), **`explore`** (investigate the codebase).

## Red Flags — Stop and load a skill if you think:
* "Just a simple question/task"
* "Let me explore/look first"
* "I'll just do this one thing first"
* "This skill is overkill"

## Priority
1. User explicit instructions (`planned-codebase-changes.md`, direct asks) win over everything.
2. Skills override default behavior where they conflict.
3. A user request says WHAT to do, never "skip the skill."