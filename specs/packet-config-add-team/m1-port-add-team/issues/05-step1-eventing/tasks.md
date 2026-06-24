---
issue: "05-step1-eventing"
approved: false
---

# Tasks — Step 1 Eventing

## Build Steps

- [ ] **Step 1 — Verify existing event constants**
  - File: `client/src/util/tracking_constants.ts`
  - Run: `grep -n "ADD_TEAM\|SAVE_AND_CLOSE\|SAVE_AND_ADD" client/src/util/tracking_constants.ts`
  - Confirm exact string values of `SAVE_AND_CLOSE_CLICKED` and `SAVE_AND_ADD_ANOTHER_CLICKED`. Confirm whether `EVENT_CATEGORIES.ADD_TEAM` exists.

- [ ] **Step 2 — Add new event constants to `tracking_constants.ts`**
  - File: `client/src/util/tracking_constants.ts`
  - What to add to the `EVENT_ACTIONS` object:
    - `ADD_TEAM_PAGE_SHOWN: 'Add Team Page Shown'`
    - `ADD_TEAM_CONTINUE_CLICKED: 'Add Team Continue Clicked'`
    - `ADD_TEAM_BACK_CLICKED: 'Add Team Back Clicked'`
  - If `EVENT_CATEGORIES.ADD_TEAM` does not exist, add `ADD_TEAM: 'Add Team'` to `EVENT_CATEGORIES`.

- [ ] **Step 3 — Create `tracking.ts`**
  - File: `client/src/features/addTeam/AddTeamPage/tracking.ts`
  - What to do: Export typed tracking functions:
    ```typescript
    export const trackAddTeamPageShown = () => trackUxEvent({
      productArea: PRODUCT_AREAS.TEAM,
      eventCategory: EVENT_CATEGORIES.ADD_TEAM,
      eventAction: EVENT_ACTIONS.ADD_TEAM_PAGE_SHOWN,
    });

    export const trackSaveAndClose = () => trackUxEvent({
      productArea: PRODUCT_AREAS.TEAM,
      eventCategory: EVENT_CATEGORIES.ADD_TEAM,
      eventAction: EVENT_ACTIONS.SAVE_AND_CLOSE_CLICKED,
    });

    export const trackSaveAndAdd = () => trackUxEvent({
      productArea: PRODUCT_AREAS.TEAM,
      eventCategory: EVENT_CATEGORIES.ADD_TEAM,
      eventAction: EVENT_ACTIONS.SAVE_AND_ADD_ANOTHER_CLICKED,
    });

    export const trackContinueClicked = () => trackUxEvent({
      productArea: PRODUCT_AREAS.TEAM,
      eventCategory: EVENT_CATEGORIES.ADD_TEAM,
      eventAction: EVENT_ACTIONS.ADD_TEAM_CONTINUE_CLICKED,
    });

    export const trackBackClicked = () => trackUxEvent({
      productArea: PRODUCT_AREAS.TEAM,
      eventCategory: EVENT_CATEGORIES.ADD_TEAM,
      eventAction: EVENT_ACTIONS.ADD_TEAM_BACK_CLICKED,
    });
    ```
  - Import pattern mirrors `AddIndividualDrawer/tracking.js:1-7`.

- [ ] **Step 4 — Wire events in `AddTeamPage.tsx`**
  - File: `client/src/features/addTeam/AddTeamPage/AddTeamPage.tsx`
  - What to do:
    - Add `useEffect(() => { trackAddTeamPageShown(); }, [])` for page shown event.
    - In back button `onClick`, call `trackBackClicked()` before `history.goBack()`.
    - Replace the inline `trackUxEvent` calls in `handleSaveAndFinish` and `handleSaveAndAdd` (from issue 04) with `trackSaveAndClose()` and `trackSaveAndAdd()` from `tracking.ts`.
    - In `handleContinue`, call `trackContinueClicked()` before dispatching `createEmployee`.

- [ ] **Step 5 — Write tests**
  - File: Extend existing `client/src/features/addTeam/AddTeamPage/AddTeamPage.test.tsx`
  - Cover:
    - `trackAddTeamPageShown` called on mount (mock `util/tracking`)
    - Back button click calls `trackBackClicked` (mock tracking)
    - "Save and Finish" click calls `trackSaveAndClose` (mock tracking)
    - "Save and Add Another" click calls `trackSaveAndAdd` (mock tracking)
    - "Continue" click calls `trackContinueClicked` (mock tracking)

- [ ] **Step 6 — Verify**
  - `bun ts` — expect: no errors
  - `jest client/src/features/addTeam/AddTeamPage/AddTeamPage.test.tsx` — expect: all tracking assertions pass
  - Run app with flag ON — open network tab or Amplitude debugger — confirm events fire when navigating to `/team/add` and clicking CTAs

---

## Test Coverage Targets

**Happy path**
- [ ] `ADD_TEAM_PAGE_SHOWN` fires exactly once when `AddTeamPage` mounts
- [ ] `ADD_TEAM_BACK_CLICKED` fires when back button is clicked
- [ ] `SAVE_AND_CLOSE_CLICKED` fires when "Save and Finish" is clicked
- [ ] `SAVE_AND_ADD_ANOTHER_CLICKED` fires when "Save and Add Another" is clicked
- [ ] `ADD_TEAM_CONTINUE_CLICKED` fires when "Continue" is clicked (payroll-enrolled)

**Error states**
- [ ] E-1: `trackUxEvent` throwing does not crash the page (test that component still renders after tracking mock throws)

**Edge cases**
- [ ] E-2: Re-mounting `AddTeamPage` fires `ADD_TEAM_PAGE_SHOWN` again (expected — test for it)

**Loading & empty states**
- [ ] N/A

**Tooling**
- [ ] `bun ts` passes
- [ ] `jest` suite passes
- [ ] `eslint` passes on changed files

---

## Self-Review Checklist

**Spec adherence**
- [ ] All 5 events specified in `requirements.md` are implemented
- [ ] `ADD_TEAM_DRAWER_SHOWN` at `AddIndividualDrawer.jsx:219` is unchanged
- [ ] No scope creep — only 3 files in `design.md` were touched

**Code quality**
- [ ] All tracking functions typed (no `any`)
- [ ] Tracking calls are fire-and-forget — no `await`, no error propagation
- [ ] New event constants follow existing naming pattern in `tracking_constants.ts`
- [ ] No `console.log`

**Tests**
- [ ] `util/tracking` is mocked (not calling real Amplitude in tests)
- [ ] Each event assertion checks the exact `eventAction` value, not just that `trackUxEvent` was called

**PR readiness**
- [ ] Total files changed = 3
- [ ] Branch: `fb/{ticket-id}-step1-eventing`
- [ ] Linear ticket linked via `hops linear`
- [ ] Draft PR opened

---

## Definition of Done

The issue is done when all 5 events are wired, all tests assert on specific event actions, the events are verified in the running app (Amplitude debugger or network tab), and the draft PR has been opened with `/review-pr --auto-comment` findings posted.
