---
issue: "<issue-slug>"
milestone: "<milestone-slug>"
linear_issue_id: "<HRM-XXXX>"
linear_issue_url: "<https://linear.app/homebase/issue/HRM-XXXX>"
depends_on: []
approved: false
---

# Requirements — <Issue Title>

## Context

| Field | Value |
|-------|-------|
| Milestone | `<milestone-slug>` |
| Target repo | `<absolute path>` |
| Linear issue | [HRM-XXXX](<URL>) — <title> |
| Intake source | [Figma](<URL>) / [Recording](<path>) |
| Depends on | <`issue-slug` or "none"> |

---

## User Stories

> Format: As a [role], I want [capability], so that [outcome].

- As a **<role>**, I want **<capability>**, so that **<outcome>**.
- As a **<role>**, I want **<capability>**, so that **<outcome>**.

---

## Acceptance Criteria

> Format: EARS-style — "When [trigger], the system shall [behavior]."
> Group by subsystem or surface. Number each AC.

### <Subsystem A>

- **AC-1.1:** When <trigger>, the system shall <behavior>.
- **AC-1.2:** When <trigger>, the system shall <behavior>.

### <Subsystem B>

- **AC-2.1:** When <trigger>, the system shall <behavior>.
- **AC-2.2:** When <trigger>, the system shall <behavior>.

---

## Edge Cases & Error States

> Minimum 3 entries required. `spec-audit` blocks specs with fewer.

| # | Scenario | Expected behavior |
|---|----------|------------------|
| E-1 | Network request fails | Show inline error message; form remains in its current state |
| E-2 | User submits with empty required field | Field-level validation error appears; form does not submit |
| E-3 | User navigates away mid-form | <unsaved changes behavior — confirm or auto-save?> |
| E-4 | Session expires mid-interaction | Redirect to login; return URL preserved |
| E-5 | <Permission/role edge case> | <Expected behavior> |

---

## Non-Goals & Constraints

> Stated as testable constraints — "this issue shall not change X."

- **This issue shall not change** the submit payload shape defined at `<file:line>`
- **This issue shall not change** required field validation logic at `<file:line>`
- **This issue shall not change** the existing routing at `<file:line>`
- <Additional non-goal>

---

## States to Cover

| Surface | States |
|---------|--------|
| <Surface A> | loading, empty, populated, error |
| <Surface B> | loading, populated |
| <Form> | pristine, dirty, submitting, success, error |

---

## Eventing

| Event name | When fired | Payload fields |
|-----------|-----------|----------------|
| `<event_name>` | When user <action> | `{ field1, field2 }` |

---

## Open Questions

| # | Question | Default if unresolved |
|---|----------|----------------------|
| Q-1 | <Question> | <Default> |
