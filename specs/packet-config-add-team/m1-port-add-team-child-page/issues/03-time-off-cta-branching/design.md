---
issue: "03-time-off-cta-branching"
approved: true
---

# Design — HRM-3223: Add Time Off Section and CTA Branching

## 1. Component Tree (Step 1 child page, additions from this issue)

```
AddTeamChildPage (from issue 01 shell)
└── Formik (validationSchema=ADD_EMPLOYEE_FORM_SCHEMA, onSubmit=handleSubmit)
    └── <form>
        ├── ... (ContactCard, JobDetailsCard — from issue 02)
        ├── TimeOffSection          ← NEW (ported)
        │   ├── SectionTitle section="time_off"
        │   ├── PolicySelection policyType="pto_policy"       (conditional)
        │   │   ├── SelectField  name="time_off_policies.pto_policy.id"
        │   │   └── NumberInput  name="time_off_policies.pto_policy.balance"
        │   └── PolicySelection policyType="paid_sick_leave_policy"  (conditional)
        │       ├── SelectField  name="time_off_policies.paid_sick_leave_policy.id"
        │       └── NumberInput  name="time_off_policies.paid_sick_leave_policy.balance"
        ├── OnboardingSection       ← NEW (ported, temporary — M2 replaces)
        │   ├── SectionTitle section="onboarding"
        │   └── OnboardingOptionGroup
        │       └── InviteOnlyCheckbox  name="sendSms"
        └── PageFooter
            ├── Button variant="secondary" onClick=handleCancel   (Cancel)
            └── Button type="submit" isLoading=isLoading          (primary CTA)
```

---

## 2. Submit / CTA Branching Logic

```
handleSubmit(values):
  payload = createEmployeePayload(values, isAdding, locationId, ...)
             // client/src/features/team/components/AddEmployeeForm/util.js:256-323

  shouldFinalize = (values.sendSms === false) AND (isIntegratedPayrollPartner === false)

  if shouldFinalize:
    dispatch(addTeamMember(sanitizedPayload))
    // client/src/features/team/actions.js:46-55
    on success → dispatch(openSuccessModal(...)) + close page
    on error   → flashNotice.error(message) + setIsLoading(false)
  else:
    browserHistory.push(<step-2-route>)
    // client/src/util/router.js:9 — browserHistory is the shared history instance
```

Key data sources:
- `isIntegratedPayrollPartner`: `getCurrentLocationIsIntegratedPayrollPartner(state)` — `selectors/addTeam.js:57-58`
- `values.sendSms`: Formik field, defaults to `true` — `constants.js:128`
- `sanitizedPayload`: built by `sanitizeTeamMemberPayload(createEmployeePayload(...))` — same as drawer at `AddTeamDrawerContainer.jsx:331`

---

## 3. Cancel Logic

```
handleCancel(values):
  if formHasContent(values):   // util.js:151-161 — truthy if any of firstName/lastName/email/phone/defaultRoleName/wageRate is set
    setIsExiting(true)          → renders <ExitModal>
  else:
    closePage()                 // dispatch closeAddTeamDrawer or navigate away
```

`ExitModal` source: `client/src/features/team/components/ExitModal/`

---

## 4. State Shape (Formik additions from this issue)

`time_off_policies.*` fields are NOT present in `initialValues`; they are added to Formik state dynamically by `PolicySelection` via `setFieldValue` when the user selects a policy. The `util.js:237-254` handler uses optional chaining (`time_off_policies?.pto_policy?.id`) to handle the undefined-at-submit case safely. No change to `initialValues` is needed. The remaining fields (`sendSms`, `onboarding`) are present in `initialValues` (`constants.js:115-142`). No new top-level Formik fields are introduced.

| Formik path | Type | Source |
|---|---|---|
| `time_off_policies.pto_policy.id` | `string \| number \| null` | `PolicySelection.tsx:39,63,67` |
| `time_off_policies.pto_policy.balance` | `number \| null` | `PolicySelection.tsx:42,76,68` |
| `time_off_policies.paid_sick_leave_policy.id` | same | `PolicySelection.tsx:39,63,67` |
| `time_off_policies.paid_sick_leave_policy.balance` | same | `PolicySelection.tsx:42,76,68` |
| `sendSms` | `boolean` | `constants.js:128`, `InviteOnlyCheckbox.jsx:26` |
| `onboarding` | `string` (ONBOARDING_OPTIONS enum) | `constants.js:138`, `OnboardingSection.jsx:214-216` |

These fields are serialized into the API payload by `createEmployeePayload` (`util.js:256-323`), specifically:
- `sendSms` → `send_sms` field (`util.js:289-292`)
- `time_off_policies` → `pto_policy_employees_attributes` via `getPtoPolicyEmployeesAttributes` (`util.js:237-254`)

---

## 5. Redux Additions

No new Redux state is introduced by this issue. Existing slice used:

