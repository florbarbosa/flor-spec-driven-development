---
issue: "03-time-off-cta-branching"
approved: true
---

# Tasks — HRM-3223: Add Time Off Section and CTA Branching

## File Plan (≤ 10 files)

| # | File | Action | Notes |
|---|------|--------|-------|
| 1 | `client/src/features/team/AddTeamPage/AddTeamPage.jsx` | Edit (file created by issue 01 shell — must be merged before this issue is started) | Main child-page component created in issue 01 — add TimeOffSection, OnboardingSection, and CTA branching logic |
| 2 | `client/src/features/team/AddTeamPage/AddTeamPage.test.jsx` | Edit (file created by issue 01 shell — must be merged before this issue is started) | Add test cases for Time Off rendering, CTA branch behaviors, and cancel flow |
| 3 | `client/src/features/team/AddTeamPage/index.js` | Edit (if needed) | Re-export if public API changes |
| 4 | `client/src/features/team/components/AddEmployeeForm/Sections/TimeOffSection/TimeOffSection.tsx` | Read-only reference | Ported as-is — no edits |
| 5 | `client/src/features/team/components/AddEmployeeForm/Sections/OnboardingSection/OnboardingSection.jsx` | Read-only reference | Ported as-is — no edits |
| 6 | `client/src/util/router.js` | Edit | Add `addTeamStep2Route` helper — always required, regardless of what issue 01 defines. |

> Files 4 and 5 are listed for reference only — they are not modified. The file plan stays within the 10-file limit.

---

## Implementation Tasks

### T-1 — Add `TimeOffSection` to child page

**File:** `AddTeamPage.jsx`

1. Import `TimeOffSection` from `features/team/components/AddEmployeeForm/Sections/TimeOffSection`.
2. Render `<TimeOffSection />` below the Job Details card and above `OnboardingSection`.
3. No props required — `TimeOffSection` is self-contained; it reads from Redux and Formik context internally (`TimeOffSection.tsx:15-51`).
4. Verify `addEmployeeForm` reducer is registered in the Redux store (it must be — it already powers the existing `AddEmployeeForm`). If not registered, add it.

**Acceptance check:** `TimeOffSection` dispatches `fetchPolicyOptions` on mount; policy dropdowns appear when the location has more than one policy per category.

---

### T-2 — Add `OnboardingSection` to child page (temporary)

**File:** `AddTeamPage.jsx`

1. Import `OnboardingSection` from `features/team/components/AddEmployeeForm/Sections/OnboardingSection`.
2. Import `getPacketProps` from `selectors/drawers` and derive `const packetProps = useSelector(getPacketProps)` inside `AddTeamPage`. Then derive `showOnboardingSection`:
   ```js
   const packetProps = useSelector(getPacketProps); // selectors/drawers
   const showOnboardingSection =
     isPayrollEnrolled ||
     (isAIOLocation && packetProps.newHireOnboardingActivated);
   // Same condition as StepOne.jsx:104-106
   ```
3. Render `<OnboardingSection>` conditionally below `TimeOffSection`, passing:
   - `contactInfoRequired` (boolean state from page)
   - `onboardingSectionRef` (ref for scroll-to)
   - `isPayrollEnrolled` (from Redux — `getIsPayrollEnrolled`)
4. Add a code comment: `{/* Temporary — replaced by Step 2 packet config in M2 (HRM-XXXX) */}`

---

### T-3 — Wire CTA branching

**File:** `AddTeamPage.jsx`

Define `closePage` inside `AddTeamPage` by importing `closeAddTeamDrawer` from `features/team/slice` and wrapping it in `useCallback`:

```js
import { closeAddTeamDrawer } from 'features/team/slice';
// ...
const closePage = useCallback(
  () => dispatch(closeAddTeamDrawer()),
  [dispatch]
);
```

This is the single authoritative definition of `closePage` for this component. All callsites in T-3 (success path, `shouldFinalize` early return) and T-4 (`handleCancel`, `handleExitPage`) must use this reference.

> If the issue 01 shell already exports a `closePage` (or equivalent) hook/function from `AddTeamPage`, import and use it directly and remove the definition above. Coordinate with the issue 01 author before merging.

Declare `const contactSectionRef = useRef()` in `AddTeamPage` (issue 02 should have defined this ref for the Contact card — if it did, skip this step and pass/import it from there instead of re-declaring). Pass `contactSectionRef` to the Contact card so it can be scrolled to in the contact-info guard.

