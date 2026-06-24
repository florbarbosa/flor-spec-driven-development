---
issue: "03-job-details-card"
milestone: "m1-port-add-team"
linear_issue_id: "TBD — create in Linear before building"
linear_issue_url: "TBD"
depends_on: ["01-child-page-route-shell", "02-contact-information-card"]
approved: false
---

# Requirements — Job Details Card

## Context

| Field | Value |
|-------|-------|
| Milestone | `m1-port-add-team` |
| Target repo | `/Users/fbarbosa/Documents/Homebase1` |
| Linear issue | TBD — proposed under M1 "Port Add Team to new Child Page" |
| Intake source | [Figma — New Hire Packets — Documents](https://www.figma.com/design/HSvGEOyEmuDtUGcpOQ8Xpy/New-Hire-Packets---Documents) |
| Depends on | `01-child-page-route-shell`, `02-contact-information-card` |

---

## User Stories

- As an **OAM**, I want to set a new team member's access level, wages, and onboarding packet type in a clearly labeled "Job Details" card on the Add Team page, so that the page presents a coherent step-by-step form.
- As an **OAM**, I want the location to appear as read-only context (current location), so that I know where this team member is being added without having to manually select it (per the default for single-location OAMs — open question Q-4 from project-spec.md).

---

## Acceptance Criteria

### Access level selector

- **AC-1.1:** The card shall render the `AccessLevel` component (existing, at `AddIndividualDrawer/Form/AccessLevel/AccessLevel.jsx`) with `level`, `handleChange`, `accessLevelOptions`, and `cxEl` props.
- **AC-1.2:** The available levels — Employee, Manager, General Manager — shall respect the `accessLevelOptions` from the Redux selector `getCurrentLocationAccessLevelOptions` at `AddIndividualDrawer.jsx:145`, and the `UpgradeWrapper` gates on Manager and GM remain unchanged.
- **AC-1.3:** The default access level shall be `'Employee'` (matching INIT_STATE at `AddIndividualDrawer.jsx:91`).

### Roles and wages (conditional)

- **AC-2.1:** When `canViewWages` is `true`, the card shall render the `RolesBlock` component (existing, at `AddIndividualDrawer/Form/RolesBlock/RolesBlock.jsx`) with `onChange`, `editingRolesData`, `key={userId}`, and `isEmployee` props.
- **AC-2.2:** When `canViewWages` is `false`, the roles block shall not render.
- **AC-2.3:** `isEmployee` is derived as `jobTaxClassification !== '1099'` (existing logic at `Form.jsx:63-66`).

### Onboarding packet row (conditional)

- **AC-3.1:** When `hasOnboardingDocsAccess` and `newHireOnboardingActivated` are both `true`, the card shall render the `PacketRow` component (existing, at `AddIndividualDrawer/Form/Onboarding/PacketRow.jsx`) with its required props.
- **AC-3.2:** The `PacketRow` renders `ClassificationSelectInput` (tax classification: w2 / 1099), `ContractorTypeSelectInput` (when contractor), and `PacketSelectInput`. All three are existing components; do not modify their logic.
- **AC-3.3:** When either `hasOnboardingDocsAccess` or `newHireOnboardingActivated` is `false`, the packet row shall not render.

### Hire date

- **AC-4.1:** The card shall render a hire date input wired to the `hireDate` state field. Validation uses `hireDateRange` from `util/validators` (yup schema at `AddIndividualDrawer.jsx:124`).

### Location (read-only)

- **AC-5.1:** The card shall display the current location name as read-only text (per open question Q-4 default — single-location display only; multi-location OAM selector is out of scope for M1).
- **AC-5.2:** The location display does not affect the submit payload — `currentLocationId` from `getCurrentLocationId(state)` continues to be used in `jobAttributes()` at `helpers.ts:175`.

---

## Edge Cases & Error States

| # | Scenario | Expected behavior |
|---|----------|------------------|
| E-1 | `canViewWages` is `false` | `RolesBlock` does not render; `wageAttributes` remains empty array; submit payload sends `wage_rate: undefined` which is acceptable for non-wage-viewing accounts |
| E-2 | `hasOnboardingDocsAccess` is `false` or `newHireOnboardingActivated` is `false` | `PacketRow` does not render; `packet` defaults to `'w2'` (INIT_STATE at `AddIndividualDrawer.jsx:80`) |
| E-3 | Contractor selected (`jobTaxClassification === '1099'`) but `contractorType` not set | `canRequestInformation` returns `false` if `requestInformation === 'packet'`; existing logic at `helpers.ts:322-332` unchanged |
| E-4 | `hasPaidPayrollRunsForJob` is `true` (editing an existing user with payroll runs) | `canEditTaxClassification` returns `hasNoActivePayments` only (existing logic at `helpers.ts:70-88`); PacketRow respects this |
| E-5 | Hire date is outside the valid range | Yup `hireDateRange` validator fires; inline error appears on the hire date field |
| E-6 | `accessLevelOptions` is empty | `AccessLevel` renders no level items; submit button remains enabled (level defaults to 'Employee') |

---

## Non-Goals & Constraints

- **This issue shall not change** `AccessLevel.jsx` at `AddIndividualDrawer/Form/AccessLevel/AccessLevel.jsx`.
- **This issue shall not change** `RolesBlock.jsx` at `AddIndividualDrawer/Form/RolesBlock/RolesBlock.jsx`.
- **This issue shall not change** `PacketRow.jsx` or `ClassificationSelectInput.jsx` or `ContractorTypeSelectInput.jsx` at `AddIndividualDrawer/Form/Onboarding/`.
- **This issue shall not change** the submit payload shape defined at `helpers.ts:152-196` (`jobAttributes`) or `helpers.ts:201-227` (`userAndJobData`).
- **This issue shall not change** the `hireDateRange` validator at `util/validators.js`.
- **This issue shall not add** CTA/submit logic — that is `04-submit-and-branching`.
- **This issue shall not implement** multi-location selection for the location field — deferred to a later issue.

---

## States to Cover

| Surface | States |
|---------|--------|
| `JobDetailsCard` | canViewWages=true (wages shown), canViewWages=false (wages hidden), hasOnboardingDocsAccess=false (packet row hidden), contractor selected (ContractorTypeSelectInput shown) |
| `AccessLevel` | Employee selected (default), Manager selected (upgrade-gated), GM selected (upgrade-gated) |
| `RolesBlock` | empty wages, one role, multiple roles |
| `hireDate` input | empty (valid), filled (valid), invalid range (error) |
| Location display | read-only text of current location name |

---

## Eventing

> Events for the new page are scoped to `05-step1-eventing`. This issue does not fire Amplitude events.

---

## Open Questions

| # | Question | Default if unresolved |
|---|----------|----------------------|
| Q-1 | Where does the hire date input component live? Is there an existing `DatePicker` in fe-design-base for this? | Check via `mcp__designbase-storybook__list-all-documentation` before building; existing drawer likely uses a non-Designbase date picker |
| Q-2 | Location display: just show the location name string, or show a read-only `TextField`? | Show as read-only `Text` component — no input needed for M1 |
