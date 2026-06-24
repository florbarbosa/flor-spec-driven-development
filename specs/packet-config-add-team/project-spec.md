---
project: "packet-config-add-team"
linear_project_url: "https://linear.app/joinhomebase/project/packet-configuration-streamline-how-packets-are-set-up-and-sent-during-54810b23e043"
status: "draft"
---

# Project Spec — Packet Configuration: Streamline Add Team

## 1. Mission & Scope

**What this project accomplishes:**
Replace the existing Add Team Member bottom-sheet drawer with a 2-step full-page flow. Step 1 collects identity and employment details. Step 2 surfaces the onboarding packet for inline configuration and preview before sending. OAMs can see and confirm exactly what's being sent without visiting a separate configuration page first.

**What this project does NOT do:**
- Document/packet lifecycle (status, send-after-hire, one-off packets) — sibling epic
- Role-based packet differentiation (different docs for cooks vs servers) — deferred to next iteration
- Send Test Email Modal — struck from scope (Section 5 removed)

---

## 2. Target Repo & Intake

| Field | Value |
|-------|-------|
| Target repo | `/Users/fbarbosa/Documents/Homebase1` |
| Primary intake | [Linear project](https://linear.app/joinhomebase/project/packet-configuration-streamline-how-packets-are-set-up-and-sent-during-54810b23e043) |
| Figma | [New Hire Packets — Documents](https://www.figma.com/design/HSvGEOyEmuDtUGcpOQ8Xpy/New-Hire-Packets---Documents) |

---

## 3. Architecture Constraints & Reuse

- Employer details side panel is the **existing component** from the New Hire Onboarding page — do not build a new one
- Employment type, access level, time off policies: preserve existing behavior and validation logic
- All new surfaces gated behind a feature flag (name TBD during grooming)
- Packwerk: HRM domain — packs/employee_onboarding/, packs/team/, packs/organization/
- All user-visible strings via `toI18n()` — Spanish translations required before release

---

## 4. Issue Breakdown

> Each issue = one PR. Issues with >10 files must be split.

| # | Issue slug | Goal | Milestone | Depends on | Status |
|---|-----------|------|-----------|------------|--------|
| — | `<TBD — run /spec-author to generate>` | | M1 | | pending |

---

## 5. Cross-cutting Requirements

- **Feature flag:** all new surfaces behind a flag (default: off)
- **i18n:** all user-visible strings via `toI18n()` — Spanish translations required
- **Eventing:** Amplitude events per section per the consolidated eventing spec (to be attached to Linear epic)
- **Observability:** Datadog instrumentation + Sentry error capture on new surfaces
- **No logic changes:** employment type rules, required field validation, submit payload shape — no changes unless spec explicitly says so
- **Packwerk:** no cross-pack AR associations; employer details side panel reused, not rebuilt

---

## 6. Review / QA Rubric

The project is complete when:
- [ ] All milestones merged to feature branch
- [ ] Combined test suite passes (tsc + jest + eslint)
- [ ] Each AC from Linear confirmed in running app
- [ ] Feature flag toggled ON — no regressions on Add Team flow
- [ ] Spanish translations present for all new English strings
- [ ] Amplitude events firing per eventing spec
- [ ] Datadog instrumentation live; Sentry capturing exceptions on new surfaces

---

## 7. Open Questions

> From Linear — resolve during grooming with design + engineering.

| # | Question | Owner |
|---|----------|-------|
| 1 | "Never sent" state treatment for Roster column (empty cell, dash, neutral placeholder?) | Design |
| 2 | Does Roster row kebab expose Send/Resend packet actions? | Product |
| 3 | Primary CTA copy: does it change between add-only and proceed-to-step-2 branch? | Design |
| 4 | Is Location read-only on Step 1, or do multi-location OAMs choose? | Product |
| 5 | "About you" — always included with no checkbox? | Design |
| 6 | Direct deposit — shown on all companies or payroll-only? | Engineering |
| 7 | Custom docs — reflect location from Step 1 or all OAM locations? | Product |
| 8 | Documents preview tab — does it update live as left-pane checkboxes change? | Design |
| 9 | If OAM proceeds with govt docs disabled (missing employer details) — block, warn, or send with custom only? | Product |

---

## 8. Appendix: AC Coverage

> To be filled in after `/spec-author` generates issue specs.

| Linear AC section | Issue slug | Status |
|------------------|-----------|--------|
| Roster: Onboarding Documents Column | TBD | pending |
| Step 1: Contact + Job Details | TBD | pending |
| Step 2: Embedded Packet Configuration | TBD | pending |
| Missing Employer Details (Empty State) | TBD | pending |