Add `isIntegratedPayrollPartner` to the component's Redux-connected props using `getCurrentLocationIsIntegratedPayrollPartner` from `selectors/addTeam.js:57-58`.

Connect `onCloseDrawerCallback` from Redux: `const onCloseDrawerCallback = useSelector(selectOnCloseDrawerCallback)`. This value is set by the caller when opening the Add Team page, and must be forwarded to `openSuccessModal` unchanged so any post-close callbacks (e.g. redirect to the new employee profile) are honoured. See `AddTeamDrawerContainer.jsx:297, 786`.

Define a local `flashError` wrapper inside `AddTeamPage`, mirroring `AddTeamDrawerContainer.jsx:226-238`:

```js
const flashError = useCallback(
  (message, details) => {
    trackUxEvent({
      productArea: PRODUCT_AREAS.TEAM,
      eventCategory: EVENT_CATEGORIES.ADD_TEAM_DRAWER,
      eventAction: EVENT_ACTIONS.ERROR_MESSAGE_SHOWN,
      properties: { error_msg: message, error: details || message },
    });
    flashNotice.error(message);
  },
  [] // stable — no captured state
);
```

Use `flashError` in both error branches of `handleSubmit` (Branch 1: API errors array; Branch 2: RTK rejected action via `response.error`) so UX error events are tracked consistently on the new page.

Implement `handleSubmit`:

```js
const handleSubmit = useCallback(
  async (values) => {
    setIsLoading(true);
    // In the child page context, the user is always adding a new team member
    // (never editing or rehiring), so declare `const isAdding = true;` at the
    // top of `AddTeamPage` — no Redux selector needed.
    const payload = createEmployeePayload(
      values,
      isAdding,
      locationId,
      isAIOLocation,
      isPayrollEnrolled,
      calledFrom,
      EVENT_CATEGORIES.ADD_TEAM_DRAWER  // keep consistent with drawer
    );
    const sanitizedPayload = sanitizeTeamMemberPayload(payload);

    // Contact info guard (mirrors AddTeamDrawerContainer.jsx:334-345 / E-6)
    const hasContactInfoRequiredError =
      (payload.send_onboarding_packet || payload.send_sms) &&
      !Boolean(payload.user.email || payload.user.phone);
    if (hasContactInfoRequiredError) {
      setContactInfoRequired(true);
      try {
        onboardingSectionRef.current.scrollIntoView(SCROLL_BEHAVIOR);
      } catch {
        contactSectionRef.current.scrollIntoView(SCROLL_BEHAVIOR);
      }
      setIsLoading(false);
      return;
    }

    // CTA branch decision
    const shouldFinalize =
      values.sendSms === false && !isIntegratedPayrollPartner;

    if (!shouldFinalize) {
      // Proceed to Step 2 — just navigate (Step 2 handles submit)
      setIsLoading(false);
      browserHistory.push(addTeamStep2Route());  // import addTeamStep2Route from 'util/router'
      return;
    }

    // Finalize add
    // NOTE: Do NOT wrap dispatch(addTeamMember(...)) in a try/catch.
    // addTeamMember uses RTK's createAsyncThunk with rejectWithValue, so
    // dispatch() always resolves — network errors are surfaced as a rejected
    // action (response.error), not as a thrown exception. A catch block here
    // is dead code and will never fire.
    const response = await dispatch(addTeamMember(sanitizedPayload));

    // Error handling — two-branch pattern from AddTeamDrawerContainer.jsx:366-395

    // Branch 1: API errors in payload
    if (response.payload?.errors?.length) {
      if (response.payload.errors[0].error_code) {
        flashErrorFromEnvelope(response.payload)
      } else {
        flashError(response.payload.errors.join('. '))
      }
      setIsLoading(false);
      return;
    }
    // Branch 2: RTK/network errors
    if (response.error) {
      datadogLogError({ message: response.error, context: { locationId } }); // mirrors AddTeamDrawerContainer.jsx:440-443
      flashError(response.error.message || toI18n('errors.generic'));
      setIsLoading(false);
      return;
    }

    // Success — mirrors AddTeamDrawerContainer.jsx:278-307, 427-437
    // Only open the modal when the feature flag / selector says to show it
    // (selectShowSuccessModal from features/team/selectors).
    if (showSuccessModal) {
      const { id, invite_status, first_name, last_name } = response.payload;
      // AddTeamDrawerContainer.jsx:283 — merge_user_request_matched_on from payload
      const { merge_user_request_matched_on } = response.payload;
      const firstName = capitalize(first_name);
      const fullName = last_name ? firstName.concat(' ', capitalize(last_name)) : firstName;
      dispatch(
        openSuccessModal({
          userId: id,
          title: toI18n('new_team_drawer.add_team_success_modal.added', {
            props: { name: fullName },
          }),
          fullName,
          email: response.payload.email,
          phone: response.payload.phone,
          isPayrollEnrolled,
          invite_status,
          onboardingOptions: values.onboarding,
          // Required props — omitting these will break the success modal for
          // payroll-enrolled locations and leave the page open after success.
          payrollOnboardingOptions: payrollOnboardingOptions(values.onboarding), // AddTeamDrawerContainer.jsx:296-298
          isPayrollSetupDone: values.onboarding === ONBOARDING_OPTIONS.INVITE_AND_PACKET, // AddTeamDrawerContainer.jsx:298-299 — computed inline
          onCloseDrawerCallback,                                                   // from Redux via useSelector(selectOnCloseDrawerCallback) — AddTeamDrawerContainer.jsx:297, 302
          merge_user_request_matched_on,                                          // AddTeamDrawerContainer.jsx:283, 301
        })
      );
    }
    closePage();
  },
  [isAdding, locationId, isAIOLocation, isPayrollEnrolled,
   isIntegratedPayrollPartner, calledFrom, dispatch,
   showSuccessModal, closePage, openSuccessModal,
   setContactInfoRequired, setIsLoading,
   onboardingSectionRef, contactSectionRef]
);
```

