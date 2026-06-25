---
issue: "04-amplitude-eventing"
approved: true
---

# Design — HRM-3224: Instrument Add Team Child Page with Amplitude Eventing

## 1. Overview

This issue adds tracking calls to `AddTeamPage` and its section components. No new UI components are introduced. The tracking pattern follows `AddTeamDrawerContainer.jsx` exactly — `trackUxEvent` from `util/tracking.js:212`, constants from `client/src/features/teamView/tracking.js`.

**Rule:** never destructure `PRODUCT_AREAS`, `EVENT_CATEGORIES`, or `EVENT_ACTIONS` at the top of the implementing file. Always reference as `PRODUCT_AREAS.X`, `EVENT_CATEGORIES.X`, `EVENT_ACTIONS.X`.

---

## 2. Tracking Constants Reference

All constants used in this issue come from two files:

### `client/src/features/teamView/tracking.js`

| Constant | Key | String value | Line |
|---|---|---|---|
| `PRODUCT_AREAS.TEAM` | `TEAM` | `'team'` | 86 |
| `EVENT_CATEGORIES.ADD_TEAM_DRAWER` | `ADD_TEAM_DRAWER` | `'add_team_drawer'` | 90 |
| `EVENT_ACTIONS.ADD_TEAM_DRAWER_SHOWN` | `ADD_TEAM_DRAWER_SHOWN` | `'Add Team Drawer Shown'` | 107 |
| `EVENT_ACTIONS.BUTTON_CLICKED` | `BUTTON_CLICKED` | `'Button Clicked'` | 113 |
| `EVENT_ACTIONS.CHECKBOX_CLICKED` | `CHECKBOX_CLICKED` | `'Checkbox Clicked'` | 114 |
| `EVENT_ACTIONS.DROPDOWN_CLICKED` | `DROPDOWN_CLICKED` | `'Dropdown Clicked'` | 116 |
| `EVENT_ACTIONS.ERROR_MESSAGE_SHOWN` | `ERROR_MESSAGE_SHOWN` | `'Error Message Shown'` | 117 |
| `EVENT_ACTIONS.PAGE_VIEWED` | `PAGE_VIEWED` | `'Page Viewed'` | 121 |
| `DROPDOWN.CLASSIFICATION` | `CLASSIFICATION` | `'classification'` | 62 |
| `DROPDOWN.ACCESS_LEVEL` | `ACCESS_LEVEL` | `'access_level'` | 59 |
| `getUxTracking` | — | function | 178 |

### `client/src/util/tracking_constants.ts` (for constants not yet in teamView/tracking.js)

| Constant | String value | Line |
|---|---|---|
| `EVENT_ACTIONS.FIELD_FOCUSED` (tracking_constants.ts) | `'Field Focused'` | 677 |
| `EVENT_ACTIONS.CLOSE_CLICKED` (tracking_constants.ts) | `'Close Clicked'` | 599 |

> Before implementing: add `FIELD_FOCUSED: 'Field Focused'` and `CLOSE_CLICKED: 'Close Clicked'` to the `EVENT_ACTIONS` export in `teamView/tracking.js`. This avoids importing from two separate constants files in the implementing component.

---

## 3. Where Each Event Is Wired

### 3.1 Page Impression — `AddTeamPage`

