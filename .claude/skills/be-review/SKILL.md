---
name: be-review
description: Comprehensive backend review — combines code quality (Ruby/Rails patterns, security, DB safety, test coverage) with architectural standards (Packwerk, data modelling, public interfaces). Self-review your local changes or an open PR, find issues interactively, and fix them before requesting review. Ignores frontend files.
argument-hint: "[optional: PR number or ticket ID, e.g. 123 or HRM-456]"
allowed-tools: Read, Glob, Grep, Bash, Edit, Agent, mcp__linear__get_issue, mcp__atlassian-mcp__getJiraIssue
---

# /be-review

Comprehensive backend review combining code quality analysis and Homebase architectural standards (Packwerk, data modelling). Finds issues interactively and lets you fix them before requesting review.

---

## Steps

### 0. Prerequisites Check

1. Run `which gh` — if not found: "GitHub CLI (`gh`) is not installed. Install it with `brew install gh`, then run `gh auth login`." and stop.
2. Run `gh auth status` — if not authenticated: "GitHub CLI is installed but not authenticated. Run `gh auth login`." and stop.

### 1. Detect Review Scope

**Explicit argument:**

| Type | Example | Detection | Action |
|------|---------|-----------|--------|
| Numeric | `123` | PR number | `gh pr view 123 --json number,title,url,baseRefName,headRefName,body,state` |
| Ticket format | `HRM-456` | Linear ticket | `gh pr list --json headRefName,number,title,url,body,state --search "HRM-456 in:title"` |

**No argument — auto-detect (priority order):**
1. Open PR on current branch: `gh pr view --json number,title,url,baseRefName,headRefName,body,state 2>/dev/null`
2. Local changes: `git diff --name-only $(git merge-base HEAD main)..HEAD` + `git diff --name-only HEAD`

Store `REVIEW_MODE` (`pr` or `local`). No branch checkout — the user is already on their working branch.

### 2. Gather Context

Run these two operations **concurrently**:

**Ticket (optional, non-fatal):** If a ticket ID was found, try Linear first then Jira:
1. `mcp__linear__get_issue` with the ticket ID → `TICKET_SYSTEM=linear`, store `TICKET_TITLE`, `TICKET_DESCRIPTION`.
2. Jira fallback if Linear fails → `mcp__atlassian-mcp__getJiraIssue`. If both fail → `TICKET_AVAILABLE=false`, continue.

**Changed file names:**

| Mode | Command |
|------|---------|
| PR | `gh pr diff $PR_NUMBER --name-only` |
| Local | `git diff --name-only $(git merge-base HEAD $BASE_BRANCH)..HEAD` + `git diff --name-only` + `git diff --cached --name-only` |

After both complete, fetch the **full diff** (capped at 80,000 chars):

| Mode | Command |
|------|---------|
| PR | `gh pr diff $PR_NUMBER \| head -c 80000` |
| Local | `git diff $(git merge-base HEAD $BASE_BRANCH)..HEAD \| head -c 80000` + `git diff \| head -c 80000` + `git diff --cached \| head -c 80000` |

If truncated, store `DIFF_TRUNCATED=true`.

**Filter out frontend files** before categorizing — remove from both file list and diff:
- `*.ts`, `*.tsx`, `*.js`, `*.jsx`, `*.scss`, `*.css`
- `client/**/*`
- `*.stories.*`, `*.test.*`, `*.spec.ts`, `*.spec.tsx`

Store `FE_FILES_SKIPPED`. If all files were frontend → exit: "No backend changes detected — {N} frontend file(s) skipped."

**Categorize remaining files:**