Key imports needed (all already exist in the codebase):
- `SCROLL_BEHAVIOR` — `features/team/components/AddEmployeeForm/constants.js` (mirrors `AddTeamDrawerContainer.jsx:338-345`; use this constant for both scroll calls in the contact-info guard)
- `capitalize` — `lodash/capitalize` (or `lodash.capitalize`); used to capitalize `first_name`/`last_name` from `response.payload` matching `AddTeamDrawerContainer.jsx:409-421`
- `createEmployeePayload`, `formHasContent` — `features/team/components/AddEmployeeForm/util.js`
- `sanitizeTeamMemberPayload` — `util/sanitization`
- `addTeamMember` — `features/team/actions.js:46-55`
- `openSuccessModal` — `features/team/slice`
- `getCurrentLocationIsIntegratedPayrollPartner` — `selectors/addTeam.js:57-58`
- `getPacketProps` — `selectors/drawers` (used in T-2 and the `showOnboardingSection` condition; access via `useSelector(getPacketProps)` at the top of `AddTeamPage`)
- `contactSectionRef` — declared via `useRef()` at the top of `AddTeamPage` (see step above); used in the catch branch of the contact-info guard to scroll to the Contact card
- `addTeamStep2Route` — `util/router` (defined in T-6 below — always import unconditionally)
- `browserHistory` — `util/router.js:9`
- `datadogLogError` — `util/datadogLogs`
- `flashNotice` — `util/flashNotice`
- `flashErrorFromEnvelope` — `util/notificationCodes`
- `payrollOnboardingOptions` — import from `features/teamView/tracking` (exported at `tracking.js:154`). Same import used in `AddTeamDrawerContainer.jsx:92`.
- `EVENT_CATEGORIES` — import from `features/teamView/tracking` (same file as `payrollOnboardingOptions`, confirmed at `AddTeamDrawerContainer.jsx:87-95`)
- `PRODUCT_AREAS`, `EVENT_ACTIONS` — import from the same constants file as used in `AddTeamDrawerContainer.jsx:226-238` (required by the `flashError` wrapper)
- `trackUxEvent` — import from `util/tracking` (required by the `flashError` wrapper; same as `AddTeamDrawerContainer.jsx:105`)
- `selectOnCloseDrawerCallback` — import from `features/team/selectors` (`features/team/selectors.js:23-24`); connect via `const onCloseDrawerCallback = useSelector(selectOnCloseDrawerCallback)` in `AddTeamPage`
- `ONBOARDING_OPTIONS` — `features/team/components/AddEmployeeForm/constants` (used to compute `isPayrollSetupDone` inline)
- `selectShowSuccessModal` — import from `features/team/selectors` (connect via `useSelector(selectShowSuccessModal)`)
- `selectCalledFrom` — import from `features/team/selectors` (`features/team/selectors.js:14-15`). Connect via `const calledFrom = useSelector(selectCalledFrom);` in `AddTeamPage`.

---

### T-4 — Wire Cancel button

**File:** `AddTeamPage.jsx`

Implement `handleCancel`:

