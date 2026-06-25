---
issue: "03-time-off-cta-branching"
milestone: "m1-port-add-team-child-page"
linear_issue_id: "HRM-3223"
linear_issue_url: "https://linear.app/joinhomebase/issue/HRM-3223"
depends_on: ["01-child-page-shell", "02-contact-job-details-cards"]
approved: true
---

# Requirements — HRM-3223: Add Time Off Section and CTA Branching

## 1. Summary

Port the **Time Off policies section** and **Onboarding Documents section** from the legacy `AddTeamDrawerContainer` into the new Add Team child page (Step 1). Wire the primary CTA to branch based on invite intent and payroll status: if neither the invite checkbox is checked nor the company is on payroll, finalize the add immediately by calling the existing `addTeamMember` action; otherwise navigate to the Step 2 route (placeholder — just a `browserHistory.push`). Wire Cancel to exit without saving.

---

## 2. Acceptance Criteria

### AC-1 — Time Off Section renders in child page

**Given** the OAM is on the Add Team child page (Step 1)
**When** the page loads
**Then** the `TimeOffSection` component renders below the Job Details card.

- `TimeOffSection` dispatches `fetchPolicyOptions` on mount via the `addEmployeeForm` slice (`client/src/features/team/components/AddEmployeeForm/slice.ts:26-36`).
- If only one PTO option and one sick-leave option exist (both default "No policy"), `TimeOffSection` renders `null` and nothing appears (`client/src/features/team/components/AddEmployeeForm/Sections/TimeOffSection/TimeOffSection.tsx:28-30`).
- If two or more PTO options exist, `PolicySelection` renders for `policyType="pto_policy"` (`TimeOffSection.tsx:35-39`).
- If two or more sick-leave options exist, `PolicySelection` renders for `policyType="paid_sick_leave_policy"` (`TimeOffSection.tsx:41-45`).
- Selecting a policy sets `time_off_policies.pto_policy.id` (or `paid_sick_leave_policy.id`) in Formik values via `setFieldValue` (`PolicySelection.tsx:63`).
- The balance `NumberInput` is disabled when the policy select value is `'none'` (`PolicySelection.tsx:102`).
- Changing the balance field sets `time_off_policies.{policyType}.balance` in Formik values (`PolicySelection.tsx:76`).
- Resetting a policy select to `'none'` zeroes the balance and sets both id and balance to `null` in Formik (`PolicySelection.tsx:65-68`).

### AC-2 — Onboarding Documents section renders in child page (temporary)

**Given** the OAM is on the Add Team child page (Step 1)
**When** the page renders
**Then** the `OnboardingSection` component renders below the Time Off section (if Time Off is visible) or below Job Details (if Time Off is hidden).

- `OnboardingSection` is only shown when `isPayrollEnrolled === true` OR `isAIOLocation === true AND packetProps.newHireOnboardingActivated === true` — same condition as `StepOne.jsx:104-106`.
- This section is **temporary**; M2 replaces it with the new packet configuration Step 2 flow.
- The `OnboardingSection` receives `contactInfoRequired`, `onboardingSectionRef`, and `isPayrollEnrolled` props — same as in `StepOne.jsx:156-162`.

### AC-3 — Primary CTA: finalize-add branch

**Given** the OAM is on the Add Team child page (Step 1)
**AND** the form is valid (Yup schema passes — `validationSchemas.js:11-52`)
**AND** `values.sendSms === false` (invite checkbox unchecked)
**AND** `isIntegratedPayrollPartner === false` (company NOT on payroll — `selectors/addTeam.js:57-58`)
**When** the OAM clicks the primary CTA button
**Then** `createEmployeePayload` is called with the current Formik values (`util.js:256-323`)
**AND** `addTeamMember` thunk is dispatched (`features/team/actions.js:46-55`)
**AND** on success the success modal opens via `openSuccessModal` and the child page closes.
**AND** on API error (response has `errors` array) a flash error is shown and the page remains open.