| Category | Variable | Pattern |
|----------|----------|---------|
| Controllers | `CONTROLLER_FILES` | `app/controllers/**/*.rb` |
| Models | `MODEL_FILES` | `app/models/**/*.rb`, `packs/**/app/models/**/*.rb` |
| Services | `SERVICE_FILES` | `app/services/**/*.rb`, `packs/**/app/services/**/*.rb` |
| Specs | `SPEC_FILES` | `spec/**/*_spec.rb`, `packs/**/spec/**/*_spec.rb` |
| Migrations | `MIGRATION_FILES` | `db/migrate/*.rb` |
| Pack public | `PACK_PUBLIC_FILES` | `packs/**/app/public/**/*.rb` |
| RABL views | `RABL_FILES` | `app/views/**/*.rabl` |
| Routes | `ROUTE_FILES` | `config/routes.rb` |
| Other Ruby | `OTHER_RUBY_FILES` | `*.rb` not matching above |

**Display summary:**
```
BE Review: [PR #N — title — url] OR [Local Changes on branch-name]
Backend files: N (controllers: X, models: Y, specs: Z, migrations: W, pack-public: P)
[If FE_FILES_SKIPPED > 0]: Skipped N frontend file(s) — out of scope.
```

### 3. Load Project Conventions

Read `~/.claude/skills/homebase-conventions/conventions-be.md` (resolve `~` via `HOME_DIR=$(echo "$HOME")`). If missing, fail open and use general Rails/Ruby best practices.

### 4. Run Analysis Agents

Run all applicable agents **concurrently** using the `Agent` tool (`subagent_type: "general-purpose"`). Each agent is **read-only** — returns findings as JSON, does not modify files.

Each agent prompt must include:
- The filtered diff (capped at 80,000 chars) + list of changed files
- If `DIFF_TRUNCATED=true`: "Note: diff was truncated — focus on what is visible."
- Contents of `conventions-be.md` (or general best practices if missing)
- Ticket acceptance criteria if `TICKET_AVAILABLE=true`
- Return findings as a JSON array: `{ file, line, severity ("critical"|"warning"|"info"), category, description, suggestion }`

| Agent | Condition | Focus |
|-------|-----------|-------|
| Code Quality | Always | Ruby style, Rails patterns, frozen string literal, naming conventions, `build_*` privates, `ServiceName.run!`/`.call` patterns |
| Security | `CONTROLLER_FILES` or `MODEL_FILES` not empty | Mass assignment (`permit`), SQL injection, `authenticate_account!` guards, sensitive data exposure, `rescue Exception` |
| Database | `MIGRATION_FILES` or `MODEL_FILES` not empty | Migration safety, N+1 queries, missing indexes, scope correctness, reversibility, column defaults on large tables, `NOT NULL` without default |
| Test Coverage | `SPEC_FILES` not empty | RSpec patterns, FactoryBot usage, request spec structure, `sign_in_stytch`/`sign_in_hub`, coverage gaps, no `allow_any_instance_of` |
| Standards & Architecture | Always (if any `.rb` files changed) | Packwerk compliance, data modelling standards, public interface rules (see checklist below) |

**Standards & Architecture agent checklist** — report each violation with its severity:

*Pack Scope (Critical/High if violated):*
- No controllers, rabl, locales, initializers, or config inside a pack
- No front-end code or ActiveAdmin inside a pack

*Cross-Pack Data Access:*
- No `belongs_to`/`has_one`/`has_many` to models in another pack → Critical
- No FK constraints between packs in migrations → Critical
- No raw SQL joining tables from different packs → Critical
- No `ApplicationRecord.transaction` across pack boundaries → High
- Cross-pack references use UUID (not integer), no `_uuid` suffix → Medium