```js
const handleCancel = useCallback(
  (values) => {
    if (formHasContent(values)) {
      setIsExiting(true);  // opens ExitModal
    } else {
      closePage();
    }
  },
  [closePage]
);
// `closePage` must be a stable reference (wrap in `useCallback` wherever it is
// defined) to prevent stale-closure bugs in Cancel navigation.
// Mirrors how `handleCloseDrawer` in `AddTeamDrawerContainer.jsx:269-276`
// depends on `[onCloseDrawer]`.
```

The Cancel button receives a `SyntheticEvent` from React's `onClick`, not Formik values. To pass the current form values, render the button inside the Formik context (render-prop or `useFormikContext`) and bind the handler with an arrow function:

```jsx
// Option A — render-prop (matches AddTeamDrawerContainer.jsx:642 pattern)
<Formik ...>
  {({ values }) => (
    ...
    <Button onClick={() => handleCancel(values)}>
      {toI18n('new_team_drawer.cancel')}
    </Button>
    ...
  )}
</Formik>

// Option B — useFormikContext inside a child component
const { values } = useFormikContext();
<Button onClick={() => handleCancel(values)}>...</Button>
```

Do NOT write `onClick={handleCancel}` — the handler would receive a SyntheticEvent, `formHasContent` would always return truthy, and the ExitModal would open even on an empty form.

Before rendering `<ExitModal>`, define the two callbacks it requires (mirroring `AddTeamDrawerContainer.jsx:476-484`):

```js
const handleCloseExitDialog = useCallback(() => {
  setIsExiting(false);
}, []);

const handleExitPage = useCallback(() => {
  closePage();
  setIsExiting(false);
}, [closePage]);
```

Render `<ExitModal>` (from `features/team/components/ExitModal/`) with:
- `isOpen={isExiting}`
- `onDiscard={handleExitPage}` — closes page and resets `isExiting`
- `onClose={handleCloseExitDialog}` — sets `isExiting(false)`, keeps page open
- `title={toI18n('new_team_drawer.exit_modal.title.add')}`
- `description={toI18n('new_team_drawer.exit_modal.description')}`
- `continueButton={toI18n('new_team_drawer.exit_modal.continue.add')}`
- `discardButton={toI18n('new_team_drawer.exit_modal.discard')}`

Source: `AddTeamDrawerContainer.jsx:729-741`.

---

### T-5 — Tests

**File:** `AddTeamPage.test.jsx`

Test targets — each maps to an AC or edge case:

| Test | AC / Edge | What to assert |
|---|---|---|
| `renders TimeOffSection` | AC-1 | `TimeOffSection` present in DOM; `fetchPolicyOptions` dispatched on mount |
| `TimeOffSection hidden when only default option per category` | AC-1 | When store has 1 pto option + 1 sick-leave option, `TimeOffSection` renders nothing |
| `renders OnboardingSection for payroll company` | AC-2 | When `isPayrollEnrolled=true`, `OnboardingSection` visible |
| `hides OnboardingSection for non-payroll non-AIO` | AC-2 | When both false, `OnboardingSection` not rendered |
| `CTA calls addTeamMember when sendSms=false and non-payroll` | AC-3 | `addTeamMember` dispatched; on success `openSuccessModal` dispatched |
| `CTA navigates to step 2 when sendSms=true` | AC-4 | `addTeamMember` NOT called; `browserHistory.push` called with step-2 route |
| `CTA navigates to step 2 when isIntegratedPayrollPartner=true even if sendSms=false` | E-1 | `browserHistory.push` called |
| `CTA navigates to step 2 when sendSms=true and non-payroll` | E-2 | `browserHistory.push` called |
| `addTeamMember network error shows flash error` | E-3 | Setup: mock `addTeamMember` to resolve with `{ error: { name: 'Error', message: 'Network error' } }` (RTK rejected action path — do NOT mock dispatch to throw). Assert: `datadogLogError` IS called; `flashNotice.error` IS called; page stays open; `openSuccessModal` is NOT dispatched |
| `CTA shows flash error when API returns errors array` | AC-3 / E-3-api | Setup: mock `addTeamMember` to resolve with `{ payload: { errors: [{ error_code: 'some_code' }] } }`. Assert: `flashErrorFromEnvelope` IS called with the payload; `addTeamMember` WAS dispatched; the page remains open; `openSuccessModal` is NOT dispatched |
| `CTA shows flash error when addTeamMember returns RTK rejected action (response.error)` | E-3-rtk | Setup: mock `addTeamMember` to resolve with `{ error: { message: 'Network error' } }`. Assert: `datadogLogError` IS called; `flashNotice.error` IS called; page remains open; `openSuccessModal` is NOT dispatched |
| `Cancel with empty form closes page` | AC-5 | `closePage` called immediately; ExitModal not shown |
| `Cancel with populated form opens ExitModal` | AC-5 | ExitModal visible |
| `ExitModal discard closes page` | AC-5 | Page closed after discard click |
| `ExitModal keep-editing dismisses modal` | AC-5 / E-4 | Modal hidden; form unchanged |
| `fetchPolicyOptions failure leaves TimeOffSection hidden` | E-5 | No crash; TimeOffSection renders nothing |
| `contactInfoRequired error blocks submit and scrolls to onboarding section` | E-6 | Setup: `send_onboarding_packet` or `send_sms` is true AND both email and phone are empty. Assert: `addTeamMember` is NOT dispatched; `setContactInfoRequired(true)` IS called; `onboardingSectionRef.current.scrollIntoView` IS called |

