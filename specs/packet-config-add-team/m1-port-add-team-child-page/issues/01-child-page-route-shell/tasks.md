---
issue: "01-child-page-route-shell"
approved: true
---

# Tasks — Add Team Child Page: Route & Shell

## Build Steps

Steps are ordered for reviewability — each step is independently diffable.

---

### Step 1 — Confirm the feature flag key name with BE

Before writing any code, confirm the Flipper rollout key that will gate this feature. The spec uses `add_team_child_page` as placeholder. Update `util/homebaseRollout.js` usage accordingly once confirmed.

_No code change in this step — it is a blocker for all entry-point edits._

---

### Step 2 — Create `AddTeamPage` shell component

**File:** `client/src/features/team/AddTeamPage/AddTeamPage.tsx` _(create)_

- Import `useHistory` from `react-router-dom`
- Import `Box` from `fe-design-base/atoms/Box`
- Import `Text` from `fe-design-base/atoms/Text`
- Import `Button` from `fe-design-base/molecules/Button`
- Import `AppBackLink` from `features/navigation/BackLink` (default export, verified at `client/src/features/navigation/BackLink/index.ts:2`)
- Import `toI18n` from `util/i18n`
- Render: full-height column layout with sticky header (`Box spacebetween vcenter h={62} bgcolor="mono0" ph={32}`), grow content placeholder (`Box grow p={32}`), and sticky footer (`Box hright vcenter h={64} bgcolor="mono0" ph={32}`)
- Header contains: `AppBackLink fallbackLinkTo="/team"` and `Text variant="heading2" color="mono900"` with `toI18n('new_team_page.title')`
- Import `LastPageContext` from `features/navigation/BackLink`; read `previousFullPath` via `useContext(LastPageContext) ?? {}`
- Footer contains: secondary Cancel `Button` calling `history.push(previousFullPath ?? '/team')` (fallback to `/team` when `previousFullPath` is null) and primary disabled `Button` with `toI18n('new_team_page.submit')`
- Export as default

**File:** `client/src/features/team/AddTeamPage/index.ts` _(create)_

- Single line: `export { default } from './AddTeamPage';`

---

### Step 3 — Add i18n keys

**File:** `client/src/locales/en/new_team_page.json` _(create)_

Create this file following the flat JSON format of adjacent files such as `new_team_drawer.json`. Add the following JSON object:

```json
{
  "new_team_page": {
    "title": "Add team member",
    "cancel": "Cancel",
    "submit": "Add team member"
  }
}
```

> **Note:** When a key is not found in i18next, `toI18n()` returns an **empty string** (verified at `client/src/util/i18n.js:78`) — not the raw key string. To prevent blank labels on `AddTeamPage`, registration of `new_team_page.json` into `en/index.js` is included in this issue (Step 3b below). Registration into `es/index.js` and creation of `es/new_team_page.json` are deferred to the follow-on issue `02-i18n-locale-registration`.

**File:** `client/src/locales/en/index.js` _(edit)_

Register the new namespace following the pattern of adjacent entries in the same file:

```js
import newTeamPage from './new_team_page.json';
// ... add to the exported object using spread (matching the pattern at line 283: `...newTeamDrawer`):
...newTeamPage,
```

The actual `en/index.js` uses object spread for every namespace (e.g. line 283: `...newTeamDrawer`). Do NOT use the key-assignment form `new_team_page: newTeamPage` — that would produce a double-nested path (`new_team_page.new_team_page.title`) and silently break all i18n lookups.

---

### Step 4 — Register route in Routes.jsx

**File:** `client/src/initializers/Routes.jsx` _(edit)_

- Add lazy import after the existing `LazyTeamView` lazy import (line ~108):
  ```jsx
  const LazyAddTeamPage = lazy(
    () => import('../features/team/AddTeamPage')
  );
  ```
- Inside the authenticated `<SessionGate>` block, within the inner `<Switch>` that contains the `/team` family (around line 647), add **before** the existing `<Route exact path="/team" …>`:
  ```jsx
  <Route exact path="/team/add" component={LazyAddTeamPage} />
  ```
- Confirm placement: the new route must precede `<Route exact path="/team" …>` AND precede `<Route path="/team/:userId" …>` in the same `<Switch>`.

---

### Step 5 — Wire entry point: AddTeamMemberButton

**File:** `client/src/features/teamView/TeamView/TeamHeader/ActionButtons/AddTeamMemberButton/AddTeamMemberButton.jsx` _(edit)_

- Add `import { useHistory } from 'react-router-dom';` at the top
- Add `import { rolloutActive } from 'util/homebaseRollout';`
- Inside `AddTeamMemberButton`, call `const history = useHistory();` at the top of the component body
- Inside `handleAddNew` (line 42), after the PayAnywhere guard (line 49–51) and after the enforcement guard (lines 53–58), add before the `return onShowAddEmployeeModal(...)` call:
  ```js
  if (rolloutActive('add_team_child_page')) {
    return history.push('/team/add');
  }
  ```
