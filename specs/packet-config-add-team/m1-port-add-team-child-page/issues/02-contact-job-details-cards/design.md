---
issue: "02-contact-job-details-cards"
approved: true
---

# Design — HRM-3222: Contact Information and Job Details Cards

## Component Map

All components below are verified to exist in the target repo.

### New components (authored in this issue)

| Component | Path (new) | Purpose |
|-----------|-----------|---------|
| `ContactInfoCard` | `client/src/features/team/AddTeamPage/components/ContactInfoCard/ContactInfoCard.jsx` | Wraps contact fields inside a `TileContainer` |
| `JobDetailsCard` | `client/src/features/team/AddTeamPage/components/JobDetailsCard/JobDetailsCard.jsx` | Wraps location display + employment type + access level inside a `TileContainer` |

### Reused components (not modified)

| Component | Existing path | Prop shape |
|-----------|--------------|-----------|
| `TileContainer` | `client/lib/fe-design-base/molecules/TileContainer/TileContainer.tsx` | `children`, `selected`, `disabled`, standard Box props (`bradiusm`, `shadow="z1"` applied internally) |
| `TextField` | `client/lib/fe-design-base/molecules/TextField/TextField.tsx` | `name`, `label`, `hasAsterisk`, `size`, `readOnly`, `disabled` |
| `PhoneField` | `client/lib/fe-design-base/molecules/PhoneField/PhoneField.tsx` | `name`, `hasAsterisk`, `size`, `readOnly`, `disabled` |
| `CheckboxField` | `client/lib/fe-design-base/molecules/CheckboxField/CheckboxField.tsx` | `name`, `label` (string or ReactNode), `disabled`, `helperText` |
| `ChipGroupField` | `client/src/features/team/components/ChipGroup/ChipGroupField.jsx` | `name`, `options` (array of `{label, value}`), `label`, `helperText`, `hasAsterisk`, `infoTooltip` |
| `InviteOnlyCheckbox` | `client/src/features/team/components/AddEmployeeForm/Sections/OnboardingSection/components/InviteOnlyCheckbox.jsx` | `disabled`, `contactInfoRequired`, `showContactInfoRequired` — reads `sendSms`, `firstName` from Formik context |
| `ContactInfoRequired` | `client/src/features/team/components/AddEmployeeForm/components/ContactInfoRequired.jsx` | `contactInfoRequired: bool` — shows error vs info icon |
| `SectionTitle` | `client/src/features/team/components/AddEmployeeForm/components/SectionTitle.jsx` | `section: string` — key into `new_team_drawer.add_team_form.titles.*` |
| `Box` | `client/lib/fe-design-base/atoms/Box` | Standard layout primitive |
| `Icon` | `client/lib/fe-design-base/atoms/Icon` | `iconName="Location"`, `size="xsmall"`, `color="mono700"` (used for read-only location) |
| `Text` | `client/lib/fe-design-base/atoms/Text` | `variant`, `color` |

> `CardContainer` from `fe-design-base/molecules/CardContainer` is **deprecated** — use `TileContainer` instead (per deprecation notice in `CardContainer.tsx` line 54).

---

## File Plan

10 files maximum. This issue stays within that budget.

| # | File | Action | Notes |
|---|------|--------|-------|
| 1 | `client/src/features/team/AddTeamPage/components/ContactInfoCard/ContactInfoCard.jsx` | **Create** | New card component |
| 2 | `client/src/features/team/AddTeamPage/components/ContactInfoCard/ContactInfoCard.scss` | **Create** | Grid layout for the two-column name row |
| 3 | `client/src/features/team/AddTeamPage/components/ContactInfoCard/ContactInfoCard.test.jsx` | **Create** | Unit tests |
| 4 | `client/src/features/team/AddTeamPage/components/JobDetailsCard/JobDetailsCard.jsx` | **Create** | New card component |
| 5 | `client/src/features/team/AddTeamPage/components/JobDetailsCard/JobDetailsCard.test.jsx` | **Create** | Unit tests |
| 6 | `client/src/features/team/AddTeamPage/AddTeamPage.jsx` | **Edit** | Mount `ContactInfoCard` and `JobDetailsCard` inside the page shell (created in HRM-3221) |