Test utilities already used in the codebase: `@testing-library/react`, `createFakeStore`, `withDesignBaseTheme`, `Formik` wrapper — see `AddTeamDrawerContainer.test.jsx:1-10` and `OnboardingSection.test.jsx:1-18` for patterns to follow.

---

### T-6 — Add `addTeamStep2Route` to `util/router.js`

**File:** `client/src/util/router.js`

Add the following export, following the same pattern as other route helpers in that file (e.g. `addNewUserRoute` at line 11):

```js
export const addTeamStep2Route = () => '/team/add/step-2';
```

**Conditional instruction:** If issue 01 has already exported an `addTeamStep2Route` helper from `util/router.js`, import it directly — do not define a duplicate. Only add this export if issue 01 has not yet defined it. The path `/team/add/step-2` is a placeholder; confirm the exact route path with the issue 01 author before merging this issue (see Section 5 of requirements.md — "exact route TBD by issue 01 shell"). Update this file with the confirmed path before the PR is approved.

---

### T-7: Feature Flag Gate

**Flag name:** Confirm with BE/infra before starting this task. The placeholder is `add_team_child_page` (consistent with issue 01) — do not proceed with a placeholder in committed code.

**Escalation path:** Ping the BE lead on the HRM-3223 Slack thread (or Linear comment) to confirm the Flipper constant name. Issue 01 must use the same flag — coordinate with the issue 01 author to avoid creating a duplicate. If no response within one working day, escalate to the EM before opening the PR.

**Once the flag name is confirmed, substitute it in all three of these locations before merging:**
1. The `rolloutActive(...)` call in `AddTeamPage.jsx` (see step 2 below).
2. The PR checklist item at the bottom of this file ("Feature flag `add_team_child_page` (or confirmed name)...").
3. This task's **Flag name** line above.

**Files to edit:**
- `client/src/features/team/AddTeamPage/AddTeamPage.jsx` (from issue 01/02)

**Steps:**
1. Confirm the Flipper flag name with BE (same flag used in issue 01 — do not create a new one). **Do not merge this PR until the flag name is confirmed and substituted in all three locations listed above.**
2. Wrap the entire `AddTeamPage` render (or the CTA branching logic in T-3's handleSubmit) behind `rolloutActive('<CONFIRMED_FLAG_NAME>')` — import from `util/homebaseRollout.js:9`.
3. Verify: with flag OFF, the existing Add Team drawer behavior is unchanged; with flag ON, the new child page flow activates.

---

## PR Checklist

- [ ] `TimeOffSection` renders and `fetchPolicyOptions` is dispatched on mount
- [ ] Policy selects update Formik `time_off_policies.*` fields
- [ ] Balance input disabled when policy is "none"
- [ ] `OnboardingSection` renders conditionally (payroll OR AIO + NHO activated)
- [ ] CTA: non-payroll + no-invite → `addTeamMember` dispatched
- [ ] CTA: payroll OR invite checked → `browserHistory.push` to step-2 route
- [ ] Cancel: empty form → immediate close; populated form → ExitModal
- [ ] ExitModal: discard closes page; keep-editing dismisses modal
- [ ] Network error: flash shown, loading stopped, page remains open
- [ ] All new i18n keys verified present (no hardcoded English strings)
- [ ] TypeScript / prop-types satisfied (no new TS errors)
- [ ] Feature flag name confirmed with BE/infra and substituted in T-7, this checklist, and the `rolloutActive(...)` call — flag wraps the new page render — verified ON and OFF
- [ ] Tests pass: `jest --testPathPattern AddTeamPage`
