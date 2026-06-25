# HANDOFF.md — The Spec-Driven Development Loop

This is the authoritative guide to how the process works end-to-end. Read this before running any skill.

---

## Overview

Spec-driven development means: **no code before a reviewed spec**. Every Linear issue becomes a three-file spec (`requirements.md`, `design.md`, `tasks.md`) that gets adversarially reviewed by a principal-engineer agent before anyone (human or Claude) writes a single line of product code.

The result: PRs are small and focused, reviews are fast, and integration bugs surface at the spec stage — not during code review or QA.

---

## The full loop

### Step 0 — `/setup` (once per project)

Run `/setup` the first time you start a project. It runs an interactive wizard that collects:

- **Linear project** — URL or ID. The skill fetches all milestones and issues to confirm it's the right project.
- **Target repo** — the absolute path to the product repo (e.g. `~/Documents/Homebase1`). The skill auto-detects the tech stack.
- **Figma files** — one or more URLs with labels. Optional but strongly recommended.
- **Reference materials** — meeting recordings, transcripts, Slack threads, PRDs, prototypes. Each stored with a type and label.

Output: `specs/<project-slug>/project.config.md` (machine-readable config for all downstream skills) and a scaffolded `project-spec.md`.

> **Rule:** All downstream skills read `project.config.md` for the target repo path, Linear IDs, and reference URLs. Never hardcode paths in skills.

---

### Step 1 — `/spec-author` (per milestone or issue)

Run `/spec-author` to generate issue-level specs. The skill:

1. Reads `project.config.md` for the Linear project ID
2. Fetches all milestones and their issues from Linear
3. Asks which milestones (and which issues within them) to generate specs for
4. For each selected issue: fetches the full Linear issue, reads the target repo to ground claims in real `file:line` references, then authors all three spec files from the templates

The three spec files per issue:
- **`requirements.md`** — user stories, EARS-style ACs grouped by subsystem, explicit edge cases (≥3 required), non-goals stated as testable constraints
- **`design.md`** — component map with resolved tiers (MCP/experimental/custom), file plan (flagged if >10 files), state/data design, routing, feature flag, eventing, i18n keys
- **`tasks.md`** — ordered build steps with real file paths, test coverage targets (happy path + every error state), self-review checklist

> **Rule:** Every claim in `requirements.md` and `design.md` must cite a real `file:line` in the target repo. Unverified claims are blocked by `spec-audit`.

---

### Step 3 — `/spec-audit` (per issue, before building)

Run `/spec-audit` to adversarially review every spec. Never build an unreviewed spec.

The skill runs a **review → revise → repeat** loop (up to 3 rounds) per issue:

**Reviewer agent** (principal-engineer persona, high effort):
- Reads all three spec files
- Verifies every `file:line` citation against the real target repo
- Checks Designbase MCP for every component claim
- Returns a structured verdict: `{ approved, summary, blockingFindings, nonBlockingNotes }`

**Blocking finding categories:**
| Category | Description |
|----------|-------------|
| `grounding` | `file:line` doesn't exist or doesn't match the claim |
| `size` | File plan has >10 files — must split the issue |
| `scope-creep` | Tasks touch files not in the file plan |
| `logic-change` | Unintended behavior change not explicit in ACs |
| `missing-ac` | An AC in requirements isn't covered in tasks |
| `build-readiness` | A task step isn't executable as written |
| `design-system` | Deprecated component or invented API |
| `edge-cases` | Fewer than 3 edge cases in requirements |
| `test-coverage` | Happy path or error states missing from test targets |

**Reviser agent** applies fixes to the spec files. Reviewer re-reviews. Repeat up to 3 rounds. If still blocked after 3 rounds, the skill surfaces all remaining findings for the engineer to resolve manually.

> **Rule:** `spec-builder` checks for `approved: true` in the spec frontmatter before building. It will warn and ask for confirmation if a spec is not approved.

---

### Step 4 — `/spec-builder <slug>` (one issue at a time)

Run `/spec-builder 01-my-issue-slug` to build one approved issue.

The skill:

1. **Loads** `project.config.md` + all three spec files. Confirms `approved: true`.
2. **Builds** — follows `tasks.md` step by step. Puts new components under the directory the spec names. Does NOT invent scope.
3. **Verifies:**
   - `tsc --noEmit` on changed files
   - `jest` for new tests + any existing suites that could regress
   - `eslint` / `stylelint` on changed files
   - For any submit or persist surface: **runs the app** and does a real unmocked submit
   - **Test completeness gate:** every new source file (component, hook, controller, service) must have a corresponding test file — stops here if any are missing
3.5. **Visual QA** (FE changes only):
   - Reads "States to Cover" table from `requirements.md`
   - Starts dev server if not running, navigates to the affected route
   - Screenshots each state (loading, empty, populated, error, success, etc.) — manual prompt for states that need interaction
   - Saves to `specs/<slug>/issues/<slug>/qa/screenshots/`
   - Engineer compares against Figma; discrepancies are noted and carried forward