### AC-4 — Primary CTA: proceed-to-step-2 branch

**Given** the form is valid
**AND** (`values.sendSms === true` (invite checkbox checked) OR `isIntegratedPayrollPartner === true`)
**When** the OAM clicks the primary CTA
**Then** the child page navigates to the Step 2 route via `browserHistory.push` (placeholder URL — exact route TBD by issue 01 shell).
**AND** `addTeamMember` is NOT called yet (Step 2 will handle the final submit).

Note: `sendSms` defaults to `true` in `initialValues` (`constants.js:128`), so on first load the default path is navigate-to-step-2 unless the OAM has manually unchecked.

### AC-5 — Cancel button exits without saving

**Given** the OAM is on the Add Team child page
**When** the OAM clicks Cancel
**AND** the form has no content (`formHasContent` returns false — `util.js:151-161`)
**Then** the child page closes immediately without prompting.

**When** the OAM clicks Cancel
**AND** the form has content (any of: firstName, lastName, email, phone, defaultRoleName, wageRate is non-empty)
**Then** the `ExitModal` opens asking the OAM to confirm discard.

**When** the OAM confirms discard in the `ExitModal`
**Then** the child page closes and all unsaved form state is discarded.

---

## 3. Non-Goals

- **Amplitude eventing** — that is HRM-3224.
- **The Step 2 page itself** — that is M2. AC-4 above only requires a `browserHistory.push` to a placeholder route.
- **Validation logic changes** — the existing Yup schema in `validationSchemas.js` is used as-is.
- **`createEmployee` API call shape changes** — the payload is built by the existing `createEmployeePayload` utility (`util.js:256-323`); no modifications.
- **Onboarding Documents section logic changes** — `OnboardingSection` is ported as-is. M2 replaces it.

---

## 4. Edge Cases

| # | Scenario | Expected Behavior |
|---|----------|-------------------|
| E-1 | Payroll company (`isIntegratedPayrollPartner === true`) with invite checkbox unchecked (`sendSms === false`) | CTA still navigates to Step 2 — payroll status alone forces the step-2 path regardless of invite checkbox state. |
| E-2 | Non-payroll company with invite checkbox checked (`sendSms === true`) | CTA navigates to Step 2 — invite intent alone forces the step-2 path. |
| E-3 | `addTeamMember` network error on finalize-add path | Network errors surface via the RTK rejected action path (`response.error`) — `dispatch(addTeamMember(...))` always resolves because `createAsyncThunk` absorbs all throws internally. `datadogLogError` is called, flash error with `errors.generic` is shown, loading spinner stops, form stays open. |
| E-4 | Cancel clicked mid-form with some fields populated | `ExitModal` opens. If OAM clicks "Keep editing", modal closes and form is unchanged. If OAM clicks "Discard", child page closes. Source: `AddTeamDrawerContainer.jsx:269-276`, `729-741`. |
| E-5 | `fetchPolicyOptions` fails (network error) | `loadingPolicyOptions` returns to `false`, `policyOptions` stays empty, `TimeOffSection` renders `null` (only the default "No policy" option per category). No crash. Source: `slice.ts:53-55`. |
| E-6 | `sendSms` (invite checkbox) unchecked AND non-payroll AND `contactInfoRequiredError` fires (packet option selected but no email/phone) | Validation error scrolls to contact section; submit is blocked before CTA branch decision is reached. Source: `AddTeamDrawerContainer.jsx:334-345`. |

---

## 5. Out-of-Scope Flags / Questions

- The exact Step 2 route path must be confirmed by the issue 01 shell (the `addNewUserRoute` pattern at `router.js:11` gives `/team/new` as the current employee profile route; the new child page route may differ).
- Feature flag gating: all new surfaces must be behind a flag per project cross-cutting requirements (`project-spec.md`, Section 5). Flag name to be confirmed with the team before merge.
