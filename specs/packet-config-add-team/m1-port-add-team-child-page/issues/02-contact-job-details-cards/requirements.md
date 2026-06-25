---
issue: "02-contact-job-details-cards"
milestone: "m1-port-add-team-child-page"
linear_issue_id: "HRM-3222"
linear_issue_url: "https://linear.app/joinhomebase/issue/HRM-3222"
depends_on: ["01-child-page-route-shell"]
approved: true
---

# Requirements — HRM-3222: Contact Information and Job Details Cards

## Context

| Field | Value |
|-------|-------|
| Issue | HRM-3222 |
| Milestone | M1 — Port Add Team to new Child Page |
| Figma | https://www.figma.com/design/HSvGEOyEmuDtUGcpOQ8Xpy/New-Hire-Packets---Documents?node-id=1472-12930 |
| Depends on | 01-child-page-route-shell (child page scaffold from HRM-3221) |
| Source of truth for validation | `client/src/features/team/components/AddEmployeeForm/validationSchemas.js` lines 11–52 |
| Source of truth for field labels | `client/src/locales/en/new_team_drawer.json` — `new_team_drawer.add_team_form.*` |
| Source of truth for field constants | `client/src/features/team/components/AddEmployeeForm/constants.js` |

This issue ports two sections of the existing `AddEmployeeForm` into card UI components that live inside the Add Team child page scaffolded by HRM-3221. It does **not** introduce any new validation rules and does not own CTA wiring, time-off, or eventing.

---

## User Stories

**US-1 — Contact Information card**
As an Owner/Admin/Manager adding a new team member, I want to fill in basic contact details (name, email, phone) and opt into sending an invite, so that the new hire receives an invitation and can join Homebase.

**US-2 — Invite checkbox conditional**
As an OAM who checks "Invite your new hire," I want to be told that either an email address or a phone number is required, so that I do not submit the form without a way to reach the team member.

**US-3 — Job Details card**
As an OAM, I want to assign a location (read-only, reflecting my current context), an employment type, and an access level to the new team member, so that the system correctly categorises them from creation.

---

## Acceptance Criteria (EARS format)

### Contact Information Card

**AC-1** — WHEN the Contact Information card renders, THEN it SHALL display a `TextField` for "First name" marked required (asterisk present).

**AC-2** — WHEN the Contact Information card renders, THEN it SHALL display a `TextField` for "Last name" with no asterisk (optional unless `includedInPayroll` is true, which is governed by `validationSchemas.js` line 14–17 — no new logic introduced here).

**AC-3** — WHEN the Contact Information card renders AND `values.defaultOnboardingPacketsEnabled` is false, THEN the "Email" `TextField` SHALL be optional (no asterisk). When `values.defaultOnboardingPacketsEnabled` is true, THEN it SHALL show an asterisk, matching `validationSchemas.js` line 18–24.

**AC-4** — WHEN the Contact Information card renders, THEN it SHALL display a `PhoneField` for "Mobile phone number" with no asterisk (optional; 10-digit regex validated by `validationSchemas.js` lines 25–27).

**AC-5** — WHEN the Contact Information card renders, THEN it SHALL display an "Invite your new hire" `CheckboxField` bound to the `sendSms` Formik field, with helper blurb text beneath the label, reusing the behaviour from `InviteOnlyCheckbox.jsx` at `client/src/features/team/components/AddEmployeeForm/Sections/OnboardingSection/components/InviteOnlyCheckbox.jsx` lines 23–48.

**AC-6** — WHEN `values.sendSms` is true AND (`values.email` is empty AND `values.phone` is empty), THEN a `ContactInfoRequired` indicator SHALL appear beneath the checkbox showing "Email or phone number is required to send an invite" (i18n key `new_team_drawer.add_team_form.onboarding.requirement`), reusing `ContactInfoRequired` from `client/src/features/team/components/AddEmployeeForm/components/ContactInfoRequired.jsx`.

**AC-7** — WHEN `values.sendSms` is true AND at least one of email or phone is filled, THEN the `ContactInfoRequired` indicator SHALL NOT be visible.

**AC-8** — WHEN `values.sendSms` is false, THEN the `ContactInfoRequired` indicator SHALL NOT be visible regardless of email/phone state.

### Job Details Card

**AC-9** — WHEN the Job Details card renders, THEN it SHALL display the current location name as read-only text via the `getCurrentLocationName` selector (`client/src/selectors/session.js`), accompanied by a `Location` icon, matching the existing pattern in `JobDetailsSection.jsx` lines 84–89.

**AC-10** — WHEN the Job Details card renders, THEN it SHALL display an Employment Type pill group (`ChipGroupField` bound to `jobTaxClassification`) with three options sourced from `JOB_TAX_CLASSIFICATIONS` in `client/src/features/team/components/AddEmployeeForm/constants.js` lines 29–51:
- "W-2 Employee" (`value: 'w2-employee'`)
- "1099 Contractor, Individual" (`value: '1099-individual'`)
- "1099 Contractor, Business" (`value: '1099-business'`)

Default selected value is `null` (no pre-selection on add; existing team member re-uses `parseCurrentTaxClassification` from `constants.js` lines 95–107).

**AC-11** — WHEN the Job Details card renders, THEN it SHALL display an Access Level pill group (`ChipGroupField` bound to `level`) with options sourced from `getCurrentLocationAccessLevelOptions` (`client/src/selectors/addTeam.js` line 110), which returns three options [Employee, Manager, General manager] when the current user has GM feature permission AND is an owner or GM, and two options [Employee, Manager] otherwise (via `removeGeneralManagerOption`).