*Public Interface (packs/**/app/public/**):*
- Only class methods in `PublicInterface` (no instance methods) → High
- All parameters are named keyword args → High
- All parameters are primitives (String, Integer, Boolean, Hash) — no AR models → Critical
- Return values are DTOs, not AR models → Critical
- DTOs under `packs/<pack>/app/public/<pack>/dtos/`, named with `Dto` suffix → Medium
- DTOs implemented as `Data.define(...)` → Low
- No factory calls for models outside the current pack in tests → Medium

*Migrations & Table Design:*
- New table name prefixed with domain/pack name → High
- Table and all columns have comments → High/Medium
- New table uses `id: :uuid` (UUIDv4 PK) → High
- Boolean columns have `null: false` + explicit default → High
- No polymorphic associations or FK constraints to other-pack tables → Critical
- No cascade deletes across pack boundaries → High
- Enumerations use native Postgres `ENUM` type, not integer/string → High
- `ActiveRecord::Enum` (`enum` method) NOT used in models → High
- No database triggers → High
- Soft deletion uses `Archivable` concern + `archived_at datetime` with index → Medium
- Timestamps stored as `datetime` (not `timestamp with time zone`) → Medium
- Pack models set explicit `self.table_name` → Medium

### 5. Aggregate Findings

- Merge all JSON arrays into unified `FINDINGS`
- Deduplicate by `(file, line, category)` — keep the higher severity
- Sort: critical → warning → info
- Count: `CRITICAL_COUNT`, `WARNING_COUNT`, `INFO_COUNT`

### 6. PR Description Check (PR mode only)

Expected sections: `## Summary`, `## Why`, `## What Changed`, `## Acceptance Criteria`

Missing sections → add `severity: "warning"` / `category: "documentation"` finding.

If `TICKET_AVAILABLE=true` and description contains AC → compare diff against each criterion; unaddressed criteria → `severity: "info"` / `category: "requirements"` finding.

### 7. Present Summary

```
╔════════════════════════════════════════╗
║          BE REVIEW RESULTS             ║
╚════════════════════════════════════════╝

  🔴 Critical:  N    (broken behavior, hard-rule violations, security)
  🟡 Warning:   N    (standards violations, design issues, coverage gaps)
  🔵 Info:      N    (conventions, advisory, missing comments)

  Standards & Architecture: N violation(s) [Critical: X, High: Y, Medium: Z]
```

If no findings: "All clear! Your code looks good."

If findings exist → proceed to Step 8.

### 8. Interactive Fix Mode

Ask with `AskUserQuestion`:

| Option | Description |
|--------|-------------|
| **Walk through findings (Recommended)** | Present each finding, offer to fix — user approves each change |
| **Show full report** | Display all findings read-only |
| **Skip** | Exit without fixing |

**Walk through findings:** Group by file (critical first). For each finding:
```
[N/Total] CRITICAL | {category} | {file}:{line}
{description}
Suggestion: {suggestion}
```
Options per finding: **Fix this** (Read + Edit) / **Skip** / **Skip remaining for this file** / **Stop**

After each fix: confirm change and move to next.

**Show full report format:**
```
{file}
  🔴 [CRITICAL] Line {line} | {category} — {description}
      Suggestion: {suggestion}
  🟡 [WARNING]  Line {line} | {category} — {description}
      Suggestion: {suggestion}
  🔵 [INFO]     Line {line} | {category} — {description}
      Suggestion: {suggestion}
```

After presenting the full report, ask:
1. "Would you like me to go ahead and fix any of these?"
2. "Would you prefer I pause after each fix, or apply all at once?"

Wait for the user's answer before touching any file.

### 9. Wrap-Up

```
BE Review Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Fixed:     X findings
Skipped:   Y findings
Remaining: Z findings

[If changes were made]: Don't forget to commit.
[If no remaining critical/warning in PR mode]: Ready for review.
[If FE files were present]: Run /fe-review to cover frontend changes.
```

---

## Error Handling

| Error | Action |
|-------|--------|
| Not in git repo | Exit with error |
| `gh` not authenticated | Exit with auth instructions |
| No changes detected | Exit: "No changes detected." |
| Ticket system unavailable | Continue without AC check |
| Agent failure | Skip that agent, continue with remaining findings |
| Network errors on `gh` | Retry up to 2 times, then fall back to local analysis |
