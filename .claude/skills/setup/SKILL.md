---
name: setup
description: Interactive project onboarding wizard. Run once per project — collects Linear project, Figma files, meeting recordings, Slack threads, target repo, and tech stack. Writes specs/<slug>/project.config.md and scaffolds project-spec.md.
argument-hint: "[optional: project slug to initialize]"
allowed-tools: Read, Glob, Grep, Write, Bash, mcp__linear__get_project, mcp__linear__list_milestones, mcp__linear__list_issues, mcp__slack__slack_read_thread, mcp__slack__slack_search_channels
---

# /setup

Interactive project onboarding wizard. Run this once per project before anything else. It collects every resource the downstream skills need and writes a single `project.config.md` that all skills read from — no one asks you for the same info twice.

---

## Steps

### Step 0: Welcome

Display:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Project Setup — flor-spec-driven-development
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This wizard collects everything the spec-authoring and
build skills need for this project. It runs once.

Output: specs/<slug>/project.config.md
Next:   /spec-author to generate issue specs from Linear
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 1: Linear project

Ask: "What is the Linear project URL or ID for this project?"

Fetch the project via `mcp__linear__get_project`. Display:
```
Found: <Project name>
Description: <first 2 sentences>
Milestones: N  |  Issues: N
```

Ask: "Is this the right project? (yes / no — paste a different URL)"

Retry up to 3 times if the user provides a different URL. Store `LINEAR_PROJECT_ID`, `LINEAR_PROJECT_URL`, `LINEAR_PROJECT_NAME`.

Derive `PROJECT_SLUG` from the project name: lowercase, hyphens, no special chars (e.g. "Packet Config M1" → `packet-config-m1`). Ask user to confirm or override the slug.

### Step 2: Target repo

Ask: "What is the absolute path to the target product repo? (e.g. ~/Documents/Homebase1)"

Show these hints alongside the question:
```
  How to find the path:
  • Terminal:  cd to the repo folder, then type pwd
  • Finder:    right-click the folder → Get Info → look at "Where:"
                combine "Where:" + folder name, e.g. /Users/you/Documents/Homebase1
  • VS Code:   right-click the root folder in the Explorer → Copy Path
  • Shortcut:  drag the folder into the Terminal — it pastes the full path
```

Expand `~` via `HOME_DIR=$(echo "$HOME")`. Validate the path exists:
- `ls <path>/package.json` → detected frontend: React/TypeScript
- `ls <path>/Gemfile` → detected backend: Ruby on Rails
- `ls <path>/client/src` → confirmed Homebase repo structure

Display what was auto-detected. Ask: "Does this look right? Any corrections?"

Store `TARGET_REPO` (absolute path), `TECH_STACK`.

### Step 3: Figma files

Ask (AskUserQuestion):
- **Yes, add Figma files** — continue to collect URLs
- **Skip** — no Figma for this project

If adding: ask "Paste the Figma URL(s), one per line. Add a short label after each (e.g. `https://figma.com/... | Main flows`)."

Parse each line as `url | label`. Loop until user says "done" or provides an empty line. Store as `FIGMA_URLS` list.

### Step 4: Reference materials

Ask (AskUserQuestion, multiSelect): "What other reference materials do you have?"
- Meeting recording (URL or file path)
- Meeting transcript (file path)
- Slack thread (URL)
- PRD or design doc (URL or file path)
- Prototype or demo (URL)
- None — skip this step

For each selected type, ask for the URL/path and a short label. Store as `REFERENCE_MATERIALS` list with `{ type, label, url_or_path }`.

For Slack threads: if the user provides a Slack URL, offer to fetch the thread content via `mcp__slack__slack_read_thread` and summarize it. Ask: "Should I fetch and summarize this thread now? (saves time during spec authoring)"

### Step 5: Rollout & experiment strategy

> **TODO:** This section needs richer context on how rollouts and experiments work at Homebase — including the difference between `redux_rollout`, backbone rollouts (deprecated), and experiment flags; how to create a new rollout entry in `fetch.rb`; how experiments are configured; and what BE work is required before any FE flag can be used. Add this documentation before relying on this step for a new project. See `docs/refinements/2026-06-25.md` for background.

