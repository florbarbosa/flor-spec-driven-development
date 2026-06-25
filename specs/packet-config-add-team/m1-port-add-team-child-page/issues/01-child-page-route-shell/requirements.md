---
issue: "01-child-page-route-shell"
milestone: "m1-port-add-team-child-page"
linear_issue_id: "HRM-3221"
linear_issue_url: "https://linear.app/joinhomebase/issue/HRM-3221"
depends_on: []
approved: true
---

# Requirements — Add Team Child Page: Route & Shell

## Context

| Item | Detail |
|------|--------|
| Current behaviour | "Add Team" is a bottom-sheet drawer rendered globally via `GlobalComponents.tsx:167`. It opens via `openAddTeamDrawer()` dispatched by `showAddEmployeeModal()` (`actions/addTeam.js:169-171`). Five entry points across three pages trigger it. |
| Target behaviour | A feature-flagged full-page route at `/team/add` replaces the drawer as the entry surface. The page renders a page header (title + back-link) and a sticky footer (Cancel + primary CTA). The form card area is a placeholder in this issue. The drawer remains live for users where the flag is off. |
| Flag off | All five entry points call `showAddEmployeeModal()` exactly as today — no behavioural change. |
| Flag on | All five entry points navigate to `/team/add` instead. |
| Out of scope | Any form fields, validation, submit logic, or removal of the existing drawer code. |

---

## User Stories

**US-1 — Roster owner opens Add Team from the Roster header (AddTeamMemberButton)**
As an owner on the Roster page, when I click "Add team member", I am taken to the Add Team full page instead of a drawer (when the flag is on).

**US-2 — Roster owner opens Add Team from the second Roster header button (AddEmployeesButton)**
As an owner on the Roster page, when I click the secondary "Add employees" button, I am taken to the Add Team full page instead of a drawer (when the flag is on).

**US-3 — Manager opens Add Team from Schedule Builder employee row (AddEmployee)**
As a manager in the Schedule Builder, when I click "Add employee", I am taken to the Add Team full page instead of a drawer (when the flag is on).

**US-4 — Manager opens Add Team from Schedule Builder ToolsMenu (MenuDropDown)**
As a manager in the Schedule Builder, when I click the Tools menu add-employee item, I am taken to the Add Team full page instead of a drawer (when the flag is on).

**US-5 — Manager opens Add Team from Timesheets (AddEmployeeRow)**
As a manager on the Timesheets page, when I click the add-employee row link, I am taken to the Add Team full page instead of a drawer (when the flag is on).

**US-6 — User navigates back from the Add Team page**
As a user on the Add Team page, when I click the back-link in the page header or the Cancel button in the footer, I am returned to the page I came from (or `/team` as fallback).

**US-7 — Flag-off path is unchanged**
As a user whose account does not have the flag enabled, clicking any of the five entry points opens the existing bottom-sheet drawer — no regression.

---

## Acceptance Criteria (EARS format)

### Subsystem: Feature Flag

**AC-1** WHEN the `add_team_child_page` rollout is inactive, THEN all five entry point components call `showAddEmployeeModal({ calledFrom })` as they do today — no routing occurs.

**AC-2** WHEN the `add_team_child_page` rollout is active, THEN each entry point navigates to `/team/add` instead of dispatching `openAddTeamDrawer`.

### Subsystem: Route Registration

**AC-3** The route `/team/add` MUST be registered inside the authenticated `<SessionGate>` block in `Routes.jsx`, **before** the existing `<Route exact path="/team" component={LazyTeamView} />` entry so it takes precedence in the `<Switch>`.

**AC-4** The route component MUST be lazy-loaded (consistent with all other routes in `Routes.jsx`).

### Subsystem: Page Shell

**AC-5** The page MUST render a sticky header at the top containing:
- The page title "Add team member" (i18n key: `new_team_page.title`)
- An `AppBackLink` with `fallbackLinkTo="/team"` that resolves to the previous page via `LastPageContext`

**AC-6** The page MUST render a sticky footer at the bottom containing:
- A "Cancel" secondary button (i18n key: `new_team_page.cancel`) that navigates back to the previous page (or `/team` as fallback) without submitting
- A primary CTA button "Add team member" (i18n key: `new_team_page.submit`) that is `disabled` in this issue (placeholder; form not yet wired)

**AC-7** The main content area between header and footer MUST render a placeholder card element (e.g. an empty `Box`) in lieu of form fields. This placeholder is replaced by subsequent issues.

**AC-8** The page layout MUST occupy the full viewport height with the header and footer remaining visible without scrolling away (sticky/fixed positioning or flex column with `minHeight: 100vh` approach, consistent with other full-page forms in the codebase).

### Subsystem: Entry Point Wiring

**AC-9** `AddTeamMemberButton.jsx` (`client/src/features/teamView/TeamView/TeamHeader/ActionButtons/AddTeamMemberButton/AddTeamMemberButton.jsx`) — when the flag is on and enforcement/PayAnywhere checks do not intercept, `handleAddNew` MUST call `history.push('/team/add')` (or equivalent navigation) instead of `onShowAddEmployeeModal`.

**AC-10** `AddEmployeesButton.jsx` (`client/src/features/teamView/TeamView/TeamHeader/AddEmployeesButton/AddEmployeesButton.jsx`) — same wiring requirement as AC-9.

