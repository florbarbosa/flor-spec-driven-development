---
issue: "04-amplitude-eventing"
milestone: "m1-port-add-team-child-page"
linear_issue_id: "HRM-3224"
linear_issue_url: "https://linear.app/joinhomebase/issue/HRM-3224"
depends_on: ["01-shell-page-routing", "02-form-sections", "03-time-off-cta-branching"]
approved: true
---

# Requirements — HRM-3224: Instrument Add Team Child Page with Amplitude Eventing

## 1. Summary

Add Amplitude instrumentation to the Add Team child page (Step 1 only). This issue wires tracking calls into the page component and its child sections that were created by issues HRM-3221 through HRM-3223. No new UI surfaces are introduced.

All events use `trackUxEvent` from `util/tracking.js` (line 212) and the constants defined in `client/src/features/teamView/tracking.js`. The tracking constants file must never be destructured at the top of the implementing file — each constant is referenced as `PRODUCT_AREAS.X`, `EVENT_CATEGORIES.X`, `EVENT_ACTIONS.X`.

---

## 2. Event Inventory

### 2.1 Page Impression

**Event:** `Add Team Drawer Shown` (reuse of existing event name — the child page is the successor to the drawer)

| Field | Value | Source |
|---|---|---|
| `productArea` | `PRODUCT_AREAS.TEAM` → `'team'` | `teamView/tracking.js:86` |
| `eventCategory` | `EVENT_CATEGORIES.ADD_TEAM_DRAWER` → `'add_team_drawer'` | `teamView/tracking.js:90` |
| `eventAction` | `EVENT_ACTIONS.ADD_TEAM_DRAWER_SHOWN` → `'Add Team Drawer Shown'` | `teamView/tracking.js:107` |
| `properties.called_from` | value of `calledFrom` from Redux state | `features/team/slice.js:33`, `features/team/selectors.js:14-15` |
| `properties.form_type` | `'add_team_individually'` (always, since the child page only serves the individual form path) | `teamView/tracking.js:101-104` |

**Trigger:** once on mount of `AddTeamPage`, in a `useEffect` with an empty dependency array (mirrors the existing drawer at `AddTeamDrawerContainer.jsx:188-201`).

**Deduplication:** the empty-deps `useEffect` fires exactly once per mount. If the component unmounts and remounts (e.g. user navigates away and returns), the event fires again — this is the same behavior as the drawer and is acceptable.

---

### 2.2 Field Interactions (Focus)

Each text/phone field in the Contact card fires a `FIELD_FOCUSED` event when the OAM focuses the input for the first time.

| Event field | Value | Source |
|---|---|---|
| `productArea` | `PRODUCT_AREAS.TEAM` | `teamView/tracking.js:86` |
| `eventCategory` | `EVENT_CATEGORIES.ADD_TEAM_DRAWER` | `teamView/tracking.js:90` |
| `eventAction` | `EVENT_ACTIONS.FIELD_FOCUSED` → `'Field Focused'` | `util/tracking_constants.ts:677` (must be added to `teamView/tracking.js EVENT_ACTIONS`) |
| `properties.field_name` | one of: `'first_name'`, `'last_name'`, `'email'`, `'phone'` | — |

**Trigger:** `onFocus` handler on each `TextField` / `PhoneField` in `ContactSection`. The existing `ContactSection` component does not have field-focus tracking today — this is new.

---

### 2.3 Employment Type (Classification) Change

Fires when the OAM changes the employment type dropdown in the Job Details card.

| Event field | Value | Source |
|---|---|---|
| `productArea` | `PRODUCT_AREAS.TEAM` | `teamView/tracking.js:86` |
| `eventCategory` | `EVENT_CATEGORIES.ADD_TEAM_DRAWER` | `teamView/tracking.js:90` |
| `eventAction` | `EVENT_ACTIONS.DROPDOWN_CLICKED` → `'Dropdown Clicked'` | `teamView/tracking.js:116` |
| `properties.dropdown` | `DROPDOWN.CLASSIFICATION` → `'classification'` | `teamView/tracking.js:62` |
| `properties.value` | the new classification value (e.g. `'employee'`, `'contractor'`) | — |

**Trigger:** `onChange` on the employment type / classification select field.

---

### 2.4 Access Level Change

Fires when the OAM changes the access level dropdown.

| Event field | Value | Source |
|---|---|---|
| `productArea` | `PRODUCT_AREAS.TEAM` | `teamView/tracking.js:86` |
| `eventCategory` | `EVENT_CATEGORIES.ADD_TEAM_DRAWER` | `teamView/tracking.js:90` |
| `eventAction` | `EVENT_ACTIONS.DROPDOWN_CLICKED` → `'Dropdown Clicked'` | `teamView/tracking.js:116` |
| `properties.dropdown` | `DROPDOWN.ACCESS_LEVEL` → `'access_level'` | `teamView/tracking.js:59` |
| `properties.value` | the new access level value | — |