Ask (AskUserQuestion): "Does this project use feature flags, rollout flags, or experiments?"
- **Yes — uses rollout/experiment flags** — continue to collect details
- **No — ships without flags** — skip this step; store `rollout_strategy: none`
- **Not sure yet** — skip for now; store `rollout_strategy: tbd` and note it should be revisited before spec authoring

If **Yes**:

Ask: "What rollout type does this project use?"
- **`redux_rollout`** *(Recommended for Homebase)* — flag stored in Redux session state, accessed via `getRolloutEnabled(state, 'key')` from `selectors/session.js`. Registered in `app/services/feature_flags/fetch.rb` ALLOW_LIST.
- **`experiment`** — A/B experiment; requires experiment setup in the BE experiment framework.
- **Other** — ask for the type name and where it's configured.

Ask: "What is the rollout key naming convention for this project? (e.g. `add_team_child_page`, `packet_config_v2`)"

Ask: "Does the rollout flag/experiment already exist in the target repo's BE config?"
- **Yes — already configured** — note the file path (`app/services/feature_flags/fetch.rb` or equivalent)
- **No — needs to be created** — flag this: a BE issue must be created and completed before any FE issue that depends on the flag. This BE issue should be listed as a dependency when creating FE issues in Linear.
- **Not sure** — store `rollout_exists: unknown`; `/spec-author` will surface this as a risk on each issue that uses the flag.

Store as `ROLLOUT_STRATEGY` with fields: `type`, `key_convention`, `exists`, `config_path`.

### Step 6: Review & confirm

Display a full summary:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Setup Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Project slug:  <slug>
  Linear:        <project name> (<N milestones, N issues>)
  Target repo:   <path>
  Tech stack:    <frontend> + <backend>
  Figma:         <N files> [list labels]
  References:    <N items> [list type + label]
  Rollout:       <type> / key convention: <key> / exists: <yes|no|tbd>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Ask: "Does everything look correct? (yes to write / no to go back and correct)"

If no: ask which section to fix. Loop back to that step.

### Step 7: Write project files

Fetch milestone list via `mcp__linear__list_milestones`. Build the milestones table.

Create directory: `specs/<PROJECT_SLUG>/`

**Write `specs/<PROJECT_SLUG>/project.config.md`** from the template at `templates/project.config.md`, filling in all collected values including `ROLLOUT_STRATEGY` under a `## Rollout & Experiments` section.

**Write `specs/<PROJECT_SLUG>/project-spec.md`** from `templates/project-spec.md`, pre-filling:
- Project name and Linear URL in the header
- Target repo path
- Figma links in the intake section
- Milestone names in the issue breakdown table (rows left as `pending`)

Create placeholder recon directories for each milestone:
`specs/<PROJECT_SLUG>/<milestone-slug>/00-recon/.gitkeep`

### Step 8: Fetch and summarize milestones

Fetch all milestones and their issue counts via `mcp__linear__list_milestones` + `mcp__linear__list_issues`. Display:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Milestones in <Project Name>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  M1: <name> — N issues
  M2: <name> — N issues
  ...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 9: Transition to spec authoring

Display:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Setup complete ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Created:
    specs/<slug>/project.config.md
    specs/<slug>/project-spec.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Ask with AskUserQuestion:
- **Yes — start spec authoring now** *(Recommended)* — immediately invoke `/spec-author` which will ask which milestones and issues to generate specs for
- **Not yet — I'll run /spec-author when ready** — stop here; the config is saved and ready whenever you are

If the engineer selects "Yes": invoke `/spec-author` immediately. Do not re-display the setup summary — the engineer has already seen it.

---

## Error handling

| Error | Action |
|-------|--------|
| Linear project not found | Ask for a different URL; retry up to 3 times |
| Target repo path doesn't exist | Ask for correct path |
| MCP tool unavailable | Note which resource was skipped; continue |
| User cancels mid-wizard | Ask "Save progress so far?" — if yes, write what's been collected with `status: incomplete` in frontmatter |