- Add `history` to the `useCallback` dependency array

---

### Step 6 — Wire entry point: AddEmployeesButton

**File:** `client/src/features/teamView/TeamView/TeamHeader/AddEmployeesButton/AddEmployeesButton.jsx` _(edit)_

Same pattern as Step 5:
- Add `useHistory` import and `rolloutActive` import
- Call `const history = useHistory();`
- Insert flag branch inside `handleAddNew` (line 45) after PayAnywhere guard (lines 52–54) and enforcement guard (lines 56–61):
  ```js
  if (rolloutActive('add_team_child_page')) {
    return history.push('/team/add');
  }
  ```
- Add `history` to `useCallback` deps

---

### Step 7 — Wire entry point: AddEmployee (Schedule Builder)

**File:** `client/src/features/scheduleBuilder/ScheduleBuilderView/EmployeeWeekView/AddEmployee.jsx` _(edit)_

- Add `useHistory` import and `rolloutActive` import
- Call `const history = useHistory();` inside the `AddEmployee` function body
- Inside `handleClick` (line 39), the flow is: enforcement guard (lines 41–45) → embedded guard (lines 46–51) → `onAddEmployee()` (line 53). Insert the flag branch in the non-embedded else path (after the embedded guard, before `onAddEmployee()`):
  ```js
  } else if (rolloutActive('add_team_child_page')) {
    history.push('/team/add');
  } else {
    onAddEmployee();
  }
  ```
- Add `history` to `useCallback` deps

---

### Step 8 — Wire entry point: MenuDropDown (Schedule Builder ToolsMenu)

**File:** `client/src/features/scheduleBuilder/ScheduleBuilderView/Header/ToolsMenu/MenuDropDown.jsx` _(edit)_

- Locate the `onAddEmployee()` call inside `handleAddEmployee` (line 346)
- Add `useHistory` and `rolloutActive` imports
- `handleAddEmployee` contains its own embedded guard (Clover `postMessage` branch) identical in structure to `AddEmployee.jsx`. Insert the flag branch **after** the embedded guard and **before** the `onAddEmployee()` call — do NOT replace the entire else block. Mirror Step 7's pattern:
  ```js
  } else if (rolloutActive('add_team_child_page')) {
    history.push('/team/add');
  } else {
    onAddEmployee();
  }
  ```
- Add `history` to the `useCallback` dependency array (alongside the existing deps: `canCloseEnforcementDialog`, `cloverBaseUrl`, `cloverCdkInstanceId`, `handleCloseContextMenu`, `onAddEmployee`, `onShowEnforcementDialog`, `shouldShowEnforcementDialog`, `toolsDropdownTrackUx`)

---

### Step 9 — Wire entry point: AddEmployeeRow (Timesheets)

**File:** `client/src/features/timesheets/TimesheetsPage/PayPeriodReviewView/TimesheetsTable/TableRows/AddEmployeeRow.jsx` _(edit)_

> **Important — embedded guard is render-level, not in handleClick:** Unlike `AddEmployee.jsx` and `MenuDropDown.jsx`, the embedded check in `AddEmployeeRow.jsx` is a render-level early return at line 60 (`if (isEmbedded) return <Box ... />`). It executes before `handleClick` is ever called. As a result, `handleClick` never runs when embedded — no 3-way else-if chain around an embedded guard is needed inside `handleClick`. The flag branch is a simple 2-way split: enforcement guard first, then flag vs. modal.

- Add `useHistory` import and `rolloutActive` import
- Call `const history = useHistory();`
- Inside `handleClick` (line 39), after the enforcement guard (lines 42–46), replace the entire else clause (lines 47–51, i.e., `} else { showAddEmployeeModal({...}); }`) with:
  ```js
  } else if (rolloutActive('add_team_child_page')) {
    history.push('/team/add');
  } else {
    showAddEmployeeModal({ calledFrom: PRODUCT_AREAS.TIMESHEETS });
  }
  ```
- Add `history` to `useCallback` deps

---

## Test Coverage Targets

### `AddTeamPage.tsx` — Unit tests

| Test case | Coverage target |
|-----------|----------------|
| Happy path: renders page title | `toI18n('new_team_page.title')` appears in the DOM |
| Happy path: renders AppBackLink | AppBackLink receives `fallbackLinkTo="/team"` |
| Happy path: renders Cancel button | Cancel button with `toI18n('new_team_page.cancel')` is present |
| Happy path: renders primary CTA | Primary button with `toI18n('new_team_page.submit')` is present and `disabled` |
| Cancel click navigates back (with history) | When `previousFullPath` is set, Cancel calls `history.push(previousFullPath)` |
| Cancel click falls back to `/team` | When `previousFullPath` is null/undefined, Cancel calls `history.push('/team')` |
| Primary CTA is disabled | Primary button has `disabled` attribute and does NOT submit |