| Slice | Selector | Purpose |
|---|---|---|
| `addEmployeeForm` | `selectPolicyOptions(state, 'pto')` | PTO dropdown options — `slice.ts:59-72` |
| `addEmployeeForm` | `selectPolicyOptions(state, 'paid_sick_leave')` | Sick leave options — `slice.ts:59-72` |
| `addEmployeeForm` | `selectLoadingPolicyOptions` | Loading state — `slice.ts:74-78` |
| `session` | `getCurrentLocationIsIntegratedPayrollPartner` | CTA branch decision — `selectors/addTeam.js:57-58` |
| `session` | `getIsPayrollEnrolled` | OnboardingSection visibility — `selectors/session.js` |
| `team` | `selectShowSuccessModal` | Controls whether success modal is shown — `features/team/selectors.js:17` |
| `team` | `selectCalledFrom` | Provides `calledFrom` value for `createEmployeePayload` — `features/team/selectors.js:14-15` |

Note: `isAdding` is a local constant (`const isAdding = true;`) declared at the top of `AddTeamPage`, not a Redux-connected prop. The child page context is always an add (never edit or rehire).

The `fetchPolicyOptions` thunk is dispatched by `TimeOffSection` on mount (`TimeOffSection.tsx:17-19`).

---

## 6. Components to Port (no logic changes)

| Component | Source path | Notes |
|---|---|---|
| `TimeOffSection` | `Sections/TimeOffSection/TimeOffSection.tsx` | Rendered directly — no prop changes needed |
| `PolicySelection` | `Sections/TimeOffSection/PolicySelection.tsx` | Used internally by `TimeOffSection` |
| `OnboardingSection` | `Sections/OnboardingSection/OnboardingSection.jsx` | Temporary; M2 removes |
| `InviteOnlyCheckbox` | `Sections/OnboardingSection/components/InviteOnlyCheckbox.jsx` | Used internally by `OnboardingSection` |
| `ExitModal` | `components/ExitModal/` | Already used in drawer — reuse as-is |

---

## 7. i18n Keys

All keys below must be added to the English locale file and the Latin American Spanish locale file before merge (per project cross-cutting requirements).

| Key path | English value | Context |
|---|---|---|
| `new_team_drawer.add_button_text` | `"Add team member"` | Primary CTA — finalize-add branch. Already exists in drawer (`AddTeamDrawerContainer.jsx:567`). Verify key is shared or create a child-page-specific key if copy differs. |
| `new_team_drawer.add_team_form.labels.pto_policy` | `"PTO policy"` | PolicySelection label for PTO — `PolicySelection.tsx:87`, `I18N_PATH = 'new_team_drawer.add_team_form.labels'` |
| `new_team_drawer.add_team_form.labels.paid_sick_leave_policy` | `"Paid sick leave policy"` | PolicySelection label for sick leave |
| `new_team_drawer.add_team_form.labels.balance` | `"Balance"` | PolicySelection balance label — `PolicySelection.tsx:96` |
| `team.employee_profile.time_offs.no_policy` | `"No policy"` | Default "none" option in policy selects — `slice.ts:22-24` |
| `new_team_drawer.add_team_form.onboarding.*` | (existing keys) | OnboardingSection uses existing `I18N_ONBOARDING_PATH` constants (`constants.js:19-21`). No new keys required unless copy changes. |
| `new_team_drawer.exit_modal.title.add` | (existing) | ExitModal title — `AddTeamDrawerContainer.jsx:733` |
| `new_team_drawer.exit_modal.description` | (existing) | ExitModal description — `AddTeamDrawerContainer.jsx:735` |
| `new_team_drawer.exit_modal.continue.add` | (existing) | ExitModal keep-editing button |
| `new_team_drawer.exit_modal.discard` | (existing) | ExitModal discard button |

> Keys marked "(existing)" are already defined in the codebase. Verify they are present before adding duplicates. New keys for the child page should be namespaced under `add_team_child_page.*` if copy differs from the drawer.

---

## 8. Design References

- Figma: https://www.figma.com/design/HSvGEOyEmuDtUGcpOQ8Xpy/New-Hire-Packets---Documents?node-id=1472-12930
- Time Off section layout: `PolicySelection.tsx:82-117` — `Box mt={24} row gap={24}`, policy select in `Box w={288}`, balance in `Box w="100px"`.
- OnboardingSection layout: `OnboardingSection.jsx:226-243` — `Box mv={28}` with `SectionTitle topBorder`.
- Page footer layout: follows `DrawerFooter.jsx:70-85` — `Box hright vcenter h={64}` with Cancel (secondary) + primary CTA.

---

## 9. Open Design Questions

| # | Question | Default assumption |
|---|----------|-------------------|
| D-1 | Does the primary CTA label change between the two branches ("Add team member" vs "Continue")? | Keep "Add team member" per project-spec.md open question #3 |
| D-2 | Does the Time Off section appear inside a card (matching Contact/Job Details cards from issue 02) or as a flat section? | Flat section, same as drawer — `TimeOffSection.tsx:33` uses `Box mv={28}` |
| D-3 | Is the OnboardingSection inside a card or flat? | Flat, same as drawer — `OnboardingSection.jsx:227` |
