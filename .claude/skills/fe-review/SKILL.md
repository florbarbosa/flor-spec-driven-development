---
name: fe-review
description: Comprehensive frontend review — combines code quality (TypeScript, React patterns, test coverage, accessibility, state management) with Homebase-specific standards (Designbase, i18n, UX tracking, SCSS, routing, hooks, cleanup). Self-review your local changes or an open PR, find issues interactively, and fix them before requesting review. Ignores backend files.
argument-hint: "[optional: PR number or ticket ID, e.g. 123 or HRM-456]"
allowed-tools: Read, Glob, Grep, Bash, Edit, Agent, mcp__linear__get_issue, mcp__atlassian-mcp__getJiraIssue
---

# /fe-review

Comprehensive frontend review combining code quality analysis, Homebase-specific standards compliance, and cleanup opportunities. Finds issues interactively and lets you fix them before requesting review.

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

Store `REVIEW_MODE` (`pr` or `local`). No branch checkout.

### 2. Gather Context

Run these two operations **concurrently**:

**Ticket (optional, non-fatal):** If a ticket ID was found, try Linear first then Jira:
1. `mcp__linear__get_issue` → `TICKET_SYSTEM=linear`, store `TICKET_TITLE`, `TICKET_DESCRIPTION`.
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

**Categorize files** (relative to `client/` when applicable):

| Category | Variable | Pattern |
|----------|----------|---------|
| Source | `SOURCE_FILES` | `*.tsx`, `*.ts`, `*.js`, `*.jsx` — excluding test/story files |
| Tests | `TEST_FILES` | `*.test.tsx`, `*.test.ts`, `*.test.js` |
| Stories | `STORY_FILES` | `*.stories.tsx`, `*.stories.ts` |
| Styles | `STYLE_FILES` | `*.scss`, `*.css` |
| Redux | `REDUX_FILES` | `slice.ts`, `selectors.ts`, `actions.ts`, or files containing `createSlice`/`createAsyncThunk` |
| Hooks | `HOOK_FILES` | `use*.ts`, `use*.tsx`, or files in `hooks/` directories |
| Backend | `BACKEND_FILES` | `*.rb`, `*.erb`, `*.haml` — noted but not reviewed |

**Display summary:**
```
FE Review: [PR #N — title — url] OR [Local Changes on branch-name]
Files changed: N (source: X, tests: Y, styles: Z, hooks: W)
[If BACKEND_FILES > 0]: Noted N backend file(s) — run /be-review for backend analysis.
```

### 3. Load Project Conventions

Read `~/.claude/skills/homebase-conventions/conventions-fe.md` (resolve `~` via `HOME_DIR=$(echo "$HOME")`). If missing, fail open and use general React/TypeScript best practices.

### 4. Run Analysis Agents

Run all applicable agents **concurrently** using the `Agent` tool (`subagent_type: "general-purpose"`). Each agent is **read-only** — returns findings as JSON, does not modify files.

Each agent prompt must include:
- The diff (capped at 80,000 chars) + list of changed files
- If `DIFF_TRUNCATED=true`: "Note: diff was truncated — focus on what is visible."
- Contents of `conventions-fe.md` (or general best practices if missing)
- Ticket acceptance criteria if `TICKET_AVAILABLE=true`
- Return findings as a JSON array: `{ file, line, severity ("critical"|"warning"|"info"), category, description, suggestion }`

| Agent | Condition | Focus |
|-------|-----------|-------|
| Code Quality & Compliance | Always | See full checklist below |
| Test Coverage | `TEST_FILES` or `SOURCE_FILES` not empty | RTL patterns, coverage gaps |
| State & Data | `REDUX_FILES` not empty OR GraphQL changes detected | Redux Toolkit, selector memoization, React Query |
| Accessibility | `SOURCE_FILES` contains `.tsx` components | jsx-a11y, semantic HTML, ARIA attributes |
| Cleanup Opportunities | Always (when `SOURCE_FILES` not empty) | Readability, maintainability, simplification — see checklist below |

---

**Code Quality & Compliance agent checklist:**

*TypeScript quality:*
- `any` or `Record<string, any>` on exported/public interfaces → use `unknown` or a specific type
- Unnecessary `as` casts that silence TypeScript errors → fix the source type
- No `enum` → use string literal unions with `as const`
- No `React.FC` → type props explicitly
- Missing prop types or overly broad prop interfaces

*React patterns:*
- `useHistory`/`Redirect` from `react-router-dom` — never `browserHistory` (project is on RR v5)
- No React Router v6/v7 APIs
- No `axios` imports → use `client/src/api/fetch.js` instead
- No `window.*` reads → use Redux state, `getConfig()`, or service endpoints
- No new `window.*` globals
- No props spreading (`{...props}`) — obscures API, bypasses TS checking
- No sub-render methods (`renderXxx()`) inside component bodies → extract to a proper component or inline JSX

*Hook hygiene:*
- Side effects in render body (`setTimeout`, `setInterval`, subscriptions, DOM mutations outside `useEffect`) → must be inside `useEffect` with cleanup
- Every `useEffect` must have a comment describing its intent
- Deliberate dep array omissions must be commented inline explaining why
- `useMemo` on scalar values (string, number, boolean) → overhead not worth it; only for expensive calcs or reference stability
- `ref.current` captured at render time → must be read and null-checked at call time

*Component API:*
- Root element must not have external margins or positioning (`mt`, `mb`, `position: absolute`) — parent is responsible for layout
- Form input components must have `name`, `value`, `onChange` props; `onChange` must produce `{ target: { name, value } }`
- Props should be scalars — avoid passing full object refs when only 1-2 fields are needed

