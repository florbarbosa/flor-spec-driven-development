---
issue: "04-submit-and-branching"
milestone: "m1-port-add-team"
linear_issue_id: "TBD — create in Linear before building"
linear_issue_url: "TBD"
depends_on: ["01-child-page-route-shell", "02-contact-information-card", "03-job-details-card"]
approved: false
---

# Requirements — Submit and Branching

## Context

| Field | Value |
|-------|-------|
| Milestone | `m1-port-add-team` |
| Target repo | `/Users/fbarbosa/Documents/Homebase1` |
| Linear issue | TBD — proposed under M1 "Port Add Team to new Child Page" |
| Intake source | [Figma — New Hire Packets — Documents](https://www.figma.com/design/HSvGEOyEmuDtUGcpOQ8Xpy/New-Hire-Packets---Documents) |
| Depends on | `01-child-page-route-shell`, `02-contact-information-card`, `03-job-details-card` |

---

## User Stories

- As an **OAM**, I want a "Save and Finish" button that adds the team member and closes the experience, so that I can quickly onboard someone without configuring their packet right now.
- As an **OAM**, I want a "Save and Add Another" button that adds the team member and resets the form, so that I can onboard multiple people back-to-back without leaving the page.
- As an **OAM** with payroll enrolled, I want a single "Continue" button that saves the team member and navigates to Step 2 (packet configuration), so that I can review the packet inline before sending it.

---

## Acceptance Criteria

### Footer CTA rendering

- **AC-1.1:** When `isPayrollEnrolled` is `false`, the footer shall render two buttons side by side: "Save and Finish" (secondary-blue) on the left and "Save and Add Another" (primary) on the right. This mirrors the existing non-payroll CTA layout at `FormView.tsx:240-292`.
- **AC-1.2:** When `isPayrollEnrolled` is `true`, the footer shall render a single "Continue" button (primary) right-aligned. This mirrors the existing payroll CTA layout at `FormView.tsx:211-238`.

### Disabled state

- **AC-2.1:** All CTAs shall be disabled when `isSubmitButtonDisabled(...)` returns `true`. The function is defined at `helpers.ts:123-147`. Inputs: `firstName`, `errors`, `isPayrollEnrolled`, `canRequestInformation`, `isEligibleForPayroll`, `invalidPayrollInfo`, `user`, `requestInformation`.
- **AC-2.2:** All CTAs shall show a loading spinner when `submitting` is `true`.

### "Save and Finish" behavior

- **AC-3.1:** When "Save and Finish" is clicked, the system shall call `createEmployee(userAndJobData(...))` via the existing `addTeamActions.createEmployee` (same action as `AddIndividualDrawer.jsx:370-402`).
- **AC-3.2:** On success, the system shall navigate to `/team` (or call `history.goBack()` if the referrer was not `/team`).
- **AC-3.3:** On success, the `fetchTeamReadiness` action shall be dispatched (same as `AddIndividualDrawer.jsx:456`).
- **AC-3.4:** On error, an inline error banner shall render at the top of the page with the error message from the API response.

### "Save and Add Another" behavior

- **AC-4.1:** When "Save and Add Another" is clicked, the system shall call `createEmployee(userAndJobData(...))`.
- **AC-4.2:** On success, the form shall be reset to `INIT_STATE` values so the OAM can immediately enter another team member. The page does not navigate away.
- **AC-4.3:** On error, same inline error banner as AC-3.4.

### "Continue" behavior (payroll-enrolled)

- **AC-5.1:** When "Continue" is clicked on a payroll-enrolled account, the system shall call `createEmployee(userAndJobData(...))`.
- **AC-5.2:** On success, the system shall navigate to `/team/add/packet` (the Step 2 route, introduced in M2). For M1, navigate to `/team` as a placeholder — this is a known temporary behavior, documented in the PR.
- **AC-5.3:** The `fetchTeamReadiness` action shall be dispatched on success.
- **AC-5.4:** On error, same inline error banner as AC-3.4.

### Form validation before submit

- **AC-6.1:** When a CTA is clicked, the system shall run full validation on all fields before dispatching `createEmployee`. If validation fails, all field-level errors are shown and the request is not made.

---

## Edge Cases & Error States

| # | Scenario | Expected behavior |
|---|----------|------------------|
| E-1 | API returns 422 with `errors` array | Show inline error banner at page top with joined error messages (matching existing `flashNotice.error` pattern at `AddIndividualDrawer.jsx:498`) |
| E-2 | Network timeout / 5xx | Show inline error banner; form remains unchanged; CTAs re-enabled |
| E-3 | `firstName` is empty when CTA clicked | Button is disabled (AC-2.1) — request is never made |
| E-4 | `isPayrollEnrolled=true` + `invalidPayrollInfo(user)=true` + `requestInformation=null` | "Continue" is disabled (existing logic in `isSubmitButtonDisabled` at `helpers.ts:143-147`) |
| E-5 | User clicks "Save and Add Another" then navigates away before the form resets | Form resets synchronously on success callback; no race condition expected |
| E-6 | `isEligibleForPayroll` is `false` (e.g. hire date missing for payroll-enrolled) | "Continue" is disabled (existing logic at `helpers.ts:144-145`) |

---

## Non-Goals & Constraints

- **This issue shall not change** `createEmployee` action at `client/src/actions/addTeam.js:118`.
- **This issue shall not change** `userAndJobData()` at `helpers.ts:201-227` or `jobAttributes()` at `helpers.ts:152-196`.
- **This issue shall not change** `isSubmitButtonDisabled()` at `helpers.ts:123-147`.
- **This issue shall not implement** the Step 2 page (`/team/add/packet`) — deferred to M2. The "Continue" CTA navigates to `/team` as a placeholder.
- **This issue shall not change** the existing `AddIndividualDrawer` submit flow.

---

## States to Cover

| Surface | States |
|---------|--------|
| Footer CTAs | non-payroll (two buttons), payroll-enrolled (one button) |
| CTA buttons | enabled (firstName filled, no errors), disabled (firstName empty or errors present), loading (submitting=true) |
| Submit flow | success-and-finish, success-and-add-another, success-and-continue, error (inline banner) |

---

## Eventing

| Event name | When fired | Payload fields |
|-----------|-----------|----------------|
| `SAVE_AND_CLOSE_CLICKED` | "Save and Finish" clicked | — (same event as `AddIndividualDrawer.jsx:527`) |
| `SAVE_AND_ADD_ANOTHER_CLICKED` | "Save and Add Another" clicked | — (same event as `AddIndividualDrawer.jsx:539`) |
| *(Step 2 CTA event TBD)* | "Continue" clicked | — (new event, scoped to `05-step1-eventing`) |

> Full event wiring is in `05-step1-eventing`. This issue wires only the two existing events already defined in `tracking_constants.ts`.

---

## Open Questions

| # | Question | Default if unresolved |
|---|----------|----------------------|
| Q-1 | Should error messages be surfaced as a `flashNotice` (toast) or as an inline error banner at the top of the page? | Inline error banner — full-page layout has more room; toast can be added later |
| Q-2 | After "Save and Finish" success, navigate to `/team` explicitly or `history.goBack()`? | Navigate to `/team` explicitly — more predictable than `goBack()` for callers that navigated from outside the team page |
