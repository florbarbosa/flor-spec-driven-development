---
issue: "01-child-page-route-shell"
approved: false
---

# Design — Child Page Route Shell

## Component Map

| UI Element | Component | Tier | Source | Key Props | Notes / Surprises |
|-----------|-----------|------|--------|-----------|------------------|
| Back button | `IconButton` | MCP | `fe-design-base/molecules/IconButton` | `iconType="mdChevronLeft" onClick={handleBack}` | Replace deprecated `components/clickables/IconButton` used in existing drawer |
| Page title | `Text` | MCP | `fe-design-base/atoms/Text` | `variant="heading2" i18n="add_team.individual_drawer.title"` | Same i18n key as existing drawer title at `FormView.tsx:142-146` |
| Header container | `Box` | MCP | `fe-design-base/atoms/Box` | `row vcenter px={32} py={16}` sticky | New usage |
| Content area | `Box` | MCP | `fe-design-base/atoms/Box` | `flex1 overflow="auto"` | Scrollable; will host cards in issues 02-03 |
| Footer container | `Box` | MCP | `fe-design-base/atoms/Box` | `row hright px={32} py={16}` sticky | Will host CTAs in issue 04 |

---

## File Plan

| Action | File path | Purpose |
|--------|-----------|---------|
| create | `client/src/features/addTeam/AddTeamPage/AddTeamPage.tsx` | New full-page shell component |
| create | `client/src/features/addTeam/AddTeamPage/AddTeamPage.test.tsx` | Tests for shell: back button, header title, placeholder areas |
| create | `client/src/features/addTeam/AddTeamPage/index.ts` | Re-export `AddTeamPage` as default |
| modify | `client/src/initializers/Routes.jsx` | Add lazy import + `<Route exact path="/team/add">` before `/team/:userId` |
| modify | `client/src/actions/addTeam.js` | Gate `showIndividualDrawer` / `openAddTeamDrawer` behind feature flag; navigate to `/team/add` when flag is on |

**Total: 5 files** ✓

---

## Routing & Mounting

- **Route:** `/team/add` — registered at `client/src/initializers/Routes.jsx:693` (before the `/team/:userId` route at line 703)
- **Feature flag:** `packet_config_add_team_page` — read via `getRolloutEnabled(state, 'packet_config_add_team_page')` at `client/src/selectors/session.js` (same pattern as `hiring_job_drawer` used at `AddIndividualDrawer.jsx:137`)
- **Mount point:** Inside the `<Switch>` at `Routes.jsx:646`, wrapped by `<SessionGate>` (already present for all routes in this block)
- **Navigation:** Back button calls `history.goBack()` via `useHistory` from `react-router-dom` (per `client/CLAUDE.md` routing convention)
- **Lazy import:** Add `const LazyAddTeamPage = lazy(() => import('../features/addTeam/AddTeamPage'))` near `LazyTeamView` at `Routes.jsx:108`

---

## State & Data

### Data sources

| Data | Source | Shape | File:line |
|------|--------|-------|-----------|
| Feature flag value | Redux — `getRolloutEnabled(state, 'packet_config_add_team_page')` | `boolean` | `client/src/selectors/session.js` (same selector pattern as `AddIndividualDrawer.jsx:24+137`) |
| Navigation history | React Router — `useHistory()` | `History` | react-router-dom |

### Loading / error handling

- This issue introduces a shell with no async data fetching. Loading and error states are not applicable yet.

### Form state (if applicable)

- No form state in this issue. The page shell is layout-only for M1 Issue 01.

---

## Feature Flag

| Field | Value |
|-------|-------|
| Flag name | `packet_config_add_team_page` |
| Default | `false` (off) |
| Defined at | Rails rollout flag — confirm exact name with engineering before building |
| Rollout plan | Enable in staging first; production after M1 QA sign-off |

---

## Eventing

> Deferred to `05-step1-eventing`.

---

## i18n

| Key | Default English value |
|-----|-----------------------|
| `add_team.individual_drawer.title` | `"Add Team Member"` — already defined; used at `FormView.tsx:142-146` |

---

## Risks & Assumptions

| # | Risk / Assumption | Mitigation |
|---|------------------|------------|
| R-1 | The `/team/add` route must be registered before `/team/:userId` at `Routes.jsx:703` or it will be swallowed by the dynamic segment | Verified: new route uses `exact` and is placed at line ~693 before line 703 |
| R-2 | `openAddTeamDrawer` is called from multiple callsites (timesheets, payroll, quick start guide) — gating in `actions/addTeam.js` may not gate all of them | `openAddTeamDrawer` from `features/team/slice.js` is also dispatched directly. The thunk at `actions/addTeam.js:87` is the primary OAM entry point. Other callsites (FTU timesheets, PayrollTeamMembersDrawer) should be left unchanged in M1. |
| R-3 | `getRolloutEnabled` reads from the session — if the feature flag is not set up in Rails before dev begins, the flag returns `false` and the page is never navigated to | Acceptable default behavior — drawer flow continues as-is |
