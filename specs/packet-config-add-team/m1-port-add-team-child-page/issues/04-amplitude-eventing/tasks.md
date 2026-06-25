---
issue: "04-amplitude-eventing"
approved: true
---

# Tasks — HRM-3224: Instrument Add Team Child Page with Amplitude Eventing

## File Plan (8 files)

> **Pre-task — locate the Job Details card component (required before starting T-4):**
> Run `grep -r classification client/src/features/team/pages/AddTeamPage` in the target repo to identify the component that renders the classification/employment-type select. Fill in the exact path for file plan entries #4 and #7 before executing those tasks.

| # | File | Action | Notes |
|---|------|--------|-------|
| 1 | `client/src/features/teamView/tracking.js` | Edit | Add `CLOSE_CLICKED` and `FIELD_FOCUSED` to `EVENT_ACTIONS` export |
| 2 | `client/src/features/team/pages/AddTeamPage/AddTeamPage.jsx` | Edit | Wire page impression, CTA-tap, Cancel-tap, and submission-outcome events. **Pre-condition:** this file must exist (created by issues 01–03) before this task can be executed. |
| 3 | `client/src/features/team/components/AddEmployeeForm/Sections/ContactSection/ContactSection.jsx` | Edit | Wire `onFocus` events for first name, last name, email, phone fields; wire `sendSms` checkbox click via `handleSendSmsChange` wrapper using `onClick` (T-4b) |
| 4 | Job Details card component (exact filename TBD — run pre-task grep above to locate) | Edit | Wire employment type and access level `onChange` events |
| 5 | `client/src/features/team/pages/AddTeamPage/AddTeamPage.test.jsx` | Edit | Add page-level eventing test cases (page impression, CTA-tap, Cancel-tap, submission outcomes). **Pre-condition:** same as file 2. |
| 6 | `client/src/features/team/components/AddEmployeeForm/Sections/ContactSection/ContactSection.test.jsx` | Create or Edit | Add field-focus tracking tests (first name, last name, email, phone) |
| 7 | Test file for the Job Details card component (exact filename TBD — same grep as #4) | Edit | Add dropdown and invite-checkbox tracking tests |
| 8 | `client/src/features/team/components/AddEmployeeForm/Sections/OnboardingSection/components/InviteOnlyCheckbox.jsx` | Edit | Accept and forward an `onClick` prop to `CheckboxField`; add `onClick` to PropTypes (T-4b) |

---

## Implementation Tasks

### T-1 — Extend `EVENT_ACTIONS` in `teamView/tracking.js`

**File:** `client/src/features/teamView/tracking.js`

Add two entries to the `EVENT_ACTIONS` object (after line 133):

```js
CLOSE_CLICKED: 'Close Clicked',   // mirrors util/tracking_constants.ts:599
FIELD_FOCUSED: 'Field Focused',   // mirrors util/tracking_constants.ts:677
```

No other changes to this file. Verify the file does not already contain these keys before adding.

---

### T-2 — Wire events in `AddTeamPage`

**File:** `client/src/features/team/pages/AddTeamPage/AddTeamPage.jsx`

> **Pre-condition:** `AddTeamPage.jsx` is created by issues 01–03 and must be merged before this task can be executed. The symbols referenced below (`handleSubmit`, `handleCancel`, `footerButtonText`, `setIsLoading`, `formHasContent`, `closePage`, `setIsExiting`) must be present in the completed file. Do not begin T-2 until issues 01–03 are approved and merged.

**T-2a: Page impression**

Add a `useEffect` with an empty dependency array (place it near the top of the component body, after prop destructuring):

```js
useEffect(() => {
  trackUxEvent({
    productArea: PRODUCT_AREAS.TEAM,
    eventCategory: EVENT_CATEGORIES.ADD_TEAM_DRAWER,
    eventAction: EVENT_ACTIONS.ADD_TEAM_DRAWER_SHOWN,
    properties: {
      called_from: calledFrom,
      form_type: FORM_TYPES.ADD_TEAM_INDIVIDUALLY,
    },
  });
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

`calledFrom` comes from Redux: add `calledFrom: selectCalledFrom(state)` to the `connect` mapStateToProps (or `useSelector`). Source: `features/team/selectors.js:14-15`.

**T-2b: CTA-tap event**

Wire the CTA-tap `trackUxEvent` call to a dedicated `onClick` handler on the submit button (e.g., `handleCtaClick`) that fires independently of Formik's `onSubmit`. This handler must fire on every button click, including when the form is invalid — Formik's `handleSubmit` only runs after validation passes, so placing this call inside `handleSubmit` will silently drop the event when required fields are empty or Yup errors are present (see AC-7 test case).

Add a `handleCtaClick` function in `AddTeamPage`:

```js
const handleCtaClick = useCallback(() => {
  const branch =
    formik.values.sendSms === false && !isIntegratedPayrollPartner
      ? 'add-only'
      : 'proceed-to-step-2';

  trackUxEvent({
    productArea: PRODUCT_AREAS.TEAM,
    eventCategory: EVENT_CATEGORIES.ADD_TEAM_DRAWER,
    eventAction: EVENT_ACTIONS.BUTTON_CLICKED,
    properties: {
      branch,
      button_text: footerButtonText,
    },
  });
}, [formik.values.sendSms, isIntegratedPayrollPartner, footerButtonText]);
```

Wire it to the submit button's `onClick` prop. Formik's existing `onSubmit` / `handleSubmit` continues to handle validation and form submission separately — do not move or remove that wiring.

**T-2c: Submission outcomes**

In `handleSubmit`, after the API call resolves, call `getUxTracking` — import it from `features/teamView/tracking.js:178`. Mirrors `AddTeamDrawerContainer.jsx:400-408` (success) and `367-378` (error).

**T-2d: Cancel event**

At the top of `handleCancel`, before the `formHasContent` check:

```js
trackUxEvent({
  productArea: PRODUCT_AREAS.TEAM,
  eventCategory: EVENT_CATEGORIES.ADD_TEAM_DRAWER,
  eventAction: EVENT_ACTIONS.CLOSE_CLICKED,
});
```

**Imports to add/verify in `AddTeamPage.jsx`:**

```js
import {
  DROPDOWN,
  EVENT_ACTIONS,
  EVENT_CATEGORIES,
  FORM_TYPES,
  getUxTracking,
  PRODUCT_AREAS,
} from 'features/teamView/tracking';
import { trackUxEvent } from 'util/tracking';
import { selectCalledFrom } from 'features/team/selectors';
```

---

### T-3 — Wire field-focus events in `ContactSection`

**File:** `client/src/features/team/components/AddEmployeeForm/Sections/ContactSection/ContactSection.jsx`

This file already imports `trackUxEvent` (line 40), `EVENT_ACTIONS`, `EVENT_CATEGORIES`, `PRODUCT_AREAS` from `features/teamView/tracking` (lines 30-35).

Add a shared handler:

```js
const handleFieldFocus = useCallback((fieldName) => {
  trackUxEvent({
    productArea: PRODUCT_AREAS.TEAM,
    eventCategory: EVENT_CATEGORIES.ADD_TEAM_DRAWER,
    eventAction: EVENT_ACTIONS.FIELD_FOCUSED,
    properties: { field_name: fieldName },
  });
}, []);
```

Add `onFocus` prop to each field in the JSX:
- First Name `TextField`: `onFocus={() => handleFieldFocus('first_name')}`
- Last Name `TextField`: `onFocus={() => handleFieldFocus('last_name')}`
- Email `TextField`: `onFocus={() => handleFieldFocus('email')}`
- Phone `PhoneField`: `onFocus={() => handleFieldFocus('phone')}`

> Check if `fe-design-base/molecules/TextField` and `fe-design-base/molecules/PhoneField` accept an `onFocus` prop and forward it to the native input. If not, use `onFocus` on the wrapping `Box` element as a fallback.

---

### T-4 — Wire employment type and access level events

**File:** The Job Details card component created in issue 02 (exact filename TBD — locate the component that renders the classification/employment-type select and the access level select in `AddTeamPage`).

Add `onChange` tracking wrappers:

```js
// Employment type / classification select:
const handleClassificationChange = useCallback((newValue) => {
  trackUxEvent({
    productArea: PRODUCT_AREAS.TEAM,
    eventCategory: EVENT_CATEGORIES.ADD_TEAM_DRAWER,
    eventAction: EVENT_ACTIONS.DROPDOWN_CLICKED,
    properties: {
      dropdown: DROPDOWN.CLASSIFICATION,   // 'classification' — tracking.js:62
      value: newValue,
    },
  });
  // Call the existing onChange / setFieldValue for this field
}, []);

// Access level select:
const handleAccessLevelChange = useCallback((newValue) => {
  trackUxEvent({
    productArea: PRODUCT_AREAS.TEAM,
    eventCategory: EVENT_CATEGORIES.ADD_TEAM_DRAWER,
    eventAction: EVENT_ACTIONS.DROPDOWN_CLICKED,
    properties: {
      dropdown: DROPDOWN.ACCESS_LEVEL,     // 'access_level' — tracking.js:59
      value: newValue,
    },
  });
  // Call the existing onChange / setFieldValue for this field
}, []);
```

**T-4b: Invite checkbox toggle**

`InviteOnlyCheckbox` (`features/team/components/AddEmployeeForm/Sections/OnboardingSection/components/InviteOnlyCheckbox.jsx`) renders a `CheckboxField` connected directly to Formik via `name='sendSms'` with no `onClick` prop exposed.

**Step 1 — add `handleSendSmsChange` in `ContactSection.jsx`:**

In `ContactSection.jsx`, add a tracking handler that receives the boolean `checked` value directly (the `fe-design-base` `Checkbox` atom calls `onClick?.(target.checked)`, not `onChange`) and pass it as `onClick` to `<InviteOnlyCheckbox />`:

```js
const handleSendSmsChange = useCallback((checked) => {
  // tracking only — Formik handles the field update via its own internal wiring
  trackUxEvent({
    productArea: PRODUCT_AREAS.TEAM,
    eventCategory: EVENT_CATEGORIES.ADD_TEAM_DRAWER,
    eventAction: EVENT_ACTIONS.CHECKBOX_CLICKED,
    properties: { checkbox: 'send_sms', checked },
  });
}, []);

// Pass as prop:
<InviteOnlyCheckbox onClick={handleSendSmsChange} />
```

> Use `onClick`, not `onChange`. The `Checkbox` atom (`client/lib/fe-design-base/atoms/Checkbox/Checkbox.tsx`) only calls `onClick?.(target.checked)` — it never invokes `onChange`. The argument is already a boolean; no `event.target.checked` unwrapping is needed. Do NOT call `formik.setFieldValue('sendSms', checked)` inside the handler — Formik handles the field update internally.

**Step 2 — update `InviteOnlyCheckbox.jsx` (file plan entry #8):**

Accept and forward an `onClick` prop to the `CheckboxField`, and add `onClick` to its PropTypes.

---

### T-5 — Tests

**File:** `client/src/features/team/pages/AddTeamPage/AddTeamPage.test.jsx`

Add the following test cases. Use `jest.mock('util/tracking', () => ({ trackUxEvent: jest.fn() }))` to spy on `trackUxEvent`, following the pattern in `AddTeamDrawerContainer.test.jsx`.

| Test | What to assert |
|---|---|
| `fires page impression on mount` | `trackUxEvent` called once with `eventAction = 'Add Team Drawer Shown'`, `properties.form_type = 'add_team_individually'`, `properties.called_from = <redux calledFrom value>` |
| `page impression fires only once, not on re-render` | Mount component, trigger a state change that causes re-render, assert `trackUxEvent` called exactly once with `ADD_TEAM_DRAWER_SHOWN` |
| `page impression with missing calledFrom sends empty string` | Set Redux `calledFrom` to `undefined`; assert `properties.called_from = ''` (or `undefined` — match actual behavior) |
| `CTA tap fires Button Clicked with branch add-only` | Render with `sendSms=false` and `isIntegratedPayrollPartner=false`; click CTA; assert `trackUxEvent` called with `properties.branch = 'add-only'` |
| `CTA tap fires Button Clicked with branch proceed-to-step-2 when sendSms=true` | Render with `sendSms=true`; click CTA; assert `properties.branch = 'proceed-to-step-2'` |
| `CTA tap fires Button Clicked with proceed-to-step-2 when payroll partner even if sendSms=false` | Render with `sendSms=false` and `isIntegratedPayrollPartner=true`; assert `properties.branch = 'proceed-to-step-2'` |
| `CTA tap event fires even when form is invalid` | Render with empty required fields; click CTA; assert the branch event fires even though submission does not proceed |
| `CTA tap event does NOT fire when button is disabled` | If the primary CTA is rendered as `disabled`, click should be a no-op; assert `trackUxEvent` NOT called (verify expected UX with issue 01/02 implementation) |
| `submission success calls getUxTracking with RESULT.SUCCESS` | Mock `addTeamMember` to resolve successfully; click CTA on finalize-add path; assert `getUxTracking` called with `RESULT.SUCCESS` |
| `submission error calls getUxTracking with RESULT.FAIL` | Mock `addTeamMember` to reject; assert `getUxTracking` called with `RESULT.FAIL` |
| `cancel tap fires Close Clicked` | Click Cancel; assert `trackUxEvent` called with `eventAction = 'Close Clicked'` |
| `cancel tap fires Close Clicked even when ExitModal opens` | Click Cancel with a populated form; assert `Close Clicked` fired AND `ExitModal` visible |

**ContactSection field-focus tests** — add to `client/src/features/team/components/AddEmployeeForm/Sections/ContactSection/ContactSection.test.jsx` (file plan entry 6; create if it does not exist):

| Test | What to assert |
|---|---|
| `first name focus fires Field Focused event` | Focus first name field; assert `trackUxEvent` with `properties.field_name = 'first_name'` |
| `last name focus fires Field Focused event` | Focus last name field; assert `properties.field_name = 'last_name'` |
| `email focus fires Field Focused event` | Focus email field; assert `properties.field_name = 'email'` |
| `phone focus fires Field Focused event` | Focus phone field; assert `properties.field_name = 'phone'` |
| `Field Focused does NOT fire on blur` | Focus then blur; assert only one call to `trackUxEvent` with `FIELD_FOCUSED` |
| `invite checkbox check fires Checkbox Clicked with checked=true` | Check the checkbox; assert `properties.checkbox = 'send_sms'`, `properties.checked = true` |
| `invite checkbox uncheck fires Checkbox Clicked with checked=false` | Uncheck the checkbox; assert `properties.checked = false` |
| `invite checkbox event does not fire when OnboardingSection is hidden` | Render with `isPayrollEnrolled=false` and AIO off; assert no checkbox event ever fires |

**Dropdown tests** — add to the Job Details card test file (file plan entry 7 — exact filename from issue 02):

| Test | What to assert |
|---|---|
| `employment type change fires Dropdown Clicked with classification` | Change classification select; assert `properties.dropdown = 'classification'`, `properties.value = <new value>` |
| `access level change fires Dropdown Clicked with access_level` | Change access level select; assert `properties.dropdown = 'access_level'`, `properties.value = <new value>` |

---

## PR Checklist

- [ ] `EVENT_ACTIONS.CLOSE_CLICKED` and `EVENT_ACTIONS.FIELD_FOCUSED` added to `teamView/tracking.js` — no duplicate keys
- [ ] Page impression `useEffect` has empty dependency array and the `eslint-disable` comment
- [ ] `calledFrom` is connected to `AddTeamPage` via `selectCalledFrom` from `features/team/selectors.js:14-15`
- [ ] `properties.called_from` is snake_case (matches existing `getUxTracking` property naming at `teamView/tracking.js:203-232`)
- [ ] CTA-tap event fires before `setIsLoading(true)` — not gated behind the API call
- [ ] `getUxTracking` success path called on `RESULT.SUCCESS`; error paths called on `RESULT.FAIL`
- [ ] Cancel event fires before the `formHasContent` conditional check
- [ ] `onFocus` added to all four Contact fields
- [ ] Employment type `onChange` wrapper does not break existing Formik `setFieldValue` call
- [ ] Access level `onChange` wrapper does not break existing Formik `setFieldValue` call
- [ ] Invite checkbox `handleSendSmsChange` uses `onClick` (not `onChange`) and receives a boolean `checked` directly — does NOT call `formik.setFieldValue('sendSms', checked)`; the handler is for tracking only
- [ ] All `trackUxEvent` calls follow the no-destructuring rule — always `PRODUCT_AREAS.TEAM`, never `const { TEAM } = PRODUCT_AREAS`
- [ ] Tests mock `util/tracking.trackUxEvent` and `features/teamView/tracking.getUxTracking`
- [ ] All new test cases pass: `jest --testPathPattern AddTeamPage`
- [ ] No TypeScript or PropTypes errors introduced