**Trigger:** `onChange` on the access level select field.

---

### 2.5 Invite Checkbox Toggle

Fires when the OAM checks or unchecks the "Invite this person" (`sendSms`) checkbox in the Onboarding section.

| Event field | Value | Source |
|---|---|---|
| `productArea` | `PRODUCT_AREAS.TEAM` | `teamView/tracking.js:86` |
| `eventCategory` | `EVENT_CATEGORIES.ADD_TEAM_DRAWER` | `teamView/tracking.js:90` |
| `eventAction` | `EVENT_ACTIONS.CHECKBOX_CLICKED` → `'Checkbox Clicked'` | `teamView/tracking.js:114` |
| `properties.checkbox` | `'send_sms'` | Formik field name from `constants.js:128` |
| `properties.checked` | `true` or `false` (the new state after toggle) | — |

**Trigger:** `onClick` prop on `InviteOnlyCheckbox` — the `fe-design-base` `Checkbox` atom calls `onClick(checked: boolean)` and does not call `onChange`. Wire the handler to `onClick`, not `onChange`. The event must use the _new_ value (the value after the toggle, not before).

---

### 2.6 Primary CTA Tap

Fires when the OAM taps the primary CTA. This event fires regardless of whether the form is valid — it fires on the click, before validation runs.

| Event field | Value | Source |
|---|---|---|
| `productArea` | `PRODUCT_AREAS.TEAM` | `teamView/tracking.js:86` |
| `eventCategory` | `EVENT_CATEGORIES.ADD_TEAM_DRAWER` | `teamView/tracking.js:90` |
| `eventAction` | `EVENT_ACTIONS.BUTTON_CLICKED` → `'Button Clicked'` | `teamView/tracking.js:113` |
| `properties.branch` | `'add-only'` if `sendSms === false && !isIntegratedPayrollPartner`; else `'proceed-to-step-2'` | branching logic from `AddTeamDrawerContainer.jsx:362-456` and issue 03 spec |
| `properties.button_text` | the CTA button label string | — |

**Trigger:** `onClick` (or `onSubmit`) handler of the primary CTA button, before the async `handleSubmit` logic runs.

> Note: this event fires on every tap attempt. If the form is invalid (Yup validation fails), the event still fires with `branch` computed from the current form values at click time. The `getUxTracking` call in `handleSubmit` (which records success/fail of the actual API call) is a separate event (see AC 2.7–2.8 below).

---

### 2.7 Submission — Success

Reuses the existing `getUxTracking` call pattern from `teamView/tracking.js:178-233`.

| Event field | Value | Source |
|---|---|---|
| `productArea` | `PRODUCT_AREAS.TEAM` | `teamView/tracking.js:197` |
| `eventCategory` | `EVENT_CATEGORIES.ADD_TEAM_DRAWER` | `teamView/tracking.js:198` |
| `eventAction` | `EVENT_ACTIONS.BUTTON_CLICKED` | `teamView/tracking.js:200` |
| `properties.result` | `RESULT.SUCCESS` → `'success'` | `features/team/constants.js`, referenced at `AddTeamDrawerContainer.jsx:405` |
| (plus standard `getUxTracking` properties) | see `teamView/tracking.js:203-232` | — |

**Trigger:** called via `getUxTracking(values, ..., RESULT.SUCCESS, ...)` after a successful `addTeamMember` API response on the finalize-add branch (mirrors `AddTeamDrawerContainer.jsx:400-408`).

---

### 2.8 Submission — Error

| Event field | Value | Source |
|---|---|---|
| `productArea` | `PRODUCT_AREAS.TEAM` | `teamView/tracking.js:197` |
| `eventCategory` | `EVENT_CATEGORIES.ADD_TEAM_DRAWER` | `teamView/tracking.js:198` |
| `eventAction` | `EVENT_ACTIONS.BUTTON_CLICKED` | `teamView/tracking.js:200` |
| `properties.result` | `RESULT.FAIL` → `'fail'` | `features/team/constants.js`, referenced at `AddTeamDrawerContainer.jsx:372` |
| (plus standard `getUxTracking` properties) | see `teamView/tracking.js:203-232` | — |

**Trigger:** called via `getUxTracking(values, ..., RESULT.FAIL, ...)` after a failed `addTeamMember` response, or in the catch block (mirrors `AddTeamDrawerContainer.jsx:367-378`, `444-454`).

