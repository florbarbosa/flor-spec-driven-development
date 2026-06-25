---
issue: "01-child-page-route-shell"
approved: true
---

# Design — Add Team Child Page: Route & Shell

## Component Map

All components below are verified to exist in the target repo.

| Component | Import path | Usage in this issue |
|-----------|-------------|---------------------|
| `Box` | `fe-design-base/atoms/Box` | Page layout wrapper, header bar, footer bar, content area placeholder. Verified at `client/lib/fe-design-base/atoms/Box/Box.tsx`. |
| `Text` | `fe-design-base/atoms/Text` | Page title "Add team member" in header. `variant="heading2"` (mirrors `DrawerHeader.jsx:46`). Verified at `client/lib/fe-design-base/atoms/Text/Text.tsx`. |
| `Button` | `fe-design-base/molecules/Button` | Footer Cancel (`variant="secondary"`) and primary CTA (`variant="primary"`, `disabled`). Props: `variant`, `disabled`, `onClick`, `children`. Verified at `client/lib/fe-design-base/molecules/Button/Button.tsx:22-56`. |
| `AppBackLink` | `features/navigation/BackLink` (default export) | Back-link in page header. Props: `fallbackLinkTo="/team"`, `dataTestId`. Verified at `client/src/features/navigation/BackLink/AppBackLink.tsx`. Wraps `fe-design-base/organisms/BackLink` (verified at `client/lib/fe-design-base/organisms/BackLink/BackLink.tsx`). |
| `useHistory` | `react-router-dom` | Navigation in entry points (`history.push('/team/add')`). Used throughout the codebase (e.g. `client/src/features/timesheets/TimesheetsPage/TimesheetsTabNav/TimesheetsTabNav.jsx`). |
| `getRolloutEnabled` | `selectors/session` | Feature flag check via Redux state. Verified at `client/src/selectors/session.js:387`. Used via `connect`/`mapStateToProps` as `addTeamChildPageEnabled: getRolloutEnabled(state, 'add_team_child_page')`. |
| `toI18n` | `util/i18n` | All user-visible strings. Used in all five entry point files. |

---

## File Plan

Total: 10 files. Creation of `es/new_team_page.json` and registration of the Spanish locale (`es/index.js`) are split into a follow-on issue (`02-i18n-locale-registration`). The English locale file (`en/new_team_page.json`) and its registration in `en/index.js` are included in this issue so that all three user-visible labels render correctly when the flag is on.

> **Important — i18n fallback behavior:** When a key is not found in i18next, `toI18n()` returns an **empty string** (verified at `client/src/util/i18n.js:78`) — it does NOT render the raw key string. Without `en/index.js` registration, all labels on `AddTeamPage` (title, Cancel button, primary CTA) would be blank. File #10 below prevents this.

| # | Action | Path | Purpose |
|---|--------|------|---------|
| 1 | **Create** | `client/src/features/team/AddTeamPage/AddTeamPage.tsx` | New full-page component: renders header (title + AppBackLink), content placeholder Box, and sticky footer (Cancel + CTA). |
| 1a | **Create** | `client/src/features/team/AddTeamPage/AddTeamPage.test.tsx` | Unit tests for AddTeamPage — added to satisfy test completeness gate (new TSX component requires test file). |
| 2 | **Create** | `client/src/features/team/AddTeamPage/index.ts` | Barrel export for lazy-loading in Routes.jsx. |
| 3 | **Edit** | `client/src/initializers/Routes.jsx` | Add lazy import for `AddTeamPage` and register `<Route exact path="/team/add" component={LazyAddTeamPage} />` inside `<SessionGate>` `<Switch>`, before the existing `/team` route entry. |
| 4 | **Edit** | `client/src/features/teamView/TeamView/TeamHeader/ActionButtons/AddTeamMemberButton/AddTeamMemberButton.jsx` | Read `rolloutActive('add_team_child_page')` in `handleAddNew`; if true, call `history.push('/team/add')` instead of `onShowAddEmployeeModal`. Add `useHistory` hook. |
| 5 | **Edit** | `client/src/features/teamView/TeamView/TeamHeader/AddEmployeesButton/AddEmployeesButton.jsx` | Same flag branch as file 4. |
| 6 | **Edit** | `client/src/features/scheduleBuilder/ScheduleBuilderView/EmployeeWeekView/AddEmployee.jsx` | Same flag branch on the non-embedded path inside `handleClick`. |
| 7 | **Edit** | `client/src/features/scheduleBuilder/ScheduleBuilderView/Header/ToolsMenu/MenuDropDown.jsx` | Same flag branch on the add-employee menu item handler. |
| 8 | **Edit** | `client/src/features/timesheets/TimesheetsPage/PayPeriodReviewView/TimesheetsTable/TableRows/AddEmployeeRow.jsx` | Same flag branch on non-embedded path inside `handleClick`. |
| 9 | **Create** | `client/src/locales/en/new_team_page.json` | English i18n strings for the new page (`title`, `cancel`, `submit`). |
| 10 | **Edit** | `client/src/locales/en/index.js` | Register `new_team_page` namespace so `toI18n('new_team_page.*')` resolves to actual strings (not empty). Follow the pattern of adjacent namespace registrations in the same file. |
| 11 | **Edit** | `app/services/feature_flags/fetch.rb` | Register `add_team_child_page: %i[redux_rollout]` in `ALLOW_LIST` so the flag is served to Redux state via `redux_rollouts(company)`. _Deviation from original spec: backbone is deprecated; correct mechanism is `:redux_rollout` + `getRolloutEnabled(state, 'add_team_child_page')` via Redux `connect`/`mapStateToProps`._ |