```js
// client/src/features/team/pages/AddTeamPage/AddTeamPage.jsx
useEffect(() => {
  trackUxEvent({
    productArea: PRODUCT_AREAS.TEAM,
    eventCategory: EVENT_CATEGORIES.ADD_TEAM_DRAWER,
    eventAction: EVENT_ACTIONS.ADD_TEAM_DRAWER_SHOWN,
    properties: {
      called_from: calledFrom,   // from Redux: selectCalledFrom(state) — selectors.js:14-15
      form_type: 'add_team_individually',  // FORM_TYPES.ADD_TEAM_INDIVIDUALLY — tracking.js:103
    },
  });
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

Pattern mirrors `AddTeamDrawerContainer.jsx:188-201`. The `calledFrom` value is read from Redux via `selectCalledFrom` (`features/team/selectors.js:14-15`), which reads from `state.getIn([SLICE_NAME, 'calledFrom'])` populated by `openAddTeamDrawer({ calledFrom })` (`features/team/slice.js:23, 33`).

---

### 3.2 Field Interactions — `ContactSection`

The tracking calls are added to `client/src/features/team/components/AddEmployeeForm/Sections/ContactSection/ContactSection.jsx`. This file already imports `trackUxEvent` (line 40) and `EVENT_ACTIONS`, `EVENT_CATEGORIES`, `PRODUCT_AREAS` from `features/teamView/tracking` (lines 30-35).

Add `onFocus` handlers to each `TextField` and `PhoneField`:

```js
const handleFieldFocus = useCallback((fieldName) => {
  trackUxEvent({
    productArea: PRODUCT_AREAS.TEAM,
    eventCategory: EVENT_CATEGORIES.ADD_TEAM_DRAWER,
    eventAction: EVENT_ACTIONS.FIELD_FOCUSED,  // 'Field Focused' — tracking_constants.ts:677
    properties: { field_name: fieldName },
  });
}, []);
```

Wire to each field:
- First Name `TextField`: `onFocus={() => handleFieldFocus('first_name')}`
- Last Name `TextField`: `onFocus={() => handleFieldFocus('last_name')}`
- Email `TextField`: `onFocus={() => handleFieldFocus('email')}`
- Phone `PhoneField`: `onFocus={() => handleFieldFocus('phone')}`

> The `ContactSection` component already uses `trackUxEvent` in several handlers (lines 88, 106, 127, 184). Adding `onFocus` tracking follows the same existing pattern.

---

### 3.3 Employment Type Change

Employment type (classification) is rendered in the Job Details card. The exact component path needs to be confirmed against the implementation from issue 02, but the pattern is:

```js
// In whatever component renders the classification/employment-type select:
const handleClassificationChange = useCallback((newValue) => {
  trackUxEvent({
    productArea: PRODUCT_AREAS.TEAM,
    eventCategory: EVENT_CATEGORIES.ADD_TEAM_DRAWER,
    eventAction: EVENT_ACTIONS.DROPDOWN_CLICKED,   // tracking.js:116
    properties: {
      dropdown: DROPDOWN.CLASSIFICATION,           // 'classification' — tracking.js:62
      value: newValue,
    },
  });
  // ... existing onChange logic
}, []);
```

---

### 3.4 Access Level Change

Access level is also in the Job Details card:

```js
const handleAccessLevelChange = useCallback((newValue) => {
  trackUxEvent({
    productArea: PRODUCT_AREAS.TEAM,
    eventCategory: EVENT_CATEGORIES.ADD_TEAM_DRAWER,
    eventAction: EVENT_ACTIONS.DROPDOWN_CLICKED,   // tracking.js:116
    properties: {
      dropdown: DROPDOWN.ACCESS_LEVEL,             // 'access_level' — tracking.js:59
      value: newValue,
    },
  });
  // ... existing onChange logic
}, []);
```

---

### 3.5 Invite Checkbox Toggle

The `InviteOnlyCheckbox` component is at `client/src/features/team/components/AddEmployeeForm/Sections/OnboardingSection/components/InviteOnlyCheckbox.jsx`. Add tracking via an `onClick` prop — the `fe-design-base` `Checkbox` atom calls `onClick(checked: boolean)` and never calls `onChange`, so intercepting `onChange` will silently not fire.

```js
// In ContactSection (or the parent that renders InviteOnlyCheckbox):
const handleSendSmsChange = useCallback((checked: boolean) => {
  // tracking only — Formik handles the field update via its own internal wiring
  trackUxEvent({
    productArea: PRODUCT_AREAS.TEAM,
    eventCategory: EVENT_CATEGORIES.ADD_TEAM_DRAWER,
    eventAction: EVENT_ACTIONS.CHECKBOX_CLICKED,   // tracking.js:114
    properties: {
      checkbox: 'send_sms',   // Formik field name — constants.js:128
      checked,
    },
  });
}, []);

// Pass as prop:
<InviteOnlyCheckbox onClick={handleSendSmsChange} />
```

> Use `onClick`, not `onChange`. The `Checkbox` atom (`client/lib/fe-design-base/atoms/Checkbox/Checkbox.tsx`) calls `onClick?.(target.checked)` — it never invokes `onChange`. The `checked` argument is already the boolean new state; no `event.target.checked` unwrapping is needed. Do NOT call `formik.setFieldValue('sendSms', checked)` inside the handler — Formik handles the field update internally.

---

### 3.6 Primary CTA Tap

In `AddTeamPage`, the CTA `branch` property is computed from current Formik values at click time. The tracking call must fire from a dedicated `onClick` handler on the submit button — **not** inside Formik's `handleSubmit` / `onSubmit`. Formik only invokes `onSubmit` after validation passes; if required fields are empty or Yup errors are present, `handleSubmit` never runs and the event would be silently dropped. Wiring to `onClick` ensures the event fires on every click, regardless of form validity (see requirements 2.6 and AC-7):

```js
// In AddTeamPage — wire to the submit button's onClick prop via a dedicated handleCtaClick:
const branch =
  values.sendSms === false && !isIntegratedPayrollPartner
    ? 'add-only'
    : 'proceed-to-step-2';