### Route registration — Integration / Smoke test

| Test case | Coverage target |
|-----------|----------------|
| Flag on: `/team/add` renders AddTeamPage | Mount `Routes` with mocked `rolloutActive=true`; navigate to `/team/add`; assert page title renders |
| Flag off: `/team/add` does not match | Navigate to `/team/add` without the flag; assert TeamView or fallback renders (not AddTeamPage) |

### Entry point: `AddTeamMemberButton.jsx`

| Test case | Coverage target |
|-----------|----------------|
| Flag on, happy path | `handleAddNew` calls `history.push('/team/add')` — does NOT call `onShowAddEmployeeModal` |
| Flag off, happy path | `handleAddNew` calls `onShowAddEmployeeModal({ calledFrom: ... })` |
| Flag on + enforcement active | Enforcement dialog shown; `history.push` NOT called |
| Flag on + PayAnywhere active | PayAnywhere modal shown; `history.push` NOT called |

### Entry point: `AddEmployeesButton.jsx`

| Test case | Coverage target |
|-----------|----------------|
| Flag on, happy path | `history.push('/team/add')` called |
| Flag off, happy path | `onShowAddEmployeeModal` called |
| Flag on + enforcement active | Enforcement dialog shown; no navigation |
| Flag on + PayAnywhere active | Warning modal shown; no navigation |

### Entry point: `AddEmployee.jsx`

| Test case | Coverage target |
|-----------|----------------|
| Flag on, not embedded | `history.push('/team/add')` called; `onAddEmployee` NOT called |
| Flag off, not embedded | `onAddEmployee()` called |
| Flag on, embedded | `postMessage` fires; `history.push` NOT called |
| Flag on + enforcement active | Enforcement dialog; no navigation |

### Entry point: `MenuDropDown.jsx`

| Test case | Coverage target |
|-----------|----------------|
| Flag on | `history.push('/team/add')` called when add-employee item clicked |
| Flag off | `showAddEmployeeModal` dispatched |
| Flag on, embedded | `postMessage` fires to `cloverBaseUrl`; `history.push` NOT called (AC-15: embedded Clover path is unaffected by the flag) |

### Entry point: `AddEmployeeRow.jsx`

| Test case | Coverage target |
|-----------|----------------|
| Flag on, not embedded | `history.push('/team/add')` called |
| Flag off, not embedded | `showAddEmployeeModal` called |
| Flag on, embedded | Early return renders empty box; no navigation |
| Flag on + enforcement active | Enforcement dialog shown; no navigation |

### Edge cases from requirements

| Test case | Coverage target |
|-----------|----------------|
| EC-1: Direct URL to `/team/add` when flag is off | App does not crash; falls through Switch |
| EC-5: AppBackLink with null previousFullPath | Renders with href `/team` as fallback |

---

## Self-Review Checklist

- [ ] `/team/add` route is registered with `exact` and is ordered before `/team` and `/team/:userId` in the `<Switch>`
- [ ] The lazy import for `LazyAddTeamPage` follows the existing naming convention in `Routes.jsx`
- [ ] Each entry point preserves its existing `trackUxEvent` / `useTrackUx` call before the flag branch
- [ ] The PayAnywhere and enforcement guards in `AddTeamMemberButton` and `AddEmployeesButton` still fire before the flag branch
- [ ] The embedded path in `AddEmployee.jsx`, `AddEmployeeRow.jsx`, and `MenuDropDown.jsx` (`handleAddEmployee`) is unaffected
- [ ] `useHistory` is imported from `react-router-dom` in each edited entry point (not from a custom hook)
- [ ] `rolloutActive` is imported from `util/homebaseRollout` in each edited entry point
- [ ] `history` is added to `useCallback` dependency arrays where it is used
- [ ] All three new i18n keys (`new_team_page.title`, `new_team_page.cancel`, `new_team_page.submit`) are present in the locale file
- [ ] `AddTeamPage` does NOT import from `features/team/slice.js` (no Redux changes in this issue)
- [ ] The existing `AddTeamDrawer` in `GlobalComponents.tsx:167` is untouched
- [ ] No TypeScript errors in `AddTeamPage.tsx` (run `tsc --noEmit` or the project's type-check command)
- [ ] Bundle size impact: `AddTeamPage` is lazy-loaded; confirm no unintentional eager import

---

## Definition of Done

1. All build steps are merged to the feature branch with no linting or type errors.
2. All test coverage targets above pass in CI.
3. Manual smoke test (flag on): clicking each of the five entry points navigates to `/team/add`, which renders the page shell with title, back-link, Cancel button, and a disabled primary CTA.
4. Manual smoke test (flag off): clicking each of the five entry points opens the existing drawer as before.
5. `requirements.md` and `design.md` for this issue are marked `approved: true` before PR is opened.
6. PR description references HRM-3221 and notes the flag key in use.