> **Deferred to issue 02-i18n-locale-registration:** edit `es/index.js`, create `es/new_team_page.json`.

---

## Routing & Mounting

**Route registration** — inside `Routes.jsx`, within the authenticated `<SessionGate>` block, within the inner `<Switch>` that already contains the `/team` family:

```jsx
// Routes.jsx — add before the existing <Route exact path="/team" …>
const LazyAddTeamPage = lazy(
  () => import('../features/team/AddTeamPage')
);

// Inside <Switch>:
<Route exact path="/team/add" component={LazyAddTeamPage} />
<Route exact path="/team" component={LazyTeamView} />
```

The `exact path="/team/add"` must precede `exact path="/team"` in the `<Switch>` to avoid the `/team` route shadowing it (React Router v5 matches first-wins in a `Switch`).

**AppHead shell** — The `/team/add` route lives inside the `<AppHead>` wrapper block (lines 626–1122 of `Routes.jsx`), within the inner team `<Switch>` (lines 646–707), so it inherits the standard app head (viewport meta, favicon, Bing UET, Wootric). No separate head component is needed.

**Navigation from entry points** — Each entry point component is a class-unaware functional component that currently does NOT use `useHistory`. Adding `useHistory` from `react-router-dom` is safe and consistent with `TimesheetsTabNav.jsx` and other components in the codebase. The flag check (`rolloutActive('add_team_child_page')`) is a synchronous boolean call — no suspense or async required.

---

## State & Data

This issue introduces **no new Redux state**. The existing `openAddTeamDrawer` action and `addTeamDrawerIsOpen` selector remain unchanged and continue to serve the flag-off path.

The new page is a pure presentational shell. No selectors, no dispatch, no API calls in this issue.

**Back-navigation state** is provided by `LastPageContext` (already wired via `LastPageProvider` in `Routes.jsx:472`). `AppBackLink` reads `pageContext.previousFullPath` and falls back to the `fallbackLinkTo` prop (`/team`). `LastPageContext` is re-exported from `features/navigation/BackLink` (verified at `client/src/features/navigation/BackLink/index.ts:4`).

---

## Feature Flag

**Mechanism:** `getRolloutEnabled` from `selectors/session` — reads `state.getIn(['session', 'rollouts', key])` (verified at `client/src/selectors/session.js:387`). Populated by `redux_rollouts(company)` on the backend, which calls `find_rollouts_by(:redux_rollout, company: company)`.

**Key name:** `add_team_child_page` — registered as `add_team_child_page: %i[redux_rollout]` in `app/services/feature_flags/fetch.rb`.

**Usage pattern in entry points:**

```jsx
import { getRolloutEnabled } from 'selectors/session';

// In mapStateToProps:
addTeamChildPageEnabled: getRolloutEnabled(state, 'add_team_child_page'),

// In component props:
const MyButton = ({ addTeamChildPageEnabled, ... }) => { ... }

// Inside handleAddNew / handleClick, after tracking, before enforcement:
if (addTeamChildPageEnabled) {
  return history.push('/team/add');
}
// existing path ↓
return onShowAddEmployeeModal({ calledFrom });
```

**Note:** `rolloutActive` from `util/homebaseRollout` was NOT used — backbone is deprecated in this codebase.

**Enforcement guard ordering** — The enforcement dialog and PayAnywhere modal checks in `AddTeamMemberButton.jsx` (lines 49–58) and `AddEmployeesButton.jsx` (lines 52–61) execute before the `onShowAddEmployeeModal` call. The flag branch must be inserted **after** those early returns to avoid bypassing them:

```
trackUxEvent(...)
if (payAnywhere condition) → return modal  ← unchanged
if (enforcement condition) → return dialog ← unchanged
if (rolloutActive flag)    → return history.push  ← new
return onShowAddEmployeeModal(...)          ← unchanged fallback
```

---

## `AddTeamPage` Component Structure

```
AddTeamPage/
  index.ts         — re-exports default from AddTeamPage.tsx
  AddTeamPage.tsx  — page shell
```

**`AddTeamPage.tsx` layout sketch (verified prop APIs only):**

