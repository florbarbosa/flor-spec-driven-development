---
issue: "04-submit-and-branching"
approved: false
---

# Design — Submit and Branching

## Component Map

| UI Element | Component | Tier | Source | Key Props | Notes / Surprises |
|-----------|-----------|------|--------|-----------|------------------|
| "Save and Finish" button | `Button` | MCP | `fe-design-base/molecules/Button` | `variant="secondary" fullWidth onClick={handleSaveAndFinish} disabled loading` | Matches `theme="secondary-blue"` used at `FormView.tsx:260` — verify `variant` prop name in fe-design-base |
| "Save and Add Another" button | `Button` | MCP | `fe-design-base/molecules/Button` | `variant="primary" fullWidth onClick={handleSaveAndAdd} disabled loading` | Matches `theme="primary"` at `FormView.tsx:275` |
| "Continue" button | `Button` | MCP | `fe-design-base/molecules/Button` | `variant="primary" onClick={handleContinue} disabled loading` | Matches `theme="primary"` at `FormView.tsx:221` |
| Error banner | `Box` + `Text` | MCP | `fe-design-base/atoms/Box` + `fe-design-base/atoms/Text` | `bg="redLightest" p={12} bradius={8}` | Inline at top of page — same visual style as the contact info alert banner |
| Footer wrapper | `Box` | MCP | `fe-design-base/atoms/Box` | `row hright px={32} py={16}` sticky at bottom | Placed in `add-team-page-footer` area from issue 01 |

---

## File Plan

| Action | File path | Purpose |
|--------|-----------|---------|
| create | `client/src/features/addTeam/AddTeamPage/FooterCTAs/FooterCTAs.tsx` | CTA button row with submit logic |
| create | `client/src/features/addTeam/AddTeamPage/FooterCTAs/FooterCTAs.test.tsx` | Tests for CTAs |
| create | `client/src/features/addTeam/AddTeamPage/FooterCTAs/index.ts` | Re-export |
| modify | `client/src/features/addTeam/AddTeamPage/AddTeamPage.tsx` | Wire submit handlers + error state; render `FooterCTAs` in footer area; connect `createEmployee` and `fetchTeamReadiness` Redux actions |

**Total: 4 files** ✓

---

## Routing & Mounting

- **Mount point:** Rendered inside `<Box data-testid="add-team-page-footer">` in `AddTeamPage.tsx` (introduced in issue 01).
- **Navigation on success:** `history.push('/team')` via `useHistory` for "Save and Finish" and "Continue" (M1 placeholder). "Save and Add Another" does not navigate.
- **No new routes** in this issue.

---

## State & Data

### Data sources

| Data | Source | Shape | File:line |
|------|--------|-------|-----------|
| `submitting` | Local `useState` in `AddTeamPage.tsx` | `boolean`, default `false` | `AddIndividualDrawer.jsx:107` |
| `createEmployee` | Redux — `addTeamActions.createEmployee` | `(data, onSuccess, onError) => void` | `client/src/actions/addTeam.js:118` |
| `fetchTeamReadiness` | Redux — `fetchTeamReadiness` from `features/payroll/PayrollInfo/PayrollInfoSlice` | `() => void` | `AddIndividualDrawer.jsx:30-31` |
| `isPayrollEnrolled` | Redux — `getIsPayrollEnrolled(state)` | `boolean` | `AddIndividualDrawer.jsx:140` |
| `isSubmitButtonDisabled` | Util function — `helpers.ts:123` | `(params) => boolean` | `client/src/features/addTeam/AddIndividualDrawer/helpers.ts:123` |
| `userAndJobData` | Util function — `helpers.ts:201` | `(params) => object` | `client/src/features/addTeam/AddIndividualDrawer/helpers.ts:201` |
| `jobAttributes` | Util function — `helpers.ts:152` | `(params) => array` | `client/src/features/addTeam/AddIndividualDrawer/helpers.ts:152` |

### Loading / error handling

- Loading state: `submitting=true` shows loading spinner on all CTAs.
- Error state: API error sets `pageError` state in `AddTeamPage`; renders inline error banner above cards.
- Empty state: N/A (no data fetch on this page).

### Form state (submit handlers)

- `handleSaveAndFinish`: set `submitting=true`; call `createEmployee(userAndJobData({...}))`; on success: `history.push('/team')`, `fetchTeamReadiness()`; on error: set `pageError`.
- `handleSaveAndAdd`: set `submitting=true`; call `createEmployee(userAndJobData({...}))`; on success: reset form state to INIT_STATE values; on error: set `pageError`.
- `handleContinue`: set `submitting=true`; call `createEmployee(userAndJobData({...}))`; on success: `history.push('/team')` (M1 placeholder), `fetchTeamReadiness()`; on error: set `pageError`.

---

## Feature Flag

> Same flag as issue 01 — `packet_config_add_team_page`. The CTAs only appear on the new page which is only reachable when the flag is on (via the CTA gate in `actions/addTeam.js`).

---

## Eventing

| Event | Trigger | Payload | Implementation |
|-------|---------|---------|----------------|
| `EVENT_ACTIONS.SAVE_AND_CLOSE_CLICKED` | "Save and Finish" clicked | `{}` | `trackUxEvent` call mirroring `AddIndividualDrawer.jsx:526-528` |
| `EVENT_ACTIONS.SAVE_AND_ADD_ANOTHER_CLICKED` | "Save and Add Another" clicked | `{}` | `trackUxEvent` call mirroring `AddIndividualDrawer.jsx:538-540` |

> Additional events for the new page are deferred to `05-step1-eventing`.

---

## i18n

| Key | Default English value |
|-----|-----------------------|
| `add_team.individual_drawer.save_and_finish` | `"Save and finish"` — used at `FormView.tsx:261` |
| `add_team.individual_drawer.save_and_add` | `"Save and add another"` — used at `FormView.tsx:276` |
| `edit_team.individual_drawer.continue` | `"Continue"` — used at `FormView.tsx:232` |
| `add_team.individual_drawer.submit_error` | `"Something went wrong. Please try again."` — **new key** for inline error banner |

---

## Risks & Assumptions

| # | Risk / Assumption | Mitigation |
|---|------------------|------------|
| R-1 | `createEmployee` action is defined in `actions/addTeam.js:118` and uses `withAlerts` — moving to the page context means we need to call it via `useDispatch` and handle the callback pattern | Verified at `AddIndividualDrawer.jsx:368-401`; callback receives `id` on success and has a `resetSubmittingFlag` on error |
| R-2 | `validateUserPayrollEligibility` and `validateRequestInformation` need to be called before submit | These are already wired in `AddTeamPage.tsx` (issues 02-03); `isSubmitButtonDisabled` will catch invalid state |
| R-3 | "Save and Add Another" form reset: `AddTeamPage` must reset ALL state fields to INIT_STATE, not just contact fields | Ensure the reset function covers all state fields introduced in issues 02-03 |