*Error handling & console hygiene:*
- `console.log`/`console.warn`/`console.error` in production-bound code → remove or route to Sentry
- `console.error` with no corresponding state update → errors must surface in UI
- Nested `try/catch` → prefer early returns for guards

*Naming conventions:*
- Files: `PascalCase` only for React components/classes; all others (`camelCase`)
- Callbacks: props use `on` prefix (`onSave`); internal handlers use `handle` prefix (`handleSave`)
- Predicates: functions returning `boolean` must read like a question (`isValid`, `hasPermission`)
- Test `describe()` blocks must match exact casing of the export being tested

*Code structure:*
- Pass-through wrapper functions (body is a single call with same args) → inline them
- Premature abstractions used in only one place → earn their place at two+ usages
- Component with 2+ files must live in its own folder with `index.ts` re-export

*Homebase-specific compliance:*
- `fe-design-base` only — no deprecated `src/components/`, no direct `@mui/material` / `@fortawesome` imports
- Interactive Designbase components missing `uxElement` prop → free auto-tracking, always add it
- UX tracking: use constants from `util/tracking_constants` (`PRODUCT_AREAS`, `EVENT_CATEGORIES`, `EVENT_ACTIONS`, `ACTION_TYPES`) — never destructure at top of file; reference as `PRODUCT_AREAS.SCHEDULING`
- Hardcoded UI strings without `toI18n()` → all user-visible strings must use translation keys
- Dynamic i18n key prefixes (`` toI18n(`${prefix}.key`) ``) → use full static paths instead
- Manual pluralization (`count !== 1 ? 's' : ''`) → use `_one`/`_other` keys with `count` via i18next
- `style={{}}` inline when a Designbase prop or `.scss` file could be used → only acceptable for truly dynamic values
- Raw pixel/rem numbers for spacing on Designbase component props (`p={8}`, `gap={16}`) → use design tokens (`'xs'`, `'sm'`, `'md'`, `'lg'`, `'xl'`, `'2xl'`)
- SCSS issues: `!important` usage, hardcoded hex colors (use `stylesheets/base/_colors.scss` variables), non-BEM class names
- Shared components (`shared/` or used across features) must not be connected to Redux
- Redux state: use Redux Toolkit slices — no Immutable.js patterns (`.get()`, `.set()`, `.toJS()`)
- Routing: use `AppRoute` and `LandingRoute` for new routes; no new Rails bridge methods; no new HAML root mounts

*Magic values (logic only — never flag CSS/style values):*
- Status strings, domain thresholds, multipliers used in conditions → extract to named constants
- CSS/style values (pixel numbers, spacing values, Box props like `minh={40}`) → NEVER flag or extract

---

**Test Coverage agent checklist:**
- React Testing Library exclusively (no Enzyme)
- Query priority: `getByRole` → `getByLabelText` → `getByText` → `getByTestId` (last resort)
- Async assertions use `findBy` or `waitFor`, not `act` workarounds
- Components using UX tracking wrapped in `UxRoot` / `withDesignBaseTheme` + `createFakeStore`
- `jest.clearAllMocks()` in `beforeEach`
- Happy path covered; major failure branches exercised (missing data, API failure, async rejection)
- No `given` in test descriptions — use `when`/`with`/`and`
- Tests assert actual behavior — watch for tests that pass while swallowing a failure
- `userEvent` over `fireEvent`

---

**Cleanup Opportunities agent checklist** (report as `severity: "info"`, `category: "cleanup"`):
- Unnecessary complexity or indirection
- Render logic that could be simplified
- State ownership that could be clarified
- Prop drilling reducible with context or Redux
- Duplicate JSX or logic extractable to a shared component (only when used 2+ places)
- Missing `useCallback` on callbacks passed to children or used as `useEffect` dependencies
- Legacy UI components (`Box`, `Text`, `Button`) imported from anywhere other than `fe-design-base/` — replace with Designbase equivalents when touched
- Import paths: unnecessarily long relative paths; paths that go up and back down through the same dir

### 5. Aggregate Findings

- Merge all JSON arrays into unified `FINDINGS`
- Deduplicate by `(file, line, category)` — keep the higher severity
- Sort: critical → warning → info; within info, bugs before design before compliance before cleanup
- Count: `CRITICAL_COUNT`, `WARNING_COUNT`, `INFO_COUNT`

### 6. PR Description Check (PR mode only)

Expected sections: `## Summary`, `## Why`, `## What Changed`, `## Acceptance Criteria`

Missing sections → add `severity: "warning"` / `category: "documentation"` finding.

If `TICKET_AVAILABLE=true` and description contains AC → compare diff against each criterion; unaddressed criteria → `severity: "info"` / `category: "requirements"` finding.

### 7. Present Summary

```
╔════════════════════════════════════════╗
║          FE REVIEW RESULTS             ║
╚════════════════════════════════════════╝

  🔴 Critical:  N    (bugs, crashes, broken behavior)
  🟡 Warning:   N    (design issues, compliance violations)
  🔵 Info:      N    (conventions, cleanup opportunities)

  Cleanup opportunities: N suggestion(s) [High impact: X, Medium: Y, Polish: Z]
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
  🔵 [INFO]     Line {line} | {category} — {description}
```

After presenting the full report, ask:
1. "Would you like me to go ahead and implement the changes?"
2. "Would you prefer I pause after each change, or implement everything at once?"

Wait for the user's answer before touching any file.

### 9. Wrap-Up

```
FE Review Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Fixed:     X findings
Skipped:   Y findings
Remaining: Z findings

[If changes were made]: Don't forget to commit.
[If BACKEND_FILES > 0]: Run /be-review to cover backend changes.
Note: PRs in this flow stay as drafts — never mark ready for review through this skill.
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
