---
issue: "04-submit-and-branching"
approved: false
---

# Tasks — Submit and Branching

## Build Steps

- [ ] **Step 1 — Create `FooterCTAs.tsx`**
  - File: `client/src/features/addTeam/AddTeamPage/FooterCTAs/FooterCTAs.tsx`
  - What to do:
    - Props: `isPayrollEnrolled`, `disabled`, `loading`, `onSaveAndFinish`, `onSaveAndAdd`, `onContinue`.
    - When `isPayrollEnrolled=false`: render "Save and Finish" (`variant="secondary"`) + "Save and Add Another" (`variant="primary"`) side by side.
    - When `isPayrollEnrolled=true`: render single "Continue" (`variant="primary"`) right-aligned.
    - All buttons have `disabled` and `loading` props.
    - All labels via `toI18n()`.

- [ ] **Step 2 — Create `index.ts`**
  - File: `client/src/features/addTeam/AddTeamPage/FooterCTAs/index.ts`
  - What to do: `export { default } from './FooterCTAs';`

- [ ] **Step 3 — Wire submit handlers in `AddTeamPage.tsx`**
  - File: `client/src/features/addTeam/AddTeamPage/AddTeamPage.tsx`
  - What to do:
    - Add `pageError: string | null` to state (default `null`).
    - Add `submitting: boolean` to state (default `false`).
    - Connect `createEmployee` and `fetchTeamReadiness` via `useDispatch` / Redux connect.
    - Implement `handleSaveAndFinish`: validate all fields, set `submitting=true`, call `createEmployee(userAndJobData(...))`, on success: `history.push('/team')` + `fetchTeamReadiness()`, on error: `setPageError(errorMessage)`.
    - Implement `handleSaveAndAdd`: same as above but on success: reset all state to INIT_STATE values (do not navigate).
    - Implement `handleContinue`: same as `handleSaveAndFinish` (M1: also navigates to `/team`; leave a TODO comment for M2 Step 2 route).
    - Add inline error banner: render `<Box bg="redLightest">` + `<Text>` when `pageError` is non-null, above the cards.
    - Add two existing tracking events before dispatch: `SAVE_AND_CLOSE_CLICKED` for finish, `SAVE_AND_ADD_ANOTHER_CLICKED` for add-another.
    - Render `<FooterCTAs>` inside `<Box data-testid="add-team-page-footer">`.

- [ ] **Step 4 — Add new i18n key**
  - File: `client/config/locales/en/front_end/add_team.yml` (verify exact path)
  - Add: `add_team.individual_drawer.submit_error: "Something went wrong. Please try again."`
  - Also add Spanish placeholder in `es` file.

- [ ] **Step 5 — Write tests**
  - File: `client/src/features/addTeam/AddTeamPage/FooterCTAs/FooterCTAs.test.tsx`
  - Cover:
    - Non-payroll: two buttons render ("Save and Finish", "Save and Add Another")
    - Payroll-enrolled: single "Continue" button renders
    - `disabled=true` → both/all buttons are disabled
    - `loading=true` → buttons show loading state
    - Each button click calls the correct handler prop

- [ ] **Step 6 — Integration test for submit flow**
  - File: `client/src/features/addTeam/AddTeamPage/AddTeamPage.test.tsx` (extend existing)
  - Cover:
    - "Save and Finish" dispatches `createEmployee` and navigates to `/team` on success
    - "Save and Add Another" dispatches `createEmployee` and resets form on success (does not navigate)
    - API error → inline error banner renders with error text
    - Submit with empty `firstName` → button is disabled (does not call `createEmployee`)

- [ ] **Step 7 — Verify**
  - `bun ts` — expect: no errors
  - `jest client/src/features/addTeam/AddTeamPage/FooterCTAs/FooterCTAs.test.tsx` — expect: all pass
  - `jest client/src/features/addTeam/AddTeamPage/AddTeamPage.test.tsx` — expect: all pass
  - Run app with flag ON, fill in the form on `/team/add`, click "Save and Finish" → confirm network call fires and navigates to `/team`

---

## Test Coverage Targets

**Happy path**
- [ ] Fill all required fields → "Save and Finish" enabled → click → `createEmployee` called with correct payload → success → navigate to `/team`
- [ ] "Save and Add Another" → success → form resets, stays on page
- [ ] Payroll-enrolled: "Continue" → success → navigate to `/team` (M1 placeholder)

**Error states**
- [ ] E-1: API returns 422 → inline error banner renders at page top
- [ ] E-2: Network timeout → inline error banner renders; CTAs re-enabled
- [ ] E-3: `firstName` empty → button disabled → no API call

**Edge cases**
- [ ] E-4: `isPayrollEnrolled=true` + `invalidPayrollInfo=true` + `requestInformation=null` → "Continue" disabled
- [ ] E-6: `isEligibleForPayroll=false` → "Continue" disabled

**Loading & empty states**
- [ ] `submitting=true` → all CTAs show loading, disabled

**Tooling**
- [ ] `bun ts` passes
- [ ] `jest` suite passes
- [ ] *(submit surface)* Real unmocked submit confirmed in running app

---

## Self-Review Checklist

**Spec adherence**
- [ ] Every AC from `requirements.md` is addressed
- [ ] No scope creep — only the 4 files in `design.md` were touched (plus i18n file — total 5)
- [ ] `createEmployee` action, `userAndJobData`, `jobAttributes`, `isSubmitButtonDisabled` are unchanged
- [ ] "Continue" navigates to `/team` with a clear TODO comment for M2

**Code quality**
- [ ] All imports use `fe-design-base`
- [ ] `toI18n()` for all button labels and error messages
- [ ] `useHistory` for navigation — not `browserHistory`
- [ ] No `any` on exported interfaces
- [ ] No `console.log`

**Tests**
- [ ] Real unmocked `createEmployee` submit verified in running app
- [ ] Dispatch is not mocked at the action level — use `createFakeStore` with reducers

**PR readiness**
- [ ] Total files changed = 5
- [ ] Branch: `fb/{ticket-id}-submit-and-branching`
- [ ] Linear ticket linked via `hops linear`
- [ ] Draft PR opened

---

## Definition of Done

The issue is done when all CTAs work end-to-end (submit fires, success navigates or resets, errors show inline), all tests pass, the real submit is verified in the running app, and the draft PR has been opened with `/review-pr --auto-comment` findings posted.
