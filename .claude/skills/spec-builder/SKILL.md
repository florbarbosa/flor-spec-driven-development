---
name: spec-builder
description: Build one approved issue spec in the target repo. Follows tasks.md step by step, verifies (tsc/jest/eslint), runs /be-review and /fe-review, gets engineer approval, commits via hops linear, pushes, opens draft PR, and runs /review-pr --auto-comment. One issue = one PR, always.
argument-hint: "[issue slug, e.g. 01-child-page-route-shell]"
allowed-tools: Read, Glob, Grep, Write, Edit, Bash, Agent, mcp__designbase-storybook__list-all-documentation, mcp__designbase-storybook__get-documentation
---

# /spec-builder

Implements one approved issue spec in the target repo. The spec is the contract — build exactly to it. Never invent scope; never build a second issue in the same session.

---

## Hard rules (enforced at every step)

- **1 issue = 1 PR.** If you notice you're touching files outside the spec's file plan, stop.
- **Never `git add -A`.** Stage specific files only.
- **Never push** without explicit engineer approval.
- **Build to spec.** If you discover a gap or missing behavior, report it — never implement it.
- **Spec must be approved** (`approved: true` in frontmatter) before building. Warn and ask if not.
- **For submit surfaces:** tsc + jest is not sufficient — run the app and do a real unmocked submit.

---

## Steps

### Step 1: Load spec and config

Read `specs/*/project.config.md` (auto-detect project or ask if multiple). Extract `target_repo`, `tech_stack`.

Read all three spec files for the issue: `requirements.md`, `design.md`, `tasks.md`.

**Check `approved: true`** in frontmatter of all three. If any is missing:
```
⚠️  This spec has not been approved by /spec-reviewer.
    Building from an unapproved spec risks wasted work.
    Proceed anyway? (yes / run /spec-reviewer first)
```

**Confirm branch:** Ask the engineer to confirm they are on a feature branch matching `{initials}/{ticket-id}-{slug}`. Run `git branch --show-current` to show the current branch.

Display:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Building: <issue-slug>
  Branch:   <current-branch>
  Repo:     <target_repo>
  Files:    N to create, M to modify
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 2: Build

Follow `tasks.md` **step by step**. For each step:
- Read the relevant existing files before editing
- Make the change described — no more, no less
- If a step references a component: confirm via Designbase MCP (`mcp__designbase-storybook__get-documentation`) before writing — do not invent props

If you discover a gap (behavior the spec doesn't cover but that clearly needs to exist):
- Note it in your output
- Do NOT implement it
- Continue with what the spec says

Put new components under the directory the spec's `design.md` names. No exceptions.

### Step 3: Verify

Run all checks in the target repo. Capture and display PASS / FAIL for each.

```bash
# TypeScript
cd <target_repo> && tsc --noEmit 2>&1 | tail -20

# Tests — new suite + any regressing suite
cd <target_repo> && jest <new-test-file-path> --passWithNoTests
cd <target_repo> && jest <existing-suite> --passWithNoTests

# Lint
cd <target_repo> && eslint <changed-files>
cd <target_repo> && stylelint <changed-scss-files>   # if SCSS was changed
```

**For any surface that submits or persists data:** also run the app and perform a real, unmocked submit in at least the base config. Confirm the network call fires and the success/error state appears. Add this result to the verify output.

If any check fails: stop, show the error, and work with the engineer to fix it before continuing.

### Step 4: Self-review against spec

Work through `tasks.md` self-review checklist:

- [ ] Every AC from `requirements.md` is addressed
- [ ] No files touched outside the `design.md` file plan
- [ ] All non-goals from `requirements.md` are still true
- [ ] File count: `git diff --name-only HEAD | wc -l` → must be ≤ 10

If file count > 10: stop and surface this to the engineer — something went wrong at the spec stage.

### Step 5: Automated code review

Run `git diff --name-only` (unstaged + staged) to see all changed files.

- `client/` files present → invoke `/fe-review` (Designbase compliance, TypeScript, i18n, a11y, hooks)
- `app/`, `packs/`, `config/`, `spec/` files present → invoke `/be-review` (Ruby/Rails quality, security, DB, Packwerk)
- Both scopes present → invoke both

**Present the full findings summary to the engineer.** Do not auto-fix anything. Wait for explicit approval.

> Only proceed when the engineer confirms: "no critical findings remain."

### Step 6: Commit checkpoint

Display:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Ready to commit
  Branch:        <branch>
  Files changed: N
  Verify:        tsc ✓  jest ✓  eslint ✓
  Code review:   N critical, N warning, N info
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Ask: "Ready to commit? (yes / no)"

Only on explicit "yes":

```bash
# Stage specific files (never -A)
git add <file1> <file2> ...

# Commit via hops linear (fetches matching Linear issue from branch name)
hops linear --edit=false

# Add Co-Authored-By trailer
git commit --amend --no-edit --trailer "Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

Show the final commit message to the engineer. If `hops linear` prompts (no matching Linear issue in branch name), surface that prompt.

### Step 7: Push + draft PR checkpoint

Display:
```
git diff --stat origin/main..HEAD
```

Ask: "Ready to push and open a draft PR? (yes / no)"

Only on explicit "yes":

```bash
git push -u origin HEAD
```

Then open the draft PR:
```bash
gh pr create --draft \
  --title "<issue-slug>: <Linear issue title>" \
  --body "..."
```

PR body must include:
```markdown
## What this implements
<issue-slug> from specs/<project>/<milestone>/issues/<slug>/

## Spec
- [requirements.md](<link>)
- [design.md](<link>)
- [tasks.md](<link>)

## Review findings (pre-PR)
be-review: N critical, N warning, N info
fe-review: N critical, N warning, N info
[List any unresolved items]

## Test plan
- [ ] tsc --noEmit: PASS
- [ ] jest: PASS
- [ ] eslint/stylelint: PASS
- [ ] Manual smoke test: <describe what was verified>
[For submit surfaces: ] - [ ] Real unmocked submit: confirmed

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

Report the draft PR URL to the engineer.

### Step 8: Automated PR review

Immediately after the draft PR is created, invoke:
```
/review-pr <PR_NUMBER> --auto-comment
```

This runs the full FE + BE analysis against the PR diff and automatically posts:
- Findings with a concrete line number → inline comments
- Findings without a line (AC gaps, PR description issues, architectural concerns) → summary body

Reports the review URL and per-severity breakdown once done.

### Step 9: Output

Report:
- Branch name
- `git diff --stat` summary
- Files changed (list)
- Verify results: tsc / jest / eslint PASS/FAIL with key output
- `/be-review` and `/fe-review` findings summary
- Any deviations from the spec and why
- Commit SHA
- Draft PR URL
- PR review URL (from `/review-pr --auto-comment`)

Be honest about anything not passing or not yet addressed.
