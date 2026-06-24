---
name: spec-author
description: Milestone-aware spec generation from Linear. Reads project.config.md, fetches milestones and issues, asks which to generate specs for, then authors requirements.md + design.md + tasks.md per issue grounded in real target-repo file:line citations.
argument-hint: "[optional: project slug or milestone name]"
allowed-tools: Read, Glob, Grep, Write, Edit, Bash, Agent, mcp__linear__get_issue, mcp__linear__list_issues, mcp__linear__list_milestones, mcp__designbase-storybook__list-all-documentation, mcp__designbase-storybook__get-documentation
---

# /spec-author

Generates issue-level specs from Linear issues, grounded in real target-repo code. Never invents — every claim cites a `file:line`.

---

## Steps

### Step 0: Load project config

Scan `specs/` for project directories (those containing `project.config.md`). If multiple exist, list them and ask which project to work on. If only one, use it automatically.

Read `specs/<slug>/project.config.md`. Extract:
- `linear_project_id`
- `target_repo` (absolute path — verify it exists via `ls`)
- `figma_urls`
- Reference materials list
- Existing milestones

### Step 1: Fetch milestones from Linear

Fetch all milestones via `mcp__linear__list_milestones` for the project. Display:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Milestones in <Project Name>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  1. <Milestone name> — N issues
  2. <Milestone name> — N issues
  ...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Ask (AskUserQuestion, multiSelect): "Which milestones do you want to generate specs for?"
Options: each milestone by name + "All milestones"

### Step 2: Select issues within each milestone

For each selected milestone, fetch issues via `mcp__linear__list_issues`. Display:

```
<Milestone name> — issues:
  1. HRM-XXXX: <title>  [<estimate>]  [<status>]
  2. HRM-XXXX: <title>  [<estimate>]  [<status>]
  ...
```

Ask (AskUserQuestion, multiSelect): "Which issues to generate specs for? (default: all)"

Store selected issues grouped by milestone.

### Step 3: Check for existing Linear issues

For each selected milestone, call `mcp__linear__list_issues` filtered to that milestone. If issues are found, proceed to Step 4 using those issues.

**If no issues are found:**

Show the milestone ACs from the project description and propose a breakdown into issues following the ≤10 files per issue rule. Display a suggested issue table: #, slug, scope, estimated file count.

Ask (AskUserQuestion):
- **Use suggested breakdown** *(Recommended)* — generate specs from the proposed list; no Linear issues created
- **Create issues in Linear first** — create the proposed issues in Linear under this milestone via `mcp__linear__save_issue`, then generate specs from them
- **Adjust the breakdown first** — let the engineer tweak the list before proceeding
- **Stop here** — don't generate any specs yet

If **Create issues in Linear first**: before creating anything, display a confirmation summary sourced from `project.config.md` and the Linear project data:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Issues will be created under:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Project:   <linear_project name>
             <linear_project_url>
  Team:      <team name>
  Milestone: <milestone name>
             <milestone Linear URL>
  Issues:    N to create
    1. <title>
    2. <title>
    ...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Ask: "Confirm creating these N issues in Linear? (yes / no)"

Only on explicit confirmation: call `mcp__linear__save_issue` for each proposed issue with `team`, `project`, `milestone`, `title`, and a brief `description`. Show the created issue IDs. Then proceed to Step 4 using those issues.

If **Use suggested breakdown**: proceed to Step 4 using the proposed issue list directly (no Linear issues created).

### Step 4: Author specs

For each selected issue, author the three spec files. Run up to 3 issues concurrently using `Agent` (subagent_type: general-purpose).

**Per-issue authoring procedure:**

**4a. Fetch the full Linear issue**
Use `mcp__linear__get_issue` with the issue ID. Extract: title, description, acceptance criteria, labels, estimate, milestone.

**4b. Read reference materials**
From `project.config.md`, note the available Figma URLs, recordings, transcripts. These are the sources of truth for UX decisions. Mention which ones are available; do not fetch remote URLs at this stage (summarize what the engineer should reference).

**4c. Ground in the target repo**
This is the most important step. Read the target repo to understand the existing code in the area this issue affects:
- Grep for relevant component names, route paths, slice names, pack names mentioned in the Linear issue
- Read the files found — understand current behavior, file structure, prop shapes, validation logic
- Note specific `file:line` citations for every claim you'll make in the spec

**4d. Check file scope**
Estimate how many files this issue will touch (create + modify). If the estimate is >10, flag it prominently:

```
⚠️  SIZE WARNING: This issue appears to touch >10 files.
    The spec-audit will block it until split.
    Suggested split: [describe how to divide the issue]
```

**4e. Author requirements.md**
From `templates/issue/requirements.md`:
- User stories from the Linear issue description
- ACs in EARS format, grouped by subsystem — cite the Linear AC IDs
- Edge cases: enumerate at minimum 3 — empty states, network failures, permission edge cases, form validation edge cases
- Non-goals: what the issue explicitly must NOT change (cite `file:line` for validation schemas, submit payloads, etc.)
- States to cover per surface
- Eventing: any analytics or Kafka events the issue should fire (cite existing event patterns at `file:line`)

**4f. Author design.md**
From `templates/issue/design.md`:
- Component map: for each UI element, resolve the component via Designbase MCP (`mcp__designbase-storybook__list-all-documentation`, then `get-documentation`). Record Tier (MCP/experimental/custom). Note any surprises (deprecated APIs, unexpected required props, etc.)
- File plan: list every file to create or modify with real paths. Count the total. Flag if >10.
- Routing, state/data, feature flag, eventing, i18n keys — all grounded in `file:line`
- Risks: list 2-3 things that could be wrong or need verification

**4g. Author tasks.md**
From `templates/issue/tasks.md`:
- Build steps: ordered, numbered, each with a real file path and concrete description
- Test coverage targets: explicitly list happy path + every error state + every edge case from requirements.md
- Self-review checklist: all items from template, adapted to this issue
- Definition of Done: one sentence

**4h. Engineer review**
After authoring all three files, display:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Spec authored: <issue-slug>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  requirements.md: N ACs, N edge cases, N non-goals
  design.md:       N components, N files in plan
  tasks.md:        N build steps, N test targets
```

Ask: "Looks good? Or would you like to adjust anything before moving on?"

### Step 5: Summary

After all issues are authored:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Spec authoring complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Issues authored: N
  ⚠️  Issues flagged for splitting: N (see above)
  Milestones covered: <names>

  Next step: run /spec-audit to adversarially
  review each spec before building.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Hard rules

- **Never invent component APIs** — resolve via Designbase MCP or read the source file
- **Every claim cites `file:line`** — no assumptions, no "probably lives in..."
- **Flag >10 file issues** — always show the warning; suggest how to split
- **Match the exemplar depth** — see `specs/*/issues/01-*/` for reference on what "done" looks like
- **Stay in scope** — only spec the Linear issue as written; report gaps, never expand scope