**Total: 6 files** (well within the 10-file limit).

> The `AddTeamPage` shell file path is assumed based on the HRM-3221 spec convention. Confirm the exact path before implementation.

---

## Routing & Mounting

This issue does not introduce new routes. The two cards are mounted as children of `AddTeamPage`, which was scaffolded in HRM-3221. They are consumed in step-1 of the child page layout:

```
AddTeamPage (shell — HRM-3221)
  └── <Formik> (form context — HRM-3221)
        ├── <ContactInfoCard />   ← this issue
        ├── <JobDetailsCard />    ← this issue
        └── ... (time-off, CTAs — HRM-3223)
```

The Formik form context (`initialValues`, `validationSchema`) is owned by the parent page shell. Cards consume context via `useFormikContext()`.

---

## State & Data

### Formik fields consumed

Both cards are **read/write via Formik only** — no local state except what is already inside the reused sub-components.

| Field | Card | Source of initial value | Validation |
|-------|------|------------------------|------------|
| `firstName` | Contact | `''` (`constants.js:122`) | Required — `validationSchemas.js:13` |
| `lastName` | Contact | `''` (`constants.js:124`) | Conditional on `includedInPayroll` — `validationSchemas.js:14–17` |
| `email` | Contact | `''` (`constants.js:126`) | Conditional on `defaultOnboardingPacketsEnabled` — `validationSchemas.js:18–24` |
| `phone` | Contact | `''` (`constants.js:127`) | Optional, 10-digit regex — `validationSchemas.js:25–28` |
| `sendSms` | Contact | `true` (`constants.js:128`) | Boolean — `validationSchemas.js:29` |
| `jobTaxClassification` | Job Details | `null` for new adds — `constants.js:129` | Conditional on `includedInPayroll` — `validationSchemas.js:37–42` |
| `level` | Job Details | `EMPLOYEE_CLASSIFICATIONS.classification` = `'employee'` — `constants.js:130–133` | Required — `validationSchemas.js:43` |

### Redux selectors consumed

| Selector | File | Used by |
|----------|------|---------|
| `getCurrentLocationName` | `client/src/selectors/session.js` | `JobDetailsCard` — read-only location display |
| `getHasManagersFeatureAccess` | `client/src/selectors/addTeam.js` | `JobDetailsCard` — conditional Access Level chip group |
| `selectCurrentLocationCountryCode` | `client/src/features/team/selectors.js` | `JobDetailsCard` — US vs non-US tax classification labels |

### Derived state (no new Redux)

- `contactInfoRequired`: boolean computed inline — `values.sendSms && !values.email && !values.phone`. Passed as prop to `InviteOnlyCheckbox` and `ContactInfoRequired`.
- `managersCanAccess`: from Redux via `connect()`, same pattern as `AccessLevel.jsx` lines 30–32.
- `isCountryCodeUS`: from Redux via `connect()`, same pattern as `TaxClassification.jsx` lines 41–43.

> **Behavioral divergence note:** Employment Type (`jobTaxClassification` chip group) is rendered unconditionally in `JobDetailsCard`. The drawer gates it on `managersCanAccess && newHireOnboardingActivated && hasOnboardingDocsAccess && !isPayrollEnrolled` (`JobDetailsSection.jsx:103-115`). Those gates are intentionally absent from the child page card per M1 Product decision. Do not add them here.

---

## Feature Flag

This issue inherits the feature flag from HRM-3221 (the child page shell). No new flag is introduced here. The cards are rendered only within the gated child page route; if the flag is off, the child page does not render, so these cards are never reached.

Flag name to be confirmed in HRM-3221 spec. Default: off.

---

## i18n Keys

