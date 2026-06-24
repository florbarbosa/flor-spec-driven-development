---
issue: "<issue-slug>"
approved: false
---

# Tasks — <Issue Title>

## Build Steps

> Follow in order. Each step is independently verifiable. Real file paths required.

- [ ] **Step 1 — <Describe>**
  - File: `<path>`
  - What to do: <Concrete description — component name, props, behavior>

- [ ] **Step 2 — <Describe>**
  - File: `<path>`
  - What to do: <Concrete description>

- [ ] **Step 3 — <Describe>**
  - File: `<path>`
  - What to do: <Concrete description>

- [ ] **Step 4 — Write tests**
  - File: `<path>.test.tsx` / `<path>_spec.rb`
  - Cover: happy path, error state, <specific edge case from requirements>

- [ ] **Step 5 — Verify**
  - `tsc --noEmit` — expect: no errors
  - `jest <path>` — expect: all pass
  - `eslint <changed files>` — expect: no errors
  - *(submit surface only)* Run app, submit with valid data → confirm network call fires

---

## Test Coverage Targets

> Every item must be explicitly covered. `spec-audit` checks this list against the edge cases in `requirements.md`.

**Happy path**
- [ ] <Describe the primary success flow — what the user does and what they see>

**Error states**
- [ ] E-1: Network failure → inline error message shown, form unchanged
- [ ] E-2: Required field empty → field-level validation error, form does not submit
- [ ] E-3: <Error state from requirements.md> → <expected behavior>

**Edge cases**
- [ ] E-4: <Edge case from requirements.md> → <expected behavior>
- [ ] E-5: <Edge case from requirements.md> → <expected behavior>

**Loading & empty states**
- [ ] Loading state renders while data is fetching
- [ ] Empty state renders when data returns empty

**Tooling**
- [ ] `tsc --noEmit` passes
- [ ] `jest` suite passes (new tests + any regressing existing suites)
- [ ] `eslint` / `stylelint` passes on changed files
- [ ] *(submit surface only)* Real unmocked submit verified in running app

---

## Self-Review Checklist

**Spec adherence**
- [ ] Every AC from `requirements.md` is addressed
- [ ] No scope creep — only files in `design.md` file plan were touched
- [ ] All non-goals from `requirements.md` are still true
- [ ] No changes to validation schemas or submit payloads unless the spec says so

**Code quality**
- [ ] No invented component APIs — resolved via Designbase MCP or source
- [ ] All user-visible strings use `toI18n()` — no hardcoded English
- [ ] New surfaces gated behind the feature flag from `design.md`
- [ ] No `any` types on exported interfaces
- [ ] No `console.log` left in production-bound code

**Tests**
- [ ] No mocked fixtures for validation tests — tested against real validation schemas
- [ ] *(submit surface)* Real unmocked submit confirmed in running app
- [ ] No tests that pass while swallowing a failure (e.g. asserting a callback was called but not checking what it was called with)

**PR readiness**
- [ ] Total files changed ≤ 10 (if not, something went wrong — see `spec-audit`)
- [ ] Branch name: `{initials}/{ticket-id}-{slug}`
- [ ] Linear ticket will be linked via `hops linear`
- [ ] Draft PR body will include spec link + review findings + test plan

---

## Definition of Done

The issue is done when all build steps are checked, all test coverage targets pass, the self-review checklist is clean, and the draft PR has been opened with `/review-pr --auto-comment` findings posted.
