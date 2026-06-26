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
- **PRs are ALWAYS kept as drafts.** Never mark a PR ready for review — not after the build, not after `/review-pr`, not ever. That decision is the engineer's, done manually on GitHub.

---

## Steps

### Step 1: Load spec and config

Read `specs/*/project.config.md` (auto-detect project or ask if multiple). Extract `target_repo`, `tech_stack`.

Read all three spec files for the issue: `requirements.md`, `design.md`, `tasks.md`.

**Check `approved: true`** in frontmatter of all three. If any is missing:
```
⚠️  This spec has not been approved by /spec-audit.
    Building from an unapproved spec risks wasted work.
    Proceed anyway? (yes / run /spec-audit first)
```

**Branch setup:** Run `git -C <target_repo> branch --show-current` and `git -C <target_repo> status --short`.

| State | Action |
|-------|--------|
| On `main`, clean | Ask: "Create feature branch `{initials}/{ticket-id}-{slug}`?" If yes: `git -C <target_repo> pull origin main && git -C <target_repo> checkout -b {branch}` |
| On correct feature branch | Continue |
| On wrong branch, clean | Ask: "Switch to `{initials}/{ticket-id}-{slug}` or create it?" |
| Any branch, uncommitted changes | Stop: "There are uncommitted changes in `<target_repo>`. Commit, stash, or discard them before building." |

Display current branch after setup.

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

**Test completeness gate:** For every new source file created in this issue (`git diff --name-only --diff-filter=A`):
- **FE:** every new `*.tsx` component or `use*.ts` hook → a `*.test.tsx` / `*.test.ts` must exist or be explicitly in `tasks.md`. Pure re-export / barrel index files are exempt.
- **BE:** every new `*_controller.rb`, `*_service.rb`, `*_job.rb`, or model file → a corresponding `*_spec.rb` must exist.

If a new file has no test and the spec's `tasks.md` doesn't explain why, stop and write the missing test before continuing. Do not skip this gate by arguing the test "will be added later."

### Step 3.5: Visual QA (FE changes only)

Skip this step entirely if no `client/` files were changed.

**3.5a. Read states and route**
Read the "States to Cover" table from `requirements.md`. Read the route from `design.md → Routing & Mounting → Route`. These define exactly what to capture.

Create screenshot directory:
```bash
mkdir -p specs/<project-slug>/<milestone-slug>/issues/<issue-slug>/qa/screenshots
```

**3.5b. Start dev server**
Check if already running:
```bash
lsof -i :3000 2>/dev/null | grep LISTEN
```
If not running, start it and wait (max 60 s):
```bash
cd <target_repo> && yarn start > /tmp/dev-server.log 2>&1 &
until curl -s http://localhost:3000 > /dev/null 2>&1; do sleep 3; done
```

**3.5c. Screenshot each state**
Try Playwright first; fall back to `screencapture`:
```bash
# Check for Playwright
npx playwright --version 2>/dev/null && PLAYWRIGHT_AVAILABLE=true

# Playwright path (preferred)
npx playwright screenshot --browser chromium \
  "http://localhost:3000/<route>" \
  "specs/<project>/.../qa/screenshots/<surface>-<state>.png"

# macOS fallback — open in default browser, then window-capture
open "http://localhost:3000/<route>"
screencapture -w "specs/<project>/.../qa/screenshots/<surface>-<state>.png"
```

File naming: `<surface>-<state>.png` — lowercase, hyphen-separated (e.g. `contact-card-error.png`).

For states that require user interaction to reach (error, success, loading-spinner), display a manual step prompt:
```
Manual step needed — <surface>: <state>
  → <Concrete instruction, e.g. "Submit the form with the Name field empty to trigger the validation error">
  Press Enter when the UI is in this state to capture the screenshot.
```
Wait for engineer input before capturing.

**3.5d. Engineer review + Figma comparison**
List all captured screenshot paths. If `FIGMA_URLS` are present in `project.config.md`, display:
```
Figma reference: <url>
Open Figma now to compare each screenshot against the design before confirming.
```

Ask (AskUserQuestion):
- **Looks correct** *(Recommended)* — screenshots match the intended design
- **Discrepancy noted** — ask the engineer to describe it; store in `QA_DISCREPANCIES`
- **Skip — nothing to compare** — proceed without confirmation

Store `QA_SCREENSHOTS = [{ surface, state, path }]` and `QA_DISCREPANCIES = [{ description }]`.

### Step 4: Self-review against spec

Work through `tasks.md` self-review checklist:

- [ ] Every AC from `requirements.md` is addressed
- [ ] No files touched outside the `design.md` file plan
- [ ] All non-goals from `requirements.md` are still true
- [ ] File count: `git diff --name-only HEAD | wc -l` → must be ≤ 10

If file count > 10: stop and surface this to the engineer — something went wrong at the spec stage.

**Spec sync — update specs to match what was built:**
The spec was written before the build. Minor justified deviations are expected (a helper was extracted, a file path changed, a component was swapped). After the build is complete, sync the spec files to reflect reality:

- **`tasks.md`:** Check off completed build steps. If a step was done differently than written, add a one-line note explaining the deviation.
- **`design.md` file plan:** Update any file paths that changed. Remove files that weren't needed; add any that were created unexpectedly (and verify they aren't scope creep first).
- **`design.md` component map:** If a different component was used than planned (e.g. Tier 1 had a better fit discovered during build), update the row.

**Do not change:** ACs, non-goals, user stories, edge cases, or anything in `requirements.md` — those remain the source of truth for what was intended. Only update implementation details.

If a deviation changes behavior (not just file layout), surface it to the engineer before syncing — it may indicate a spec gap or scope change that needs a separate issue.

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
  Visual QA:     N screenshots captured  [omit if no FE changes]
  Spec sync:     tasks.md ✓  design.md ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Ask: "Ready to commit? (yes / no)"

Only on explicit "yes":

```bash
# Stage specific files (never -A)
# Include QA screenshots if any were captured (they live in the spec repo, not the target repo)
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

[INCLUDE ONLY IF FE CHANGES AND QA_SCREENSHOTS non-empty]
## Visual evidence

| Surface | State | Status |
|---------|-------|--------|
| <surface> | <state> | ✓ captured |
| <surface> | <state> | ⚠ discrepancy: <description> |

_Screenshots posted as a follow-up comment._
[If QA_DISCREPANCIES non-empty: ] ⚠ **Visual discrepancies noted above — see follow-up comment for context.**

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

Report the draft PR URL to the engineer.

**Post-creation: upload screenshots (FE changes only)**

If `QA_SCREENSHOTS` is non-empty, after the draft PR is created, upload each screenshot to GitHub and post a single PR comment with all images embedded. Use the GitHub asset upload endpoint:

```bash
# For each screenshot in QA_SCREENSHOTS:
SCREENSHOT_FILENAME=$(basename "$SCREENSHOT_PATH")
UPLOAD_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $(gh auth token)" \
  -H "Content-Type: image/png" \
  --data-binary "@${SCREENSHOT_PATH}" \
  "https://uploads.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues/${PR_NUMBER}/assets?name=${SCREENSHOT_FILENAME}")
IMAGE_URL=$(echo "$UPLOAD_RESPONSE" | jq -r '.href // empty')
```

Build a markdown body from the collected `IMAGE_URL` values and post as a PR comment:
```bash
gh pr comment $PR_NUMBER --body "$(cat <<'EOF'
### Visual QA screenshots

Captured from `requirements.md` states-to-cover after build. Compare against Figma: <figma_url_or_omit_line>

#### <Surface A>

**<state>**
![<surface>-<state>](<IMAGE_URL>)

**<state>**
![<surface>-<state>](<IMAGE_URL>)

[Repeat per surface/state]

[If QA_DISCREPANCIES non-empty:]
---
#### Noted discrepancies
<description of each discrepancy>
EOF
)"
```

If the upload endpoint returns a non-200 or `IMAGE_URL` is empty for any screenshot, fall back to listing the local spec-repo paths in the comment body with a note: `_Screenshots saved locally at specs/<slug>/qa/screenshots/ — upload failed; attach manually if needed._`

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
- Test completeness gate: N new source files → N test files confirmed
- `/be-review` and `/fe-review` findings summary
- Visual QA: N screenshots captured, N discrepancies noted (FE changes only; omit otherwise)
- Spec sync: list any spec files updated and what changed
- Any deviations from the spec and why
- Commit SHA
- Draft PR URL
- PR review URL (from `/review-pr --auto-comment`)
- Screenshot comment URL (FE changes only; omit otherwise)

Be honest about anything not passing or not yet addressed.

Ask (AskUserQuestion):
- **Build the next issue** *(Recommended)* — run `/spec-builder <next-slug>` for the next approved issue in sequence.
- **Pause here** — done for now; the draft PR is open and reviewed.
- **Run /spec-audit on remaining issues** — shown only when unapproved specs still exist.