All strings below reference `client/src/locales/en/new_team_drawer.json` unless noted.

### Existing keys — reused verbatim (do not duplicate)

| Key | Value |
|-----|-------|
| `new_team_drawer.add_team_form.titles.contact_information` | "Contact information" |
| `new_team_drawer.add_team_form.titles.job_details` | "Job details" |
| `new_team_drawer.add_team_form.labels.first_name` | "First name" |
| `new_team_drawer.add_team_form.labels.last_name` | "Last name" |
| `new_team_drawer.add_team_form.labels.email` | "Email" |
| `new_team_drawer.add_team_form.labels.phone_number` | "Mobile phone number" |
| `new_team_drawer.add_team_form.onboarding.invite_only` | "Invite your team to join you on Homebase" |
| `new_team_drawer.add_team_form.onboarding.invite_only_name` | "Invite {{firstName}} to join you on Homebase" |
| `new_team_drawer.add_team_form.onboarding.invite_only_blurb` | "Recommended so they can view schedules, send messages, and track hours." |
| `new_team_drawer.add_team_form.onboarding.requirement` | "Email or phone number is required to send an invite" |
| `new_team_drawer.add_team_form.job_details.access_level.title` | "Access level" |
| `new_team_drawer.add_team_form.job_details.access_level.tooltip` | "Access level determines your team's permissions on the app." |
| `new_team_drawer.add_team_form.job_details.tax_classification.title` | "Tax Classification" |
| `new_team_drawer.add_team_form.job_details.tax_classification.blurb` | "This determines which New Hire Onboarding packet is sent" |
| `new_team_drawer.add_team_form.job_details.tax_classification.tooltip` | (full tooltip text in locale file) |
| `new_team_drawer.add_team_form.errors.first_name` | "Please enter a first name" |
| `new_team_drawer.add_team_form.errors.last_name` | "Please enter a last name" |
| `new_team_drawer.add_team_form.errors.email` | "Please enter a valid email address" |
| `new_team_drawer.add_team_form.errors.phone` | "Please enter a valid phone number" |
| `team.access_levels.employee` | (resolved at runtime via `toI18n`) |
| `team.access_levels.manager` | (resolved at runtime via `toI18n`) |
| `team.access_levels.general_manager` | (resolved at runtime via `toI18n`) |

### New keys — none required

The child page cards reuse all existing i18n keys from the drawer. No new English or Spanish keys are introduced by this issue.

---

## Risks & Assumptions

| # | Risk / Assumption | Mitigation |
|---|-------------------|-----------|
| R-1 | `AddTeamPage` shell path from HRM-3221 is assumed as `client/src/features/team/AddTeamPage/`. If the shell was placed elsewhere, file paths in the File Plan must be updated before creating files. | Confirm with HRM-3221 implementer before starting. |
| R-2 | `InviteOnlyCheckbox` is reused directly — it reads `sendSms` and `firstName` from Formik context rather than accepting them as props. This couples the card to the exact field names. If the child page Formik schema uses different field names, the component will break silently. | Keep field names identical to `initialValues` in `constants.js`. |
| R-3 | `ChipGroupField` is a local feature component, not a Designbase molecule. It wraps `ChipGroup` which in turn is also local (`client/src/features/team/components/ChipGroup/`). It is not available via `fe-design-base` import paths. | Import from `features/team/components/ChipGroup/ChipGroupField`. |
| R-4 | `CardContainer` from `fe-design-base/molecules/CardContainer` is deprecated (line 54 of `CardContainer.tsx`). | Use `TileContainer` from `fe-design-base/molecules/TileContainer` for the card shell. |
| R-5 | The email/phone duplicate-check blur logic in `ContactSection.jsx` lines 310–371 is intentionally excluded. If Product decides it belongs in M1 the scope grows significantly (requires Redux dispatch, async API calls, `InputError` component). | Flag as OQ-1 in requirements; do not include unless explicitly confirmed. |
