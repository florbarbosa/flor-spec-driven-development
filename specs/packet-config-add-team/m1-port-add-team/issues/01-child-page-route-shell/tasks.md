---
issue: "01-child-page-route-shell"
approved: false
---

# Tasks — Child Page Route Shell

## Build Steps

- [ ] **Step 1 — Create `AddTeamPage.tsx` shell**
  - File: `client/src/features/addTeam/AddTeamPage/AddTeamPage.tsx`
  - What to do: Create a TypeScript functional component. Render a full-height `Box` with three zones: a sticky header (`Box` with `row vcenter`), a scrollable content area (`Box flex1 overflow="auto"` with `data-testid="add-team-page-content"`), and a sticky footer (`Box` with `data-testid="add-team-page-footer"`). Header contains an `IconButton` (chevron-left, calls `history.goBack()` via `useHistory`) and a `Text` with `i18n="add_team.individual_drawer.title"`. Import all components from `fe-design-base`, NOT `components/`.

- [ ] **Step 2 — Create `index.ts` re-export**
  - File: `client/src/features/addTeam/AddTeamPage/index.ts`
  - What to do: `export { default } from './AddTeamPage';`

- [ ] **Step 3 — Register route in `Routes.jsx`**
  - File: `client/src/initializers/Routes.jsx`
  - What to do: Add `const LazyAddTeamPage = lazy(() => import('../features/addTeam/AddTeamPage'))` near `LazyTeamView` at line 108. Add `<Route exact path="/team/add" component={LazyAddTeamPage} />` inside the `<Switch>` at line 646, immediately before the `/team/:userId` route at line 703.

- [ ] **Step 4 — Gate `showIndividualDrawer` behind feature flag**
  - File: `client/src/actions/addTeam.js`
  - What to do: Import `getRolloutEnabled` from `selectors/session` and `browserHistory` from `util/router` (or use the history instance). In `showIndividualDrawer` (line 87), add: if `getRolloutEnabled(getState(), 'packet_config_add_team_page')`, call `history.push('/team/add')` and return early. Otherwise, proceed with existing drawer dispatch. Note: `showIndividualDrawer` is a thunk, so `getState` is available.

- [ ] **Step 5 — Write tests**
  - File: `client/src/features/addTeam/AddTeamPage/AddTeamPage.test.tsx`
  - Cover:
    - Renders the page title from i18n key `add_team.individual_drawer.title`
    - Renders `data-testid="add-team-page-content"` placeholder
    - Renders `data-testid="add-team-page-footer"` placeholder
    - Back button click calls `history.goBack()` (mock `useHistory`)

- [ ] **Step 6 — Verify**
  - `bun ts` (tsc --noEmit) — expect: no errors
  - `jest client/src/features/addTeam/AddTeamPage/AddTeamPage.test.tsx` — expect: all pass
  - Smoke check: navigate to `/team/add` in running app — page renders with title and back button

---

## Test Coverage Targets

**Happy path**
- [ ] Page renders with header title "Add Team Member" and back button
- [ ] Back button click triggers navigation (history.goBack)
- [ ] `add-team-page-content` and `add-team-page-footer` placeholders are present

**Error states**
- [ ] E-1: Feature flag OFF → `showIndividualDrawer` opens drawer as before (backward compatibility test for the thunk)
- [ ] E-4: Route is inside `SessionGate` — unauthenticated access redirects (manual verification in running app)

**Edge cases**
- [ ] E-2: Navigating directly to `/team/add` with flag OFF still renders the page (route is unconditional)
- [ ] E-3: Browser back button and the back `IconButton` both invoke `history.goBack()`

**Loading & empty states**
- [ ] N/A — page shell has no async data

**Tooling**
- [ ] `bun ts` passes
- [ ] `jest` suite passes
- [ ] `eslint` passes on changed files

---

## Self-Review Checklist

**Spec adherence**
- [ ] Every AC from `requirements.md` is addressed
- [ ] No scope creep — only the 5 files in `design.md` were touched
- [ ] All non-goals from `requirements.md` are still true — drawer component untouched
- [ ] No changes to validation schemas or submit payloads

**Code quality**
- [ ] All imports use `fe-design-base`, not deprecated `components/`
- [ ] `useHistory` from react-router-dom — not `browserHistory`
- [ ] `toI18n('add_team.individual_drawer.title')` via `Text i18n=` prop — no hardcoded English
- [ ] New page gated behind `packet_config_add_team_page` flag in `showIndividualDrawer`
- [ ] No `any` types on exported interfaces
- [ ] No `console.log`

**Tests**
- [ ] `useHistory` is mocked in tests (jest.mock('react-router-dom'))
- [ ] No hardcoded strings in assertions — use i18n key lookups or `data-testid`

**PR readiness**
- [ ] Total files changed = 5
- [ ] Branch: `fb/{ticket-id}-child-page-route-shell`
- [ ] Linear ticket linked via `hops linear`
- [ ] Draft PR opened

---

## Definition of Done

The issue is done when all build steps are checked, the page renders at `/team/add` with header + placeholder areas, the feature flag gates the CTA, all tests pass, and the draft PR has been opened with `/review-pr --auto-comment` findings posted.
