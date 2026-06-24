---
name: review-pr
description: Review a PR (teammate's or your own) across FE and BE — fetches the diff, classifies files into FE and BE scopes, compares against Linear acceptance criteria, runs scope-specific analysis agents, optionally enriches with incident.io context when available, then posts findings to the PR. Three modes: --auto-comment posts everything automatically as inline comments + a summary comment (default for spec-builder); interactive walk-through lets you pick per finding; --dry-run prints to stdout without posting. Self-review mode activates automatically when reviewing your own PR or local changes.
argument-hint: "[PR number, PR URL, Linear ticket ID, or branch name] [--auto-comment | --dry-run]"
allowed-tools: Read, Glob, Grep, Bash, Agent, mcp__linear__get_issue, mcp__atlassian-mcp__getJiraIssue
---

# /review-pr

Review a PR across both frontend (React/TypeScript) and backend (Rails/Ruby) changes, with optional
incident.io enrichment. Read-only for code — never edits files.

**Three posting modes:**
- **`--auto-comment`** — skip the walk-through entirely. All findings auto-routed (concrete line →
  inline comment, no line → summary body) and posted in one shot as a `COMMENT` review. Best for
  automated contexts (e.g. `spec-builder` running right after a draft PR is created).
- **Interactive** (default) — walk through each finding and choose inline / summary / skip per item.
  Best when you want to curate what gets posted.
- **`--dry-run`** — assemble the full draft and print to stdout. Nothing is posted.

Each finding is tagged `scope: "fe" | "be"` so the walk-through stays one stream sorted by severity,
but the posted GitHub summary splits into FE and BE sections.

**Self-review mode** activates automatically when the PR author matches the authenticated GitHub user
or when reviewing local changes with no open PR — same analysis agents, interactive resolution,
no GitHub review payload.

**Incident context** is gathered automatically when incident.io tools are available (`get_incident`,
`list_incidents`, `list_alerts`). If tools are unreachable, the review continues without incident
enrichment — fail open.

---

## Parameters

- **target** *(optional)* — PR number (`123`), PR URL, Linear ticket ID (`HRM-456`), or branch name.
  Omit to auto-detect from current branch.
- **--auto-comment** *(optional flag)* — Skip the walk-through. Auto-route all findings and post the
  full review immediately as a `COMMENT` event. Findings with a concrete line number are posted as
  inline comments; everything else goes into the summary body. Best for automated contexts.
- **--dry-run** *(optional flag)* — Skip interactive walk-through and GitHub post. Assemble and print
  the full draft to stdout. Nothing is posted.

`--auto-comment` and `--dry-run` are mutually exclusive; `--auto-comment` takes precedence.

---

## Workflow

### Step 0: Prerequisites and routing

1. Scan args for flags: set `AUTO_COMMENT=true` if `--auto-comment` present, `DRY_RUN=true` if
   `--dry-run` present (ignored when `AUTO_COMMENT=true`).
2. Run `which gh` — if missing, tell user to install it and stop.
3. Run `gh auth status` — if not authenticated, tell user to run `gh auth login` and stop.
4. Run `gh api user --jq .login` → store as `GH_USER`.
5. Resolve the target (Step 1). If `PR_AUTHOR == GH_USER` or no PR exists → enter **self-review mode**.

#### Self-review mode

Full FE + BE analysis pipeline with interactive fix capabilities (not GitHub review posting). When
`REVIEW_MODE=local`, skip all GitHub-posting steps. Use the same analysis agents and walk-through
from Steps 3-7, but offer to fix findings rather than post them.

### Step 1: Resolve the PR

| Input | Detection | Action |
|---|---|---|
| Numeric | `^\d+$` | `gh pr view <num> --json ...` |
| PR URL | matches `github\.com/.*/pull/\d+` | extract number, `gh pr view <num>` |
| Ticket ID | `^[A-Za-z]+-\d+$` | `gh pr list --search "<TID> in:title" --state open --json ...` |
| Branch name | anything else | `gh pr list --head <branch> --json ...` |
| *(empty)* | No target | `gh pr view --json ...` on current branch |

Fields: `number,title,url,baseRefName,headRefName,headRefOid,body,state,author,mergeable`.

Store: `PR_NUMBER`, `PR_TITLE`, `PR_BRANCH`, `PR_BASE`, `PR_URL`, `PR_BODY`, `PR_AUTHOR`,
`PR_STATE`, `PR_HEAD_SHA` (from `headRefOid`).

### Step 2: Gather context (parallel)

Launch three agents concurrently:

**Agent A — shell:** Fetches diff (`gh pr diff <num> | awk 'BEGIN{n=0} {n+=length($0)+1; if (n > 80000) {print "...[truncated]"; exit} print}'`), file names (`--name-only`), existing review comments (all three streams via `gh api`, paginated), and repo owner/name. Sets `DIFF_TRUNCATED=true` if awk truncated.

**Agent B — explore:** Reads full content of every changed file (not just diff hunks). Categorizes files into FE and BE scopes. Reads `homebase-conventions/conventions-fe.md` and `homebase-conventions/conventions-be.md` from `~/.claude/skills/homebase-conventions/` (resolve `~` via `HOME_DIR=$(echo "$HOME")`). Extracts ticket ID from branch name or PR title.

**Agent C — general-purpose:** Resolves ticket via Linear first (`mcp__linear__get_issue`), Jira fallback (`mcp__atlassian-mcp__getJiraIssue`). Extracts acceptance criteria. Gathers incident context (see below — skip silently if tools unreachable).

After all three complete, merge into: `DIFF`, `FILE_LIST`, `FE_FILES`, `BE_FILES`, `FILE_CONTENTS`,
`CONVENTIONS_FE`, `CONVENTIONS_BE`, `TICKET_*`, `INCIDENT_CONTEXT`.

#### Incident context gathering (Agent C, skip if tools unreachable)

Extract signals from PR title, body, branch, ticket, and changed file paths. Then:
1. **Referenced incidents** — resolve any `INC-####` refs via `get_incident`.
2. **Recent incidents** — `list_incidents` for the last ~60 days, filter client-side for relevance to changed code.
3. For each related incident, pull `list_incident_updates`, `list_actions`, `list_incident_alerts`.

Reduce to `INCIDENT_CONTEXT: { referenced[], related[], open_actions[], unavailable: bool }`.
Be conservative about "related" — only include when there is a concrete link.
If unreachable, set `unavailable: true` and continue.
**Hard rule:** only `get_*`, `list_*`, `search_*` — never `create_*`, `update_*`, `delete_*`.

#### File categorization

**Frontend scope** (`scope: "fe"`): `*.tsx`, `*.ts`, `*.js`, `*.jsx` (excl. test/story) as Source;
`*.test.{ts,tsx,js,jsx}`, `*.spec.{ts,tsx}` as Tests; `*.stories.{ts,tsx}` as Stories;
`*.{scss,css}` as Styles; `slice.ts`/`selectors.ts`/`actions.ts` or `createSlice`/`createAsyncThunk`
as Redux; `use*.{ts,tsx}` or `hooks/` as Hooks.

**Backend scope** (`scope: "be"`): `app/controllers/**/*.rb` as Controllers;
`app/models/**/*.rb`, `packs/**/app/models/**/*.rb` as Models; `app/services/**/*.rb`,
`app/jobs/**/*.rb`, `packs/**/app/services/**/*.rb` as Services; `spec/**/*_spec.rb`,
`packs/**/spec/**/*_spec.rb` as Specs; `db/migrate/*.rb`, `db/schema.rb` as Migrations;
`app/views/**/*.rabl`, `app/serializers/**/*.rb`, `**/*.json.jbuilder` as RABL/Serializers;
`app/views/**/*.{haml,erb}` as Views; `config/routes.rb` as Routes; other `*.rb` as Other Ruby.

**Aggregates:** `FE_FILES` = union of FE; `BE_FILES` = union of BE;
`UNKNOWN_FILES` = everything else (configs, docs, lockfiles — listed, not analyzed).

**Early-exit:** if both empty → "No reviewable source files changed."

**Display summary:**
```
Review: PR #N — <title>
Author: <author>
<base> ← <branch>  |  <url>
Files:  FE: X (A source, B tests, C styles)  |  BE: Y (E controllers, F models, G specs)  |  Other: Z
Ticket: <ID> — <title>  (N AC items)
Existing comments: N inline, M discussion
Incidents: N referenced, M related  (omit line if empty)
```

### Step 3: Run analysis agents

All agents: `subagent_type: "general-purpose"`, read-only, return JSON findings. Run in parallel.
Each agent sees only files in its scope.

Each agent prompt includes: diff + file list (note if truncated), files in scope, files out of scope,
relevant conventions file contents, existing inline comments + prior review bodies (to avoid dupes),
ticket AC (for AC Coverage), incident context brief (when non-empty — treat as higher-risk signal),
scope tag, and JSON return format:

```json
{
  "scope": "fe | be",
  "file": "relative/path.tsx",
  "line": 42,
  "severity": "critical | warning | info",
  "category": "string",
  "description": "one sentence, factual",
  "question": "collaborative question for the PR author (should we... / would it be worth... / any concern that...)",
  "impact": "OPTIONAL — one sentence on why this matters",
  "fix": "OPTIONAL — one sentence concrete next step"
}
```

Drop any finding whose `(file, line, description)` substantially overlaps an existing comment.

**Frontend agents** (fire when `FE_FILES` non-empty):

| Agent | Condition | Focus |
|---|---|---|
| FE Code Quality | `FE_SOURCE_FILES` / `FE_TEST_FILES` / `FE_STYLE_FILES` non-empty | TS, React patterns, deprecated imports, cxHelpers, 100-char lines, Homebase compliance (Designbase, i18n, UX tracking, hooks, naming) |
| FE Test Coverage | `FE_TEST_FILES` or `FE_SOURCE_FILES` non-empty | RTL patterns, userEvent, coverage gaps (functions only — never flag missing component tests) |
| FE State & Data | `FE_REDUX_FILES` non-empty OR GraphQL changes | Redux Toolkit, selector memoization, React Query |
| FE Accessibility | `FE_SOURCE_FILES` contains `.tsx` | jsx-a11y, semantic HTML, ARIA |

**Backend agents** (fire when `BE_FILES` non-empty):

| Agent | Condition | Focus |
|---|---|---|
| BE Code Quality | Any `BE_*` non-empty | Ruby style, Rails patterns, frozen string literal, naming, `BaseController`, service call pattern |
| BE Security | `BE_CONTROLLER_FILES` or `BE_MODEL_FILES` non-empty | Mass assignment, SQL injection, `authenticate_account!`, sensitive data |
| BE Database | `BE_MIGRATION_FILES` or `BE_MODEL_FILES` non-empty | Migration safety, N+1, missing indexes, scope correctness |
| BE Test Coverage | `BE_SPEC_FILES` non-empty OR new controller/model methods | RSpec, FactoryBot, request spec structure, coverage gaps |
| BE Standards | Any `BE_*` non-empty | Packwerk compliance, cross-pack data access, public interface rules, data modelling (UUIDs, enums, archival) |

**Cross-scope agents** (run once over combined diff):

| Agent | Condition | Focus |
|---|---|---|
| API Contract | BE controller/RABL/routes AND FE files both change | BE response-shape / route changes that break FE callers. Tag `scope: "be"`. |
| AC Coverage | Ticket AC list non-empty | Compare diff against each AC item; flag unaddressed or partial. Tag by where unaddressed work lives. |

### Step 4: Aggregate findings

- Merge all arrays into `FINDINGS`. Default scope by file path if omitted (`*.rb` → `be`, else `fe`).
- Deduplicate by `(file, line, category)` — keep highest severity.
- Sort: severity (critical → warning → info), then scope (`fe` before `be`) within each tier.
- Compute: `CRITICAL_COUNT`, `WARNING_COUNT`, `INFO_COUNT` overall + per-scope breakdowns.

### Step 5: Generate positive callouts

Lightweight pass for genuine positives: thoughtful test coverage, good naming, accessibility done
right, cleanup beyond ticket scope, correct design-system usage throughout. Store as
`POSITIVES = [{ title, detail }]`. Aim for 2-4 items. **Skip entirely if nothing genuinely stands out.**

### Step 6: Present summary

```
╔═══════════════════════════════════════╗
║         PR REVIEW DRAFT               ║
╚═══════════════════════════════════════╝

               Total    FE     BE
  🔴 Critical:   N        X      Y
  🟡 Warning:    N        X      Y
  🔵 Info:       N        X      Y
  🌟 Positives:  N

  Ticket AC: X/Y items covered
  Existing comments: N (skipped duplicates)
  Incidents: N relevant  (omit if empty)
```

Omit the FE or BE column if that scope has zero findings.
If `FINDINGS` is empty, offer fast path to the approve options in Step 9.

### Step 7: Interactive walk-through

Initialize: `INLINE_COMMENTS = []`, `SUMMARY_POINTS = []`, `INCLUDED_POSITIVES = []`.

**Auto-comment short-circuit:** If `AUTO_COMMENT=true`, auto-populate all buckets without
interaction — same routing logic as dry-run — then skip directly to Step 8 and Step 9 where the
review is posted immediately as a `COMMENT` event. No walk-through, no event picker.

**Dry-run short-circuit:** If `DRY_RUN=true`, auto-populate: findings with a concrete line number (> 0)
go to `INLINE_COMMENTS`; others (line 0 / "PR Description" / "Acceptance Criteria") go to
`SUMMARY_POINTS`. All positives → `INCLUDED_POSITIVES`. Skip to Step 8.

**Normal flow:** Walk `FINDINGS` in severity order. For each finding display:

```
[N/total]  <severity>  |  [<SCOPE>]  <category>  |  <file>:<line>
<description>

Draft for PR author:
  <question>
```

`AskUserQuestion` per finding:
- **Post as inline comment on this line**
- **Post in the review summary**
- **Edit the wording** — accept revised text, re-ask placement
- **Skip**
- **Stop walking** — exit loop, proceed with what's collected

**Line-number accuracy:** GitHub's review API rejects comments whose `line` doesn't exist in the
current PR snapshot. Use the **line number in the new version of the file**, not the raw unified-diff
offset. For `@@ -0,0 +1,N @@` (new file), the nth line body is line `n`. For a modified file with
`@@ -A,B +C,D @@`, count `+` and context lines from `C` onward; `-` lines don't occupy a new-file
line number. When unsure, target the closest `+` or context line within the hunk.

**Side detection:** default `RIGHT` (added/changed lines). Use `LEFT` for removed lines.

**422 fallback at post time:** if the API rejects with `422 Unprocessable Entity — "Line could not be
resolved"`, identify the offending comments (in response body), move each to `SUMMARY_POINTS` as
`` `<file>:<line>` — <body> ``, drop from `INLINE_COMMENTS`, and retry once. If a second 422 fires,
surface the composed review + unposted comments so the user can paste them manually.

Then walk `POSITIVES`: include, edit, or skip.

### Step 8: Compose the review draft

```markdown
## Review of <PR_TITLE>

### ✅ Nice work
- <positive 1>
- <positive 2>

### 🔎 Points worth a look

**Frontend**
- `<file>:<line>` — <fe summary point>

**Backend**
- `<file>:<line>` — <be summary point>

### 📋 Acceptance criteria
- [x] <AC 1> — covered by `<file:line>`
- [ ] <AC 2> — doesn't appear addressed (see inline comment)
```

Rules:
- Omit `### ✅ Nice work` if `INCLUDED_POSITIVES` is empty.
- Omit `**Frontend**` / `**Backend**` subheads if only one scope has summary points.
- Omit `### 🔎 Points worth a look` entirely if no summary points.
- Omit `### 📋 Acceptance criteria` if no ticket AC was loaded.
- **Do NOT include incident context in the review body** — post separately (Step 9).

Show the user: composed body + inline comment count (e.g., "3 inline comments — 2 FE, 1 BE").

### Step 9: Choose review event + submit

**Auto-comment fast-path:** If `AUTO_COMMENT=true`, skip the event picker entirely. Post immediately
as a `COMMENT` review (body = Step 8 composed summary, comments = `INLINE_COMMENTS`, event =
`"COMMENT"`, commit_id = `PR_HEAD_SHA`). On success display:

```
PR Review posted (auto-comment)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🔴 Critical:  N inline  +  M in summary
  🟡 Warning:   N inline  +  M in summary
  🔵 Info:      N inline  +  M in summary
  🌟 Positives: N

  FE: X inline comments  |  BE: Y inline comments
  Review URL: <html_url>
```

Then proceed to the incident comment step and Step 9.5 (skip HTML report prompt in auto-comment
mode). Do NOT show the event picker.

**Dry-run short-circuit:** print full review (summary body + inline comments as `<file>:<line> — <body>`) to stdout and exit.

**Pre-flight guard for LGTM-only:** if `INLINE_COMMENTS.length > 0` and user is about to choose
"Approve (LGTM only)", confirm: "You have N inline comment(s) — LGTM-only discards them. Keep or drop?"

`AskUserQuestion`:
- **Comment** *(Recommended)* — neutral feedback, no approval/rejection.
- **Approve (LGTM only)** — submit APPROVE with body exactly `"LGTM"`. **Do NOT embellish.**
- **Approve with custom body** — ask what the body should say; offer Step 8 draft as a preset.
- **Request changes** — block merge.
- **Cancel** — exit without posting.

Post via `gh api POST /repos/<owner>/<repo>/pulls/<num>/reviews` with payload:
`{ event, body, commit_id: PR_HEAD_SHA, comments: INLINE_COMMENTS }`.
Always include `commit_id` — pins inline comments to the analyzed snapshot.

**Post-review: incident comment** — if `INCIDENT_CONTEXT` is non-empty (and not `unavailable`),
post a separate `gh pr comment` with a `### Incident context` section listing related
incidents/actions. If `unavailable`, post a muted note. Display the comment URL.

### Step 9.5: Optional HTML report

Ask: save HTML report to `~/Desktop/PR-<num>-review.html`? Options: Save + open (recommended),
Save without opening, Skip. Skip when `DRY_RUN=true`.

The report includes: hero header (PR metadata + severity tiles), scope-grouped finding cards (FE
then BE), incident context cards, positive callout cards, AC checklist, footer with timestamp.
Finding cards: severity badge, description as title, file-ref link to GitHub, question, optional
impact/fix blocks. HTML-escape all injected text.

### Step 10: Wrap-up

```
Review posted
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Event:              <COMMENT | APPROVE | REQUEST_CHANGES>
Scope coverage:     FE: X files / Y findings   |  BE: A files / B findings
Inline comments:    N  (FE: x, BE: y)
Summary points:     N  (FE: x, BE: y)
Positives:          Z
Skipped findings:   W
Incidents posted:   N  (omit if none)
Other files:        N files  (configs/docs — not analyzed)
Review URL:         <html_url>
```

---

## Hard rules

- **Read-only for code.** Never edits repo files.
- **Read-only for incidents.** Only `get_*`, `list_*`, `search_*` incident.io tools.
- **Scope discipline.** FE agents see only FE files; BE agents see only BE files. Only API Contract
  and AC Coverage agents see both.
- **Respect existing comments.** Agents dedup against prior feedback.
- **Default event is COMMENT.** Approving or requesting changes is always the user's explicit choice.
- **Reviewer etiquette.** Findings are questions ("should we..."), not commands.
- **No praise manufacturing.** Skip positives if the diff is mundane.
- **LGTM is four characters.** Never embellish the LGTM-only body.
- **Fail open on incidents.** Errors must not interrupt the review.

---

## Error Handling

| Error | Action |
|---|---|
| `gh` CLI missing / not authed | Exit with install/auth instructions |
| PR author == authenticated user | Enter self-review mode |
| No PR and no target | Enter self-review mode in local mode |
| PR not found | Exit: "No PR matches `<target>`." |
| Ticket system unavailable | Continue without ticket/AC context; note in summary |
| Agent failure | Skip that agent, continue; note in Step 6 |
| incident.io tools unreachable | Set `INCIDENT_CONTEXT.unavailable=true`, continue |
| Network errors on `gh` | Retry up to 2x, then fall back to local analysis |
| `gh api` post fails | Display composed review + inline comments with error |
