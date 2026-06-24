---
issue: "01-child-page-route-shell"
milestone: "m1-port-add-team"
linear_issue_id: "TBD — create in Linear before building"
linear_issue_url: "TBD"
depends_on: []
approved: false
---

# Requirements — Child Page Route Shell

## Context

| Field | Value |
|-------|-------|
| Milestone | `m1-port-add-team` |
| Target repo | `/Users/fbarbosa/Documents/Homebase1` |
| Linear issue | TBD — proposed under M1 "Port Add Team to new Child Page" |
| Intake source | [Figma — New Hire Packets — Documents](https://www.figma.com/design/HSvGEOyEmuDtUGcpOQ8Xpy/New-Hire-Packets---Documents) |
| Depends on | none |

---

## User Stories

- As an **OAM**, I want the "Add Team Member" experience to open as a full page instead of a drawer, so that there is enough screen real estate to display both contact/job details and an inline packet configuration panel.
- As an **OAM**, I want a back button at the top of the page, so that I can return to the Team Roster without completing the form.
- As an **engineer**, I want the new page to be gated behind a feature flag, so that the existing drawer flow continues to work for all users until the new experience is QA-approved.

---

## Acceptance Criteria

### Route registration

- **AC-1.1:** When the route `/team/add` is visited, the system shall render the `AddTeamPage` component.
- **AC-1.2:** The `/team/add` route shall be registered inside the `<Switch>` at `client/src/initializers/Routes.jsx:646`, before the `/team/:userId` catch-all at line 703, so that it matches before the dynamic segment.
- **AC-1.3:** The route shall be `exact` so that `/team/add/anything` does not match.

### Feature flag gate

- **AC-2.1:** When `getRolloutEnabled(state, 'packet_config_add_team_page')` returns `true`, the `openAddTeamDrawer` action shall navigate to `/team/add` instead of opening the `ADD_TEAM_INDIVIDUAL_DRAWER`.
- **AC-2.2:** When the flag is `false` (default), behavior shall be identical to the current implementation: `openAddTeamDrawer` opens the drawer at `client/src/features/addTeam/AddIndividualDrawer/AddIndividualDrawer.jsx`.
- **AC-2.3:** The flag gate shall live in the thunk that dispatches `openAddTeamDrawer` (in `client/src/actions/addTeam.js`), not in individual callsites.

### Page shell layout

- **AC-3.1:** The page shall render a sticky header containing: a back-chevron `IconButton` on the left and the title `toI18n('add_team.individual_drawer.title')` centered/left.
- **AC-3.2:** When the back button is clicked, the system shall call `history.goBack()` (using `useHistory` from react-router-dom).
- **AC-3.3:** The page shall render a scrollable content area below the header. In this issue, the content area renders a single placeholder `<Box>` with data-testid `"add-team-page-content"`.
- **AC-3.4:** The page shall render a sticky footer area. In this issue, the footer renders a placeholder `<Box>` with data-testid `"add-team-page-footer"`.
- **AC-3.5:** The page shell shall be a TypeScript functional component. No class components.

### Authentication / access control

- **AC-4.1:** The `/team/add` route shall live inside the `<SessionGate>` wrapper (already present in the routes file at line ~510) so that unauthenticated users are redirected to login.

---

## Edge Cases & Error States

| # | Scenario | Expected behavior |
|---|----------|------------------|
| E-1 | User navigates to `/team/add` with feature flag OFF | The route still exists (it's registered unconditionally); the flag only controls whether the CTA navigates there or opens the drawer |
| E-2 | User directly types `/team/add` in the URL bar when flag is OFF | The AddTeamPage renders (flag only gates the CTA, not the route itself); this is acceptable for M1 since the CTA won't navigate here |
| E-3 | User clicks browser back button from `/team/add` | `history.goBack()` returns to previous page (usually `/team`) — same behavior as back `IconButton` |
| E-4 | Unauthenticated user visits `/team/add` | `SessionGate` redirects to login; return URL is preserved |
| E-5 | Mobile/tablet viewport | Page should be responsive; the existing `useIsMediumScreen` / `useIsLargeScreen` hooks from `fe-design-base/utils/useMediaQuery` may be used for layout adjustments |

---

## Non-Goals & Constraints

- **This issue shall not add** the contact information form fields — that is `02-contact-information-card`.
- **This issue shall not add** the job details form fields — that is `03-job-details-card`.
- **This issue shall not add** the submit CTA logic — that is `04-submit-and-branching`.
- **This issue shall not change** the `ADD_TEAM_INDIVIDUAL_DRAWER` component or its state machine at `client/src/features/addTeam/AddIndividualDrawer/AddIndividualDrawer.jsx`.
- **This issue shall not change** the submit payload shape defined at `client/src/features/addTeam/AddIndividualDrawer/helpers.ts:201-227`.
- **This issue shall not change** validation logic at `client/src/features/addTeam/AddIndividualDrawer/AddIndividualDrawer.jsx:112-125`.

---

## States to Cover

| Surface | States |
|---------|--------|
| `AddTeamPage` | loaded (flag on, page renders), fallback (route renders but CTA never navigates here when flag off) |
| Header | renders title + back button |
| Content area | placeholder visible |
| Footer area | placeholder visible |

---

## Eventing

> Events for the new page are scoped to `05-step1-eventing`. This issue does not fire Amplitude events.

| Event name | When fired | Payload fields |
|-----------|-----------|----------------|
| *(none in this issue)* | — | — |

---

## Open Questions

| # | Question | Default if unresolved |
|---|----------|----------------------|
| Q-1 | What is the canonical feature flag name for this project? | Use `packet_config_add_team_page` until confirmed with product/eng |
| Q-2 | Should the back button navigate to `/team` explicitly or use `history.goBack()`? | `history.goBack()` — preserves flexibility for callsites that navigate from non-team pages |
