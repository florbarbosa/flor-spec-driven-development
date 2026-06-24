# AGENTS.md — flor-spec-driven-development

Operating rules for every agent working in this repo. This repo holds **process and specs only** — no product code. Product code lives in the target repo named by each spec's `project.config.md`.

---

## What this repo is

| Path | Purpose |
|------|---------|
| `docs/HANDOFF.md` | Full end-to-end loop documentation. Read before doing anything. |
| `templates/` | Seed templates for `project.config.md`, `project-spec.md`, and `issue/`. |
| `conventions/` | Homebase FE and BE coding standards. Referenced by review skills and spec-audit. |
| `specs/<project>/` | Authored specs per project. Committed. Each project has a `project.config.md`. |
| `.claude/skills/` | All eight skills. Repo-scoped — available in any session with this repo as CWD. |
| `.claude/workflows/spec-review-loop.js` | The adversarial review/revise loop (dynamic workflow). |

---

## Before you act

1. **Read `specs/<project>/project.config.md`** — it names the target repo path, tech stack, Linear project ID, Figma URLs, and all reference materials.
2. **Read the target repo's `AGENTS.md` / `CLAUDE.md` / `.kiro/steering/*`** before touching any product code. This repo never restates those conventions — it points at them.
3. **Identify which issue you're working on** — confirm the branch matches the pattern `{initials}/{ticket-id}-{slug}`.

---

## The loop

```
/setup  →  Recon  →  /spec-author  →  /spec-audit  →  /spec-builder  →  PR  →  Merge
```

| Step | Skill | Who drives |
|------|-------|-----------|
| 0. Onboarding | `/setup` | Run once per project — collects all resources, writes `project.config.md` |
| 1. Spec authoring | `/spec-author` | Reads Linear milestones, asks which to generate, grounds specs in real target-repo code |
| 2. Spec review | `/spec-audit` | Adversarial loop — every anchor verified against real code |
| 3. Build | `/spec-builder` | One issue, one PR. Verify → code review → commit → push → draft PR |
| 4. PR review | `/review-pr --auto-comment` | Auto-posts findings inline + summary to the draft PR |
| 5. Ship | (team) | Engineer addresses findings, marks ready for review, team merges |

---

## Skill index

| Skill | Invocation | Description |
|-------|-----------|-------------|
| `setup` | `/setup` | Interactive onboarding wizard. Collects Linear project, Figma, recordings, Slack, target repo. |
| `spec-author` | `/spec-author` | Reads Linear project milestones. Asks which issues to spec. Authors `requirements.md` + `design.md` + `tasks.md`. |
| `spec-audit` | `/spec-audit [slug]` | Principal-engineer reviewer in a loop. Verifies every claim. Blocks `>10 files`. Approves or returns blocking findings. |
| `spec-builder` | `/spec-builder <slug>` | Builds one approved issue. Verify → `/be-review` + `/fe-review` → checkpoint → commit via `hops linear` → checkpoint → push + draft PR → `/review-pr --auto-comment`. |
| `be-review` | `/be-review` | Ruby/Rails code quality, security, DB safety, Packwerk compliance, data modelling. |
| `fe-review` | `/fe-review` | TypeScript/React quality, Designbase compliance, i18n, UX tracking, accessibility. |
| `review-pr` | `/review-pr <num> [--auto-comment]` | Reviews the PR diff across FE+BE. `--auto-comment` posts all findings automatically. |
| `component-resolver` | `/component-resolver` | Resolves a UI element to the exact `fe-design-base` component and confirmed props. |

---

## Hard rules

> Every agent working in this repo must follow these without exception.

**Scope**
- Never commit product code to this repo
- Never commit this repo's specs into the target product repo
- Build strictly to the spec — report scope gaps, never implement them

**Issue size**
- 1 issue = 1 PR, always — no milestone-sized PRs, no "while I was in there" additions
- If a spec's `design.md` file plan lists >10 files → `spec-audit` must block it until split

**Conventions**
- Homebase conventions always apply regardless of project — Designbase, Packwerk, `hops linear`, `toI18n()`
- Never invent component APIs — resolve via `/component-resolver` (Designbase MCP first)
- Every spec claim must cite a real `file:line` in the target repo

**Engineer control**
- Never push without explicit engineer approval — Claude commits, engineer decides when to push
- Show a summary and ask "Ready?" at both the commit and push checkpoints
- Amend every commit with `--trailer "Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"`

---

## Spec format reference

**Project level:** `specs/<project>/project-spec.md`
- Mission, scope, target repo, issue breakdown table, cross-cutting requirements, QA rubric

**Issue level:** `specs/<project>/<milestone>/issues/<slug>/`
- `requirements.md` — user stories, ACs (EARS-style), edge cases, non-goals
- `design.md` — component map (Tier: MCP/experimental/custom), file plan, state/data, routing
- `tasks.md` — ordered build steps, test coverage targets, self-review checklist, definition of done

A spec is **approved** when `spec-audit` adds `approved: true` to the frontmatter of all three files.