trackUxEvent({
  productArea: PRODUCT_AREAS.TEAM,
  eventCategory: EVENT_CATEGORIES.ADD_TEAM_DRAWER,
  eventAction: EVENT_ACTIONS.BUTTON_CLICKED,    // tracking.js:113
  properties: {
    branch,
    button_text: footerButtonText,  // the i18n string for the CTA label
  },
});
```

`isIntegratedPayrollPartner` is from `getCurrentLocationIsIntegratedPayrollPartner(state)` — `selectors/addTeam.js:57-58`. `sendSms` is the Formik field name from `constants.js:128`.

---

### 3.7 Submission Outcomes

Reuse `getUxTracking` from `teamView/tracking.js:178`:

```js
// Success path (mirrors AddTeamDrawerContainer.jsx:400-408):
getUxTracking(
  values,
  isAdding,
  isAIOLocation,
  currentLocationTierId,
  RESULT.SUCCESS,
  false,
  isPayrollEnrolled
);

// Error path (mirrors AddTeamDrawerContainer.jsx:367-378):
getUxTracking(
  values,
  isAdding,
  isAIOLocation,
  currentLocationTierId,
  RESULT.FAIL,
  hasContactInfoRequiredError,
  isPayrollEnrolled
);
```

`RESULT` is imported from `features/team/constants`. `getUxTracking` internally calls `trackUxEvent` with `eventAction: EVENT_ACTIONS.BUTTON_CLICKED` and a rich `properties` object (`teamView/tracking.js:197-232`).

---

### 3.8 Cancel Tap

In `AddTeamPage`, the existing `handleCancel` is modified to fire a tracking event before the conditional `ExitModal` logic:

```js
const handleCancel = useCallback(
  (values) => {
    trackUxEvent({
      productArea: PRODUCT_AREAS.TEAM,
      eventCategory: EVENT_CATEGORIES.ADD_TEAM_DRAWER,
      eventAction: EVENT_ACTIONS.CLOSE_CLICKED,    // 'Close Clicked' — tracking_constants.ts:599
    });

    if (formHasContent(values)) {
      setIsExiting(true);
    } else {
      closePage();
    }
  },
  // setIsExiting is stable by React's useState contract.
  // closePage is a Redux dispatch wrapper — verify it is stable (wrapped in useCallback or
  // useDispatch-derived) in the issue 01–03 implementation; if not, include it here.
  // formHasContent must be listed if it is not a module-level pure function.
  [formHasContent, setIsExiting, closePage]
);
```

---

## 4. New Additions to `teamView/tracking.js`

Add the following entries to the `EVENT_ACTIONS` export in `client/src/features/teamView/tracking.js`:

```js
// Add to EVENT_ACTIONS object (line 105+):
CLOSE_CLICKED: 'Close Clicked',     // mirrors tracking_constants.ts:599
FIELD_FOCUSED: 'Field Focused',     // mirrors tracking_constants.ts:677
```

These are the only changes to `teamView/tracking.js`. No other constants or exports change.

---

## 5. Instrumentation Map (File → Events)

| File | Events Added |
|---|---|
| `features/team/pages/AddTeamPage/AddTeamPage.jsx` | Page impression (2.1), CTA tap (2.6), Cancel tap (2.9), submission outcomes via `getUxTracking` (2.7, 2.8) |
| `features/team/components/AddEmployeeForm/Sections/ContactSection/ContactSection.jsx` | Field focus events for first name, last name, email, phone (2.2) |
| Job Details card component (from issue 02 — exact filename TBD) | Employment type change (2.3), Access level change (2.4) |
| `features/team/components/AddEmployeeForm/Sections/OnboardingSection/components/InviteOnlyCheckbox.jsx` or `OnboardingSection.jsx` | Invite checkbox toggle (2.5) |
| `features/teamView/tracking.js` | Add `CLOSE_CLICKED` and `FIELD_FOCUSED` to `EVENT_ACTIONS` |

---

## 6. User-Visible Strings

N/A — this issue introduces no new UI components, labels, or i18n strings. All instrumented events are fire-and-forget analytics calls with no visible effect on the UI.

---

## 7. Design References

- Figma: https://www.figma.com/design/HSvGEOyEmuDtUGcpOQ8Xpy/New-Hire-Packets---Documents?node-id=1472-12930 (no new design work required for this issue)
- Existing tracking pattern: `AddTeamDrawerContainer.jsx:188-201` (page impression), `AddTeamDrawerContainer.jsx:226-238` (error event), `teamView/tracking.js:178-233` (`getUxTracking` function)

---

## 8. Open Design Questions

| # | Question | Default assumption |
|---|----------|-------------------|
| D-1 | Should field focus events be fired only on the first focus, or on every focus? | Every focus, same as the pattern for other `onFocus` events in the codebase. No `useRef` guard needed. |
| D-2 | Should `called_from` use camelCase or snake_case as the property key? | `snake_case` (`called_from`) — all other `properties` in `getUxTracking` are snake_case (`teamView/tracking.js:203-232`). |
| D-3 | The `proceed-to-step-2` branch only applies to Step 1 — should the CTA-tap event include a `step` property? | No `step` property for M1. M2 will add Step 2 instrumentation separately. |