4. **Self-review against spec** + **spec sync:**
   - Checks all ACs covered, no scope creep, file count ≤ 10
   - Updates spec files to reflect what was actually built: checks off `tasks.md` steps, corrects file paths in `design.md` file plan, updates component map if a different component was used
   - Does NOT change ACs, non-goals, or user stories — only implementation details
5. **Code review:**
   - `client/` files changed → runs `/fe-review`
   - `app/`, `packs/`, `config/`, `spec/` files changed → runs `/be-review`
   - Presents findings to engineer. Waits for approval. Does not auto-fix.
6. **Commit checkpoint** — shows what was built, asks "Ready to commit?"
   - `git add <specific files>` (never `-A`)
   - `hops linear --edit=false` (creates commit from matching Linear issue)
   - `git commit --amend --no-edit --trailer "Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"`
7. **Push checkpoint** — shows `git diff --stat origin/main..HEAD`, asks "Ready to push and open a draft PR?"
   - `git push -u origin HEAD`
   - `gh pr create --draft` with spec link, review findings summary, test plan checklist, and a Visual evidence table (FE only)
   - If FE changes: uploads screenshots via GitHub asset API and posts them as a PR comment
8. **PR review** — immediately runs `/review-pr <PR_NUMBER> --auto-comment` which posts all findings inline + summary to the draft PR automatically

> **Rule:** 1 issue = 1 PR, always. Never stage with `git add -A`. Never push without engineer approval.

---

### Step 5 — Engineer reviews the draft PR

The draft PR already has:
- Inline comments on specific lines (from `/review-pr --auto-comment`)
- A summary body with findings that didn't map to specific lines
- The test plan checklist from `spec-builder`

The engineer:
1. Opens the draft PR on GitHub
2. Reads the inline comments and summary
3. Addresses the findings they agree with
4. Marks the PR as "Ready for review" when done

---

### Step 6 — Team review → merge

Standard team code review on the (now non-draft) PR. By this point:
- The spec was adversarially reviewed before any code was written
- The code was automatically reviewed by `be-review` + `fe-review`
- The PR was auto-commented by `review-pr`
- The engineer has already addressed the findings they agree with

Team review should focus on: product judgment, domain expertise, and anything the automated review missed.

---

## Issue sizing

> **The single most important structural decision in this process.**

A well-sized issue:
- Touches ≤ 10 files
- Has a single clear concern
- Is buildable in isolation (no implicit dependency on sibling issues' unreleased code)
- Produces a PR that can be reviewed in under 30 minutes

**When to split:**

| Too large (one issue) | Better (split into) |
|----------------------|---------------------|
| DB migration + model + controller + FE | 3 issues: BE model+migration / API layer / FE |
| New page + all its cards | 1 issue per card + 1 route shell issue |
| Feature + i18n QA pass | 2 issues: feature / i18n |
| Multiple unrelated bug fixes | One issue per bug |

`spec-audit` enforces the >10 file limit as a blocking finding. If you see this, split the issue before continuing.

---

## Lessons learned

> Accumulated from the HRM packet-config experiment.

**On testing:**
- Mocked, self-fixtured tests give false confidence. A test that builds its own expected value from the same code it's testing will pass even when the code is wrong. Test against real validation and real API shapes.
- For form surfaces: always test with empty initial values. Empty strings + required fields can cause silent Formik blocks that only appear at runtime.
- Integration bugs hide until merge. A testid that's unique in isolation can collide when sibling cards mount on the same page. Run the full combined suite after merging related issues.

**On scope:**
- A build agent once invented a new out-of-scope issue and started implementing it. Rule added: **report gaps, never implement them.** If you discover missing behavior, surface it as a recommendation in your output.
- "No-logic-change" gate is critical for ports and migrations. Any change to validation schemas, required fields, or submit payloads must be explicit and deliberate — not accidental scope creep.

**On components:**
- Carry context explicitly across page boundaries. A component that works in isolation may have implicit dependencies (Redux state shape, parent context, feature flag state) that only surface when mounted in the real page.
- Resolve components, never invent them. An invented component API that looks right will fail when the real component has different prop names or different required props.

---

## PR strategy

- **Branch naming:** `{initials}/{ticket-id}-{slug}` (e.g. `fb/HRM-1234-child-page-route-shell`)
- **Commit message:** via `hops linear --edit=false` — fetches the matching Linear issue and uses it as the commit message
- **Co-authoring:** always amend with `--trailer "Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"`
- **PR title:** `<issue-slug>: <Linear issue title>`
- **PR state:** always open as draft — let `/review-pr --auto-comment` post findings before marking ready
- **PR size:** if your PR touches >10 files, something went wrong at the spec stage — stop and investigate

---

## Skill invocation reference

```
/setup                           → onboard a new project
/spec-author                     → generate specs for selected milestones/issues
/spec-audit                   → review all unapproved specs
/spec-audit 01-my-slug        → review one specific issue
/spec-builder 01-my-slug         → build one approved issue
/be-review                       → backend code review (standalone)
/fe-review                       → frontend code review (standalone)
/review-pr 123                   → interactive PR review
/review-pr 123 --auto-comment    → post all findings to PR automatically
/review-pr 123 --dry-run         → print full review without posting
/component-resolver              → resolve a UI element to its Designbase component
```