> Note: error messages are tracked separately via a distinct `trackUxEvent` call with `eventAction: EVENT_ACTIONS.ERROR_MESSAGE_SHOWN` and `properties: { error_msg }`. This is a SEPARATE event from the `BUTTON_CLICKED` result event above — it mirrors `AddTeamDrawerContainer.jsx:226-238`. `error_msg` is NOT a property of `getUxTracking` / the `BUTTON_CLICKED` event.

---

### 2.9 Cancel Tap

| Event field | Value | Source |
|---|---|---|
| `productArea` | `PRODUCT_AREAS.TEAM` | `teamView/tracking.js:86` |
| `eventCategory` | `EVENT_CATEGORIES.ADD_TEAM_DRAWER` | `teamView/tracking.js:90` |
| `eventAction` | `EVENT_ACTIONS.CLOSE_CLICKED` → `'Close Clicked'` | `util/tracking_constants.ts:599` (must be added to `teamView/tracking.js EVENT_ACTIONS`) |

**Trigger:** when the OAM taps Cancel. Fires before the `ExitModal` is shown (if applicable). Does NOT fire a second time when the OAM confirms discard in the `ExitModal`.

---

## 3. Acceptance Criteria

### AC-1 — Page impression fires once on mount

**Given** the OAM navigates to `/team/add`
**When** `AddTeamPage` mounts
**Then** one `trackUxEvent` call fires with `eventAction = 'Add Team Drawer Shown'`
**AND** `properties.called_from` equals the `calledFrom` value in Redux state
**AND** `properties.form_type` equals `'add_team_individually'`

### AC-2 — Page impression includes calledFrom from all entry points

**Given** each entry point sets `calledFrom` before navigating to `/team/add`

The known `calledFrom` values passed by each entry point are:

| Entry Point | `calledFrom` value | Source |
|---|---|---|
| Team Roster (AddTeamMemberButton) | `PRODUCT_AREAS.TEAM` → `'team'` | `teamView/TeamView/TeamHeader/ActionButtons/AddTeamMemberButton/AddTeamMemberButton.jsx:61` |
| Team Roster (AddEmployeesButton) | `PRODUCT_AREAS.TEAM` → `'team'` | `teamView/TeamView/TeamHeader/AddEmployeesButton/AddEmployeesButton.jsx:64` |
| Timesheets (AddEmployeeRow) | `PRODUCT_AREAS.TIMESHEETS` → `'timesheets'` | `timesheets/TimesheetsPage/PayPeriodReviewView/TimesheetsTable/TableRows/AddEmployeeRow.jsx:49` |
| Schedule Builder (AddEmployee) | `'schedule_builder'` | `scheduleBuilder/ScheduleBuilderView/EmployeeWeekView/AddEmployee.jsx:100` |
| Schedule Builder (MenuDropDown) | `'schedule_builder'` | `scheduleBuilder/ScheduleBuilderView/Header/ToolsMenu/MenuDropDown.jsx:649` |
| Quick Start Guide | `PRODUCT_AREAS.QUICK_START_GUIDE` → `'quick_start_guide'` | `onboarding/QuickStartGuide/components/Module/TeamInviteBanner.jsx:18` |

**When** the page impression event fires
**Then** `properties.called_from` reflects the value that was set by the originating entry point.

> Note: Entry points must also write `calledFrom` into Redux state via `openAddTeamDrawer({ calledFrom })` before pushing the `/team/add` route. This is an implicit dependency on the issue 01 shell wiring.

### AC-3 — Field focus events fire for each Contact field

**Given** `AddTeamPage` is mounted
**When** the OAM focuses the First Name field
**Then** `trackUxEvent` fires with `eventAction = 'Field Focused'` and `properties.field_name = 'first_name'`

Same for: Last Name (`'last_name'`), Email (`'email'`), Phone (`'phone'`).

### AC-4 — Employment type change fires dropdown event

**Given** the OAM is on `AddTeamPage`
**When** the OAM changes the employment type select
**Then** `trackUxEvent` fires with `eventAction = 'Dropdown Clicked'`, `properties.dropdown = 'classification'`, and `properties.value` = the new value.

### AC-5 — Access level change fires dropdown event

**When** the OAM changes the access level select
**Then** `trackUxEvent` fires with `eventAction = 'Dropdown Clicked'`, `properties.dropdown = 'access_level'`, and `properties.value` = the new value.

### AC-6 — Invite checkbox toggle fires checkbox event

**When** the OAM checks the invite checkbox
**Then** `trackUxEvent` fires with `eventAction = 'Checkbox Clicked'`, `properties.checkbox = 'send_sms'`, and `properties.checked = true`.

