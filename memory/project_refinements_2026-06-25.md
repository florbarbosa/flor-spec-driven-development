---
name: spec-builder-refinements-2026-06-25
description: Spec-builder improvements made on 2026-06-25 — visual QA step, test completeness gate, spec sync, screenshot PR comments
metadata:
  type: project
---

Added three new behaviours to `/spec-builder` on 2026-06-25:

**Step 3 — test completeness gate:** After verify, every new source file (component, hook, controller, service, job) must have a corresponding test file. FE: `*.tsx`/`use*.ts` → `*.test.tsx`/`*.test.ts`. BE: controller/service/job/model → `*_spec.rb`. Build stops if missing.

**Step 3.5 — Visual QA (FE only):** Screenshots every state listed in `requirements.md` States to Cover table. Starts dev server if needed, tries Playwright first then `screencapture`. Manual prompt for states requiring interaction. Engineer compares against Figma. Discrepancies stored in `QA_DISCREPANCIES`. Screenshots saved to `specs/<slug>/issues/<slug>/qa/screenshots/`.

**Step 4 — spec sync:** After build, syncs spec files to reality. Checks off `tasks.md` steps, corrects file paths in `design.md` file plan, updates component map. Does NOT change ACs, non-goals, or user stories.

**Step 7 — screenshots on PR (FE only):** PR body gets a Visual evidence table (surface/state/status). Screenshots uploaded to GitHub via asset upload API (`https://uploads.github.com/repos/.../issues/.../assets`) and posted as a follow-up PR comment. Falls back to local paths if upload fails.

**Why:** No visual QA existed — correctness was verified but appearance wasn't. Test gate closed a gap where new files could be committed without tests. Spec sync keeps specs accurate after build.

**How to apply:** When discussing spec-builder runs, know these steps now exist. If a user reports spec-builder skipping visual QA, it means no `client/` files changed (correct). If upload fails, screenshots are still in the spec repo.