```tsx
import { useCallback, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import Box from 'fe-design-base/atoms/Box';
import Text from 'fe-design-base/atoms/Text';
import Button from 'fe-design-base/molecules/Button';
import AppBackLink from 'features/navigation/BackLink';
import { LastPageContext } from 'features/navigation/BackLink';
import { toI18n } from 'util/i18n';

const AddTeamPage = () => {
  const history = useHistory();
  const { previousFullPath } = useContext(LastPageContext) ?? {};
  const handleCancel = useCallback(
    () => history.push(previousFullPath ?? '/team'),
    [history, previousFullPath]
  );

  return (
    <Box column minh="100vh">
      {/* Header */}
      <Box spacebetween vcenter h={62} bgcolor="mono0" ph={32}>
        <AppBackLink fallbackLinkTo="/team" />
        <Text variant="heading2" color="mono900">
          {toI18n('new_team_page.title')}
        </Text>
      </Box>

      {/* Content — placeholder for HRM-3222 / HRM-3223 */}
      <Box grow p={32} />

      {/* Footer */}
      <Box hright vcenter h={64} bgcolor="mono0" ph={32}>
        <Box mr={16}>
          <Button variant="secondary" onClick={handleCancel}>
            {toI18n('new_team_page.cancel')}
          </Button>
        </Box>
        <Button variant="primary" disabled>
          {toI18n('new_team_page.submit')}
        </Button>
      </Box>
    </Box>
  );
};

export default AddTeamPage;
```

Note: `Box` props (`spacebetween`, `vcenter`, `hright`, `grow`, `column`, `h`, `ph`, `mr`, `p`, `bgcolor`, `minh`) are verified by usage in `DrawerFooter.jsx:71-85` (`client/src/features/team/components/DrawerFooter/DrawerFooter.jsx`) in the same codebase.

---

## i18n

All new user-visible strings must have i18n key entries. Add to `client/src/locales/en/new_team_page.json` (following the flat JSON namespace format of adjacent files such as `new_team_drawer.json`).

| i18n key | English string | Context |
|----------|---------------|---------|
| `new_team_page.title` | `Add team member` | Page header title |
| `new_team_page.cancel` | `Cancel` | Footer secondary button |
| `new_team_page.submit` | `Add team member` | Footer primary CTA |
| `back_link.routes.team_add` | _(not needed — back-link resolves to `/team` fallback, which already maps to `back_link.routes.team` in `constants.ts:25`)_ | — |

The `ROUTE_I18N_MAPPING` in `client/src/features/navigation/BackLink/constants.ts` maps `/team` → `'team'` (line 25). The Add Team page back-links **to** `/team`, not from it, so no new mapping entry is required.

---

## Eventing

No new UX events in this issue. Existing `trackUxEvent` / `useTrackUx` calls in each entry point file must be preserved and must remain before the flag branch (they fire on every click regardless of routing outcome).

---

## Risks & Assumptions

| # | Risk / Assumption | Mitigation |
|---|------------------|------------|
| 1 | **Resolved:** `getRolloutEnabled` via Redux `connect`/`mapStateToProps` is the correct mechanism. `rolloutActive` from `util/homebaseRollout` was NOT used — backbone is deprecated. Backend registers the key as `:redux_rollout` in `fetch.rb`. | Confirmed at build time. |
| 2 | **Risk:** Route ordering in `Routes.jsx` — if `/team/add` is placed after `/team/:userId` (line 704), the catch-all would match `add` as a userId. | Mitigation: register `/team/add` as `exact` before the `/team/:userId` route in the `<Switch>`. |
| 3 | **Assumption:** `history.push('/team/add')` is safe to call inside `connect()`-wrapped class-compat components. All five entry point files are functional components — `useHistory` is available without HOC upgrade. | Verified: all five files use function components (confirmed via Read above). |
| 4 | **Risk:** `AddEmployee.jsx` in Schedule Builder uses `fe-components/Box` (not `fe-design-base`), indicating it may be an older component. No layout change is made to that file — only the navigation branch is added. | Confirmed: the edit is a single flag branch inside `handleClick` — no import or JSX structure changes needed. |
| 5 | **Risk:** `AddEmployeeRow.jsx` embedded guard is a **render-level early return** at line 60 (`if (isEmbedded) return <Box ... />`), NOT a guard inside `handleClick`. This differs from `AddEmployee.jsx` and `MenuDropDown.jsx`, where the embedded check is inside `handleClick`. Because the embedded case never reaches `handleClick`, the flag branch inside `handleClick` only needs a simple 2-way split (enforcement vs. flag/modal) — no 3-way `else-if` around an embedded handleClick guard is needed. | When editing `AddEmployeeRow.jsx`, insert the flag branch as a 2-way split after the enforcement guard. Do not replicate the 3-way embedded/flag/modal pattern used in Steps 7–8. |