**When** the OAM unchecks the invite checkbox
**Then** the same event fires with `properties.checked = false`.

### AC-7 — Primary CTA tap fires with correct branch

**Given** the OAM has `sendSms = false` and the company is not on payroll
**When** the OAM taps the primary CTA
**Then** `trackUxEvent` fires with `eventAction = 'Button Clicked'` and `properties.branch = 'add-only'`.

**Given** `sendSms = true` OR `isIntegratedPayrollPartner = true`
**When** the OAM taps the primary CTA
**Then** `properties.branch = 'proceed-to-step-2'`.

### AC-8 — Submission success fires getUxTracking with RESULT.SUCCESS

**Given** the finalize-add path runs and `addTeamMember` succeeds
**Then** `getUxTracking(values, ..., RESULT.SUCCESS, ...)` is called (from `teamView/tracking.js:197`).

### AC-9 — Submission error fires getUxTracking with RESULT.FAIL

**Given** the `addTeamMember` API returns an error or the catch block runs
**Then** `getUxTracking(values, ..., RESULT.FAIL, ...)` is called.

### AC-10 — Cancel tap fires close event

**When** the OAM taps Cancel (regardless of form content)
**Then** `trackUxEvent` fires with `eventAction = 'Close Clicked'` before the `ExitModal` opens (if applicable).

---

## 4. Non-Goals

- Eventing for Step 2 — that is M2.
- Eventing for the Roster onboarding column — that is M2.
- Any new UI surfaces — this issue instruments existing components only.
- Changing event names or constants that are already in use by the legacy drawer. The child page reuses the same `ADD_TEAM_DRAWER` category so analytics dashboards based on the drawer remain consistent during the migration.
- `FIELD_FOCUSED` events for the Job Details role/wage fields — out of scope for this issue.
- Tracking of the ExitModal "discard" vs "keep editing" buttons — out of scope.

---

## 5. Edge Cases

| # | Scenario | Expected Behavior |
|---|----------|-------------------|
| E-1 | `calledFrom` is missing from Redux state (e.g., OAM navigates directly to `/team/add` without going through an instrumented entry point) | `selectCalledFrom` returns `undefined` or `''` (`selectors.js:14-15`). The page impression event fires with `properties.called_from = ''` — the event is not suppressed. |
| E-2 | Primary CTA tapped when Formik validation is invalid (form has errors) | The CTA-tap event fires with the current `branch` computed from form values. Formik's `onSubmit` does not run — `getUxTracking` is NOT called. The CTA event and the submission-outcome event are therefore decoupled. |
| E-3 | Page impression fires on re-render due to parent state change | Because the `useEffect` has an empty dependency array, it fires only once per mount. Any re-renders caused by Formik or Redux state changes do not fire a duplicate impression. |
| E-4 | Invite checkbox rendered inside a conditional section (`OnboardingSection` only shown when `isPayrollEnrolled || (isAIOLocation && NHO activated)`) | If `OnboardingSection` is not rendered, the checkbox `onChange` handler is never registered and no checkbox event fires. This is correct — the event must only fire when the checkbox is actually interactable. |
| E-5 | OAM changes employment type multiple times in the same session | Each `onChange` call fires an independent `DROPDOWN_CLICKED` event. No deduplication is applied — each change is a distinct user action. |
| E-6 | `getUxTracking` on the finalize-add path: `contactInfoRequiredError` fires (packet option selected but no email/phone) | `getUxTracking(..., RESULT.FAIL, hasContactInfoRequiredError=true, ...)` is called before the form returns early. The `missing_phone_email_error` property in the event payload is set to `'yes'`. Source: `teamView/tracking.js:191`, `AddTeamDrawerContainer.jsx:352-361`. |

---

## 6. Out-of-Scope Flags / Questions

- `EVENT_ACTIONS.FIELD_FOCUSED` and `EVENT_ACTIONS.CLOSE_CLICKED` do not currently exist in `teamView/tracking.js`. They must be added to the `EVENT_ACTIONS` export in that file before they can be used. The underlying string values are already defined in `util/tracking_constants.ts` (lines 677 and 599 respectively) and can be referenced directly as string literals as a fallback if the teamView file is not modified.
- Confirm with the data team whether `called_from` or `calledFrom` (camelCase vs snake_case) is preferred as the property name. All existing `properties` objects in this codebase use snake_case (e.g., `form_type`, `button_text`, `error_msg` at `teamView/tracking.js:203-232`).
- The `proceed-to-step-2` branch value for the CTA `branch` property is a new string. Confirm with the data team that this is the desired value.