**AC-11** `AddEmployee.jsx` (`client/src/features/scheduleBuilder/ScheduleBuilderView/EmployeeWeekView/AddEmployee.jsx`) — when the flag is on, the non-embedded path MUST navigate to `/team/add` instead of calling `onAddEmployee()`.

**AC-12** `MenuDropDown.jsx` (`client/src/features/scheduleBuilder/ScheduleBuilderView/Header/ToolsMenu/MenuDropDown.jsx`) — when the flag is on, the "add employee" menu item MUST navigate to `/team/add` instead of dispatching `showAddEmployeeModal`.

**AC-13** `AddEmployeeRow.jsx` (`client/src/features/timesheets/TimesheetsPage/PayPeriodReviewView/TimesheetsTable/TableRows/AddEmployeeRow.jsx`) — when the flag is on and not embedded, `handleClick` MUST navigate to `/team/add` instead of calling `showAddEmployeeModal`.

**AC-14** Entry points where an enforcement dialog or PayAnywhere intercept applies MUST continue to show those dialogs/modals regardless of flag state — the flag only controls the happy path.

**AC-15** The embedded path in `AddEmployee.jsx` (Clover `postMessage` branch), the render-level early return at line 60 in `AddEmployeeRow.jsx` (`if (isEmbedded) return <Box ... />`) — this is outside `handleClick`, unlike `AddEmployee.jsx` and `MenuDropDown.jsx` which use `handleClick` guards — AND the embedded path in `MenuDropDown.handleAddEmployee` MUST be unaffected by the flag.

---

## Edge Cases

**EC-1 — Direct URL navigation when flag is off**
If a user who does not have the flag navigates directly to `/team/add` (e.g. via a bookmark), the route simply does not exist and React Router's `<Switch>` will fall through. The fallback must not crash the app — confirm via test that unregistered routes render nothing / the default redirect rather than an error boundary.

**EC-2 — Enforcement dialog intercepts before navigation**
When `shouldShowEnforcementDialog` is `true`, the entry point should show the enforcement dialog and NOT navigate to `/team/add`. The flag check must come after (or be short-circuited by) the enforcement guard, not before it.

**EC-3 — PayAnywhere warning modal intercept**
When `locationIsPayAnywhere && !isIntegratedPayrollPartner` is true (AddTeamMemberButton and AddEmployeesButton), the PayAnywhere warning modal must show and navigation to `/team/add` must NOT occur — regardless of flag state.

**EC-4 — Embedded Clover context in Schedule Builder**
`AddEmployee.jsx` contains a special `getIsEmbedded()` branch that posts a `postMessage` to the Clover parent. When embedded, this branch MUST execute as today; the flag must only affect the non-embedded path.

**EC-5 — Back navigation preserves context**
`AppBackLink` relies on `LastPageContext`. If `LastPageContext.previousFullPath` is null (e.g. user landed directly on `/team/add` via a fresh tab), the back-link and Cancel button MUST fall back to `/team` without throwing.

---

## Non-Goals & Constraints

- The existing `AddTeamDrawer` component is NOT removed or modified.
- No form fields, validation, or submit logic is implemented in this issue.
- The `DrawerHeader` and `DrawerFooter` components used by the drawer are NOT reused in the page — the page uses `Box` + `Text` + `Button` + `AppBackLink` directly.
- No changes to the Redux slice (`features/team/slice.js`) are needed in this issue.
- The page does not need to handle the `onCloseDrawerCallback`, `currentTeamMember`, `completionEventName`, or `showSuccessModal` props that the drawer accepts — those are future issues.

---

## States to Cover

| State | Description |
|-------|-------------|
| Flag off | All entry points behave as today; `/team/add` route does not exist |
| Flag on, happy path | Entry points navigate to `/team/add`; page renders header + footer + placeholder |
| Enforcement intercept | Enforcement dialog shown; no navigation |
| PayAnywhere intercept | PayAnywhere modal shown; no navigation |
| Embedded context | Clover postMessage fires; no navigation |
| Back-link with history | AppBackLink resolves to previous page |
| Back-link without history | AppBackLink falls back to `/team` |
| Direct URL to `/team/add` when flag is off | Route not registered; no crash |

---

## Eventing

No new UX events are introduced in this issue. Existing tracking calls in each entry point (`trackUxEvent`, `useTrackUx`) MUST be preserved and MUST fire before the routing decision is made — the tracking call precedes the flag branch.

A follow-on issue (HRM-3224, Amplitude Eventing) will add page-view and CTA events for the new page.

---

## Open Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| 1 | What is the exact Flipper/rollout key name for the flag? (This spec uses `add_team_child_page` as a placeholder.) | BE / infra | Open |
| 2 | Does the page title change if the user is editing/rehiring an existing team member (not just adding)? AddTeamDrawerContainer supports edit mode via `currentTeamMember`. Not needed for this shell issue but should be confirmed before HRM-3222. | Product | Open |
| 3 | Should `/team/add` be excluded from the BrowserHistory enforcement check at `BrowserHistory.jsx:20` (`isEnforcedPathname`)? Currently `/team` is excluded but `/team/add` would match the `startsWith('/team')` guard — likely fine as-is, confirm. | FE | Open |
