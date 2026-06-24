---
project: "<project-slug>"
linear_project_url: "<URL>"
milestone: "<milestone-name>"
status: "draft"
---

# Project Spec — <Milestone Name>

## 1. Mission & Scope

**What this milestone accomplishes:**
<One paragraph describing the user-facing outcome and the engineering work required.>

**What this milestone does NOT do:**
- <Non-goal 1 — stated as a testable constraint>
- <Non-goal 2>
- <Non-goal 3>

---

## 2. Target Repo & Intake

| Field | Value |
|-------|-------|
| Target repo | `<absolute path>` |
| Primary intake | [Linear project](<URL>) |
| Figma | [<Label>](<URL>) |
| Recordings | <Label — path or URL> |
| Slack thread | [<Label>](<URL>) |

---

## 3. Architecture Constraints & Reuse

**Existing patterns to follow:**
- <Pattern or component that must be reused, with `file:line` citation>
- <Packwerk pack that owns this domain>

**Things NOT to change:**
- <Validation schema at `file:line`>
- <Submit payload shape — no field additions or removals>
- <Existing routing structure>

---

## 4. Issue Breakdown

> Each issue = one PR. Issues with >10 files must be split.

| # | Issue slug | Goal | Depends on | PR size | Status |
|---|-----------|------|------------|---------|--------|
| 01 | `01-<slug>` | <One-line goal> | — | S | `pending` |
| 02 | `02-<slug>` | <One-line goal> | `01` | M | `pending` |
| 03 | `03-<slug>` | <One-line goal> | `02` | S | `pending` |

**PR size guide:** S = 1–4 files, M = 5–8 files, L = 9–10 files (borderline — consider splitting)

---

## 5. Cross-cutting Requirements

> Every issue must respect these.

- **Feature flags:** all new surfaces gated behind `<flag_name>` (default: off)
- **i18n:** all user-visible strings via `toI18n()` — no hardcoded English
- **Eventing:** analytics events follow the pattern in `<file:line>`
- **Packwerk:** no cross-pack AR associations; cross-pack references use UUID
- **Testing:** every issue must cover happy path + at least the top 3 error states

---

## 6. Review / QA Rubric

The milestone is complete when:
- [ ] All issues are merged to the feature branch
- [ ] Combined test suite passes (tsc + jest + eslint)
- [ ] Each AC from Linear is covered by a spec and verifiable in the running app
- [ ] Feature flag toggled ON — no regressions on previously passing surfaces
- [ ] i18n: Spanish translation keys present for all new English keys
- [ ] No cross-pack Packwerk violations

---

## 7. Open Questions

| # | Question | Default if unresolved | Owner | Status |
|---|----------|----------------------|-------|--------|
| 1 | <Question> | <Default> | <Name> | `open` |

---

## 8. Appendix: AC Coverage

> Traceability: Linear AC → Issue spec

| Linear AC | Issue | Requirements section |
|-----------|-------|---------------------|
| <AC text> | `<slug>` | `requirements.md#section` |