**AC-12** — WHEN `managersCanAccess` is false (derived from `getHasManagersFeatureAccess` selector; the conditional guard is at `client/src/features/team/components/AddEmployeeForm/Sections/JobDetailsSection/JobDetailsSection.jsx:103` — `{managersCanAccess && (`; `AccessLevel.jsx` is the chip group render component but does not own the guard), THEN the Access Level pill group SHALL NOT be rendered.

**AC-13** — WHEN rendering for a US location (`isCountryCodeUS === true`), THEN the Employment Type options SHALL use `US_TAX_CLASSIFICATION_OPTIONS` (full labels: "W-2 Employee", "1099 Contractor, Individual", "1099 Contractor, Business"). WHEN `isCountryCodeUS === false`, THEN options use `TAX_CLASSIFICATION_OPTIONS` (abbreviated: "Employee", "Contractor, Individual", "Contractor, Business"), matching `TaxClassification.jsx` lines 24–29.

---

## Edge Cases

**EC-1 — Invite checked with no contact, then email added**
User checks "Invite your new hire" while email and phone are empty — `ContactInfoRequired` error state appears. User then fills in email — error state clears immediately (controlled by `values.sendSms && !values.email && !values.phone`).

**EC-2 — First name personalises the checkbox label**
When `values.firstName` is non-empty the checkbox label reads "Invite [firstName] to join you on Homebase" (`new_team_drawer.add_team_form.onboarding.invite_only_name`). When empty it reads "Invite your team to join you on Homebase" (`invite_only`). This is inherited from `InviteOnlyCheckbox.jsx` lines 31–36 and must be preserved.

**EC-3 — Non-US location Employment Type options**
For locations where `isCountryCodeUS` is false, the employment type chip options are abbreviated (no country-specific prefix). The pill group must still read from `TAX_CLASSIFICATION_OPTIONS` (`constants.js` lines 65–70), not the US variant.

**EC-4 — managersCanAccess = false hides Access Level**
When the location plan does not include manager-level access (e.g., Basic tier), `getHasManagersFeatureAccess` returns false, `managersCanAccess` is false, and the entire Access Level chip group is omitted from the DOM. The `level` field still defaults to "Employee" via `initialValues` (`constants.js` line 130–133) and passes schema validation via `validationSchemas.js` line 43.

**EC-5 — ChipGroupField normalises comparisons for `level`**
EC-5: ChipGroupField normalises comparisons — `ChipGroup.jsx:17` applies `capitalize()` to both `option.value` and `selectedValue` before comparing, so `EMPLOYEE_CLASSIFICATIONS.classification` (`'employee'`) correctly matches the chip labelled `'Employee'`. No special casing needed in initialValues.

---

## Deliberate Divergence from Drawer Behavior

**Employment Type rendered unconditionally in the child page.**
In the existing drawer (`JobDetailsSection.jsx:103-115`), the TaxClassification / Employment Type field is conditionally rendered only when `managersCanAccess && newHireOnboardingActivated && hasOnboardingDocsAccess && !isPayrollEnrolled`. In the child page card, Employment Type (`ChipGroupField name="jobTaxClassification"`) is rendered unconditionally — none of those four gates are applied. This is a deliberate Product decision for M1 to simplify the initial child page experience. Developers must NOT replicate the drawer gating into `JobDetailsCard`, and must NOT extract shared conditional logic that would inadvertently gate the drawer's existing behavior.

---

## Non-Goals

- Time off policies section — covered by HRM-3223.
- Onboarding documents section — covered by HRM-3223.
- CTA "Add team member" / "Continue" branching — covered by HRM-3223.
- Amplitude eventing — covered by HRM-3224.
- Hire date picker — part of PayrollSection (payroll-enrolled flow only); not in scope for this card.
- Email/phone duplication check (rehire/resend-invite inline errors on blur) — the full `ContactSection` duplication-check logic is NOT ported; this is a new card that accepts fields without existing-user collision detection.
- Wage/role fields — those remain in Job Details in the drawer and are out of scope for the child page M1.
- Any change to what is required or optional — all validation is ported verbatim.

---

## States to Cover

| State | Component | Notes |
|-------|-----------|-------|
| Default (empty form, sendSms=true) | Contact card | First name empty → generic invite label; no contact info warning until blur |
| sendSms=true, email+phone empty | Contact card | ContactInfoRequired shows in error variant |
| sendSms=true, email filled | Contact card | ContactInfoRequired hidden |
| sendSms=false | Contact card | ContactInfoRequired hidden |
| firstName filled | Contact card | Checkbox label personalises |
| defaultOnboardingPacketsEnabled=true | Contact card | Email asterisk visible |
| managersCanAccess=true | Job Details card | Access Level chip group visible |
| managersCanAccess=false | Job Details card | Access Level chip group hidden |
| isCountryCodeUS=true | Job Details card | Full employment type labels |
| isCountryCodeUS=false | Job Details card | Abbreviated employment type labels |
| jobTaxClassification=null (new add) | Job Details card | No chip selected (uncontrolled default) |

---

## Eventing

None for this issue. Amplitude tracking is deferred to HRM-3224.

---

## Open Questions

| # | Question | Default if unresolved | Owner | Status |
|---|----------|----------------------|-------|--------|
| OQ-1 | Should the email/phone duplicate-check blur logic from `ContactSection.jsx` lines 310–371 be included in the child page card, or stripped entirely for M1? | Strip for M1 — add only if Linear AC explicitly calls it out | Product/Engineering | open |
| OQ-2 | Is the `defaultOnboardingPacketsEnabled` flag available on the child page (passed via props, Redux, or URL params)? | Read from Redux state same as drawer | Engineering | open |
| OQ-3 | Should Employment Type default to `'w2-employee'` on new-add, or remain unselected? | Unselected (null) per `initialValues` in `constants.js` line 129 | Product | open |
