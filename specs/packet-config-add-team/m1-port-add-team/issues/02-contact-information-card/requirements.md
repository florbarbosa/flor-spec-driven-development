---
issue: "02-contact-information-card"
milestone: "m1-port-add-team"
linear_issue_id: "TBD — create in Linear before building"
linear_issue_url: "TBD"
depends_on: ["01-child-page-route-shell"]
approved: false
---

# Requirements — Contact Information Card

## Context

| Field | Value |
|-------|-------|
| Milestone | `m1-port-add-team` |
| Target repo | `/Users/fbarbosa/Documents/Homebase1` |
| Linear issue | TBD — proposed under M1 "Port Add Team to new Child Page" |
| Intake source | [Figma — New Hire Packets — Documents](https://www.figma.com/design/HSvGEOyEmuDtUGcpOQ8Xpy/New-Hire-Packets---Documents) |
| Depends on | `01-child-page-route-shell` |

---

## User Stories

- As an **OAM**, I want to enter a new team member's name, phone, and email in a clearly labeled card section on the Add Team page, so that the layout is consistent with the rest of the new multi-step experience.
- As an **OAM**, I want the invite-via-SMS checkbox visible in the Contact Information section (when not in payroll setup mode), so that I can control whether the new hire receives a text invitation.

---

## Acceptance Criteria

### Contact information fields

- **AC-1.1:** The card shall render a `firstName` text input. It is required: the submit button is disabled when `firstName` is empty (validated at `AddIndividualDrawer.jsx:59` via `notFilled(firstName)` from `helpers.ts:59`).
- **AC-1.2:** The card shall render a `lastName` text input. It is optional.
- **AC-1.3:** The card shall render a `phone` input (type=phone). It is optional unless `requestInformation === 'packet'` and both phone and email are empty — in that case both inputs show an error border (existing logic at `ContactInfo.jsx:90-94` and `ContactInfo.jsx:109-112`).
- **AC-1.4:** The card shall render an `email` text input. It is optional unless `requestInformation === 'packet'` and both phone and email are empty.
- **AC-1.5:** The `firstName` field has a maximum length of 40 characters (validated in the yup schema at `AddIndividualDrawer.jsx:116`). Exceeding this maximum shall show a field-level error using the existing `toI18n('fe_design_base.max_length')` message.
- **AC-1.6:** The `email` field validates as a valid email address on blur. Invalid format shows `toI18n('fe_design_base.email_invalid')` (yup schema at `AddIndividualDrawer.jsx:117`).
- **AC-1.7:** The `phone` field validates as ≥10 characters matching `PHONE_EXTENDED_REGEX` on blur. Invalid format shows `toI18n('fe_design_base.phone_invalid')` (yup schema at `AddIndividualDrawer.jsx:118-124`). Empty phone is valid.

### Invite via SMS checkbox

- **AC-2.1:** When `isPayrollSetup` is `false`, the card shall render a `sendSms` checkbox with label `toI18n('add_team.individual_drawer.send_sms')`.
- **AC-2.2:** When `isPayrollSetup` is `true`, the `sendSms` checkbox shall not render (existing logic at `Form.jsx:129`).
- **AC-2.3:** The `sendSms` checkbox defaults to `true` (initial state at `AddIndividualDrawer.jsx:97`).

### Edit-disabled state

- **AC-3.1:** When `drawerContactInformationEditButtonDisabled` is `true` (from `usePersonalInformationEditState` hook used at `ContactInfo.jsx:27-33`), all contact fields shall be disabled.
- **AC-3.2:** When `showDrawerContactInformationAlert` is `true`, the card shall render the info banner above the fields (existing text at `ContactInfo.jsx:37-46`).

### Card integration

- **AC-4.1:** The `ContactInformationCard` component shall be rendered inside the `add-team-page-content` area of `AddTeamPage` (introduced in issue 01).
- **AC-4.2:** The card receives `handleChange`, `handleBlur`, form field values, and `errors` as props from `AddTeamPage` (which will manage form state in issues 03 and 04 or a shared slice — TBD; for now, pass props down from `AddTeamPage`).

---

## Edge Cases & Error States

| # | Scenario | Expected behavior |
|---|----------|------------------|
| E-1 | Both phone and email are empty when `requestInformation === 'packet'` | Both phone and email inputs show `errorBorder`; existing logic from `ContactInfo.jsx:90-94` and `ContactInfo.jsx:109-112` preserved |
| E-2 | `firstName` exceeds 40 characters | Yup validation fires on blur/change; field shows `toI18n('fe_design_base.max_length')` inline error |
| E-3 | `email` is entered with invalid format | On blur, yup fires `email_invalid` error; on correction, error clears via `debouncedResetErrors` at `AddIndividualDrawer.jsx:287` |
| E-4 | User is editing an existing team member (`editingUser` is set) | `drawerContactInformationEditButtonDisabled` may be `true`; fields are disabled and alert banner may show |
| E-5 | `isPayrollSetup` is `true` (payroll setup flow) | `sendSms` checkbox is hidden; contact fields remain |
| E-6 | Network request fails on submit (triggered in issue 04) | Card stays in its current state; error is surfaced at the page level, not inside the card |

---

## Non-Goals & Constraints

- **This issue shall not change** the yup validation schema at `AddIndividualDrawer.jsx:112-125`.
- **This issue shall not change** the `PHONE_EXTENDED_REGEX` at `util/validators.js`.
- **This issue shall not change** the existing `ContactInfo.jsx` component at `client/src/features/addTeam/AddIndividualDrawer/Form/ContactInfo/ContactInfo.jsx` — the new card is a separate component.
- **This issue shall not add** job details fields — that is `03-job-details-card`.
- **This issue shall not add** CTA/submit logic — that is `04-submit-and-branching`.

---

## States to Cover

| Surface | States |
|---------|--------|
| `ContactInformationCard` | pristine (no input), dirty (typed values), error (validation failures), disabled (editingUser with locked info) |
| `firstName` | empty (submit disabled), filled (submit enabled), error (max length exceeded) |
| `phone` + `email` | both empty + `requestInformation === 'packet'` → error borders; one filled → no error |
| `sendSms` checkbox | visible when `isPayrollSetup=false`; hidden when `isPayrollSetup=true` |

---

## Eventing

> Events for the new page are scoped to `05-step1-eventing`. This issue does not fire Amplitude events.

---

## Open Questions

| # | Question | Default if unresolved |
|---|----------|----------------------|
| Q-1 | Should `AddTeamPage` own form state as local `useState` or initialize a new Redux slice? | Local state for M1 (mirrors the existing `AddIndividualDrawer.jsx` component state); a dedicated slice can be introduced in M2 if needed |
| Q-2 | When editing an existing user from the new page, should the `usePersonalInformationEditState` hook behavior be identical? | Yes — no change to the hook logic |
