---
issue: "05-step1-eventing"
milestone: "m1-port-add-team"
linear_issue_id: "TBD — create in Linear before building"
linear_issue_url: "TBD"
depends_on: ["01-child-page-route-shell", "04-submit-and-branching"]
approved: false
---

# Requirements — Step 1 Eventing

## Context

| Field | Value |
|-------|-------|
| Milestone | `m1-port-add-team` |
| Target repo | `/Users/fbarbosa/Documents/Homebase1` |
| Linear issue | TBD — proposed under M1 "Port Add Team to new Child Page" |
| Intake source | [Figma — New Hire Packets — Documents](https://www.figma.com/design/HSvGEOyEmuDtUGcpOQ8Xpy/New-Hire-Packets---Documents) |
| Depends on | `01-child-page-route-shell`, `04-submit-and-branching` |

---

## User Stories

- As a **product analyst**, I want Amplitude events to fire when OAMs interact with the new Add Team Step 1 page, so that I can measure adoption, funnel conversion, and drop-off rates.

---

## Acceptance Criteria

### Page shown event

- **AC-1.1:** When the `AddTeamPage` mounts (i.e., `useEffect` with empty deps array), the system shall fire an Amplitude event `ADD_TEAM_PAGE_SHOWN` with payload `{ product_area: PRODUCT_AREAS.TEAM }`. This replaces `ADD_TEAM_DRAWER_SHOWN` which is fired at `AddIndividualDrawer.jsx:219-221`.
- **AC-1.2:** The existing `ADD_TEAM_DRAWER_SHOWN` event on the drawer component shall remain unchanged — it fires when the drawer opens, which still happens when the flag is off.

### CTA click events (already partially in issue 04)

- **AC-2.1:** "Save and Finish" click shall fire `EVENT_ACTIONS.SAVE_AND_CLOSE_CLICKED` (already defined at `tracking_constants.ts:548` area — verify exact key name via grep). This AC ensures the event is wired in `AddTeamPage.tsx` using `trackUxEvent`.
- **AC-2.2:** "Save and Add Another" click shall fire `EVENT_ACTIONS.SAVE_AND_ADD_ANOTHER_CLICKED`. Same as above.
- **AC-2.3:** "Continue" click (payroll enrolled) shall fire a new event `ADD_TEAM_CONTINUE_CLICKED` with payload `{ product_area: PRODUCT_AREAS.TEAM }`.
- **AC-2.4:** Back button click shall fire a new event `ADD_TEAM_BACK_CLICKED` with payload `{ product_area: PRODUCT_AREAS.TEAM }`.

### Close / abandon events

- **AC-3.1:** When the OAM navigates away from `/team/add` without submitting (via browser back, back button, or direct URL change), no additional abandonment event shall be fired in M1. (Leave a TODO comment for future implementation.)

### New event constants

- **AC-4.1:** New event action constants `ADD_TEAM_PAGE_SHOWN`, `ADD_TEAM_CONTINUE_CLICKED`, `ADD_TEAM_BACK_CLICKED` shall be added to `client/src/util/tracking_constants.ts`.
- **AC-4.2:** The event constants shall follow the existing naming convention: string values matching the constant names with spaces (e.g., `ADD_TEAM_DRAWER_SHOWN = 'Add Team Drawer Shown'` at `tracking_constants.ts:548`).

---

## Edge Cases & Error States

| # | Scenario | Expected behavior |
|---|----------|------------------|
| E-1 | `ADD_TEAM_PAGE_SHOWN` fires but `trackUxEvent` throws | Event failure shall not affect the page render — wrap in try/catch or rely on `trackUxEvent` internal error handling |
| E-2 | OAM refreshes the page (re-mounts `AddTeamPage`) | `ADD_TEAM_PAGE_SHOWN` fires again — this is expected and consistent with how the drawer event works |
| E-3 | Feature flag is OFF — user navigates to `/team/add` directly | `ADD_TEAM_PAGE_SHOWN` still fires if the page renders; this is acceptable since the page renders unconditionally |
| E-4 | Multiple fast clicks on a CTA | Each click fires an event; no debounce needed — consistent with existing drawer behavior |

---

## Non-Goals & Constraints

- **This issue shall not change** the existing `ADD_TEAM_DRAWER_SHOWN` event at `AddIndividualDrawer.jsx:219-221`.
- **This issue shall not add** events to `AddIndividualDrawer.jsx` — only the new `AddTeamPage` tracking.
- **This issue shall not instrument** form field changes (e.g., typing in firstName) — too granular for M1.
- **This issue shall not add** Datadog or Sentry instrumentation — deferred to post-M1 observability work.

---

## States to Cover

| Surface | States |
|---------|--------|
| `AddTeamPage` mount | `ADD_TEAM_PAGE_SHOWN` fires exactly once on mount |
| "Save and Finish" | `SAVE_AND_CLOSE_CLICKED` fires on click |
| "Save and Add Another" | `SAVE_AND_ADD_ANOTHER_CLICKED` fires on click |
| "Continue" | `ADD_TEAM_CONTINUE_CLICKED` fires on click |
| Back button | `ADD_TEAM_BACK_CLICKED` fires on click |

---

## Eventing

| Event name | When fired | Payload fields |
|-----------|-----------|----------------|
| `ADD_TEAM_PAGE_SHOWN` | `AddTeamPage` mounts | `{ product_area: PRODUCT_AREAS.TEAM }` |
| `SAVE_AND_CLOSE_CLICKED` | "Save and Finish" clicked | `{}` |
| `SAVE_AND_ADD_ANOTHER_CLICKED` | "Save and Add Another" clicked | `{}` |
| `ADD_TEAM_CONTINUE_CLICKED` | "Continue" clicked | `{ product_area: PRODUCT_AREAS.TEAM }` |
| `ADD_TEAM_BACK_CLICKED` | Back button clicked | `{ product_area: PRODUCT_AREAS.TEAM }` |

---

## Open Questions

| # | Question | Default if unresolved |
|---|----------|----------------------|
| Q-1 | Should `ADD_TEAM_PAGE_SHOWN` also include `event_category: EVENT_CATEGORIES.ADD_TEAM`? | Yes — check existing category constants in `tracking_constants.ts`; use `EVENT_CATEGORIES.ADD_TEAM` if it exists, otherwise use `PRODUCT_AREAS.TEAM` only |
| Q-2 | Do product/analytics have a tracking doc for this project with predefined event names? | Use the naming convention above until analytics provides a spec |
