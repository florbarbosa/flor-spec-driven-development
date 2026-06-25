---
issue: "02-contact-job-details-cards"
approved: true
---

# Tasks — HRM-3222: Contact Information and Job Details Cards

## Build Steps

Steps are ordered. Complete in sequence; each step should pass lint + unit tests before moving to the next.

---

### Step 1 — Verify HRM-3221 shell is in place

Before writing any code, confirm:
- `AddTeamPage` shell component exists (path TBD from HRM-3221).
- A `<Formik>` provider wrapping the page with `initialValues` from `client/src/features/team/components/AddEmployeeForm/constants.js` `initialValues()` and `ADD_EMPLOYEE_FORM_SCHEMA` from `validationSchemas.js`.
- If any of the above are missing, HRM-3221 is a blocker.

---

### Step 2 — Create `ContactInfoCard`

**File:** `client/src/features/team/AddTeamPage/components/ContactInfoCard/ContactInfoCard.jsx`

1. Import `TileContainer` from `fe-design-base/molecules/TileContainer`.
2. Import `TextField` from `fe-design-base/molecules/TextField`.
3. Import `PhoneField` from `fe-design-base/molecules/PhoneField`.
4. Import `SectionTitle` from `client/src/features/team/components/AddEmployeeForm/components/SectionTitle.jsx`.
5. Import `InviteOnlyCheckbox` from `client/src/features/team/components/AddEmployeeForm/Sections/OnboardingSection/components/InviteOnlyCheckbox.jsx`.
6. Call `useFormikContext()` to read `values.sendSms`, `values.email`, `values.phone`, `values.defaultOnboardingPacketsEnabled`.
7. Compute `contactInfoRequired = values.sendSms && !values.email && !values.phone`.
8. Render inside `<TileContainer p={24}>`:
   - `<SectionTitle section="contact_information" />`
   - Two-column grid row: `TextField name="firstName" hasAsterisk label={toI18n(...labels.first_name)}`
   - `TextField name="lastName" label={toI18n(...labels.last_name)}`
   - `TextField name="email" hasAsterisk={values.defaultOnboardingPacketsEnabled} label={toI18n(...labels.email)}`
   - `PhoneField name="phone"`
   - `<InviteOnlyCheckbox showContactInfoRequired={contactInfoRequired} contactInfoRequired={contactInfoRequired} />`

**File:** `client/src/features/team/AddTeamPage/components/ContactInfoCard/ContactInfoCard.scss`

- Two-column grid for name row (mirrors `ContactSection.scss` pattern — inspect `ContactSection__grid` styles in `client/src/features/team/components/AddEmployeeForm/Sections/ContactSection/ContactSection.scss`).

---

### Step 3 — Create `JobDetailsCard`

**File:** `client/src/features/team/AddTeamPage/components/JobDetailsCard/JobDetailsCard.jsx`

1. Import `TileContainer` from `fe-design-base/molecules/TileContainer`.
2. Import `Box`, `Icon`, `Text` from `fe-design-base/atoms/*`.
3. Import `SectionTitle` from `client/src/features/team/components/AddEmployeeForm/components/SectionTitle.jsx`.
4. Import `ChipGroupField` from `client/src/features/team/components/ChipGroup/ChipGroupField.jsx`.
5. Import `US_TAX_CLASSIFICATION_OPTIONS`, `TAX_CLASSIFICATION_OPTIONS`, `I18N_JOB_DETAILS_PATH` from `client/src/features/team/components/AddEmployeeForm/constants.js`.
6. Connect to Redux for three selectors:
   - `currentLocationName` via `getCurrentLocationName` from `client/src/selectors/session.js`
   - `managersCanAccess` via `getHasManagersFeatureAccess` from `client/src/selectors/addTeam.js`
   - `isCountryCodeUS` via `selectCurrentLocationCountryCode` from `client/src/features/team/selectors.js` (compare `=== 'US'`)
7. Render inside `<TileContainer p={24}>`:
   - `<SectionTitle section="job_details" />`
   - Read-only location row: `<Box vcenter row><Icon mr={4} size="xsmall" iconName="Location" color="mono700" /><Text color="mono700" variant="captions">{currentLocationName}</Text></Box>`
   - `<ChipGroupField name="jobTaxClassification" options={isCountryCodeUS ? US_TAX_CLASSIFICATION_OPTIONS : TAX_CLASSIFICATION_OPTIONS} label={toI18n(...tax_classification.title)} helperText={toI18n(...tax_classification.blurb)} infoTooltip={toI18n(...tax_classification.tooltip)} />`
   - Conditionally when `managersCanAccess`: `<ChipGroupField name="level" options={accessLevelOptions} label={toI18n(...access_level.title)} infoTooltip={toI18n(...access_level.tooltip)} />`
     - `accessLevelOptions` comes from `getCurrentLocationAccessLevelOptions` selector (`client/src/selectors/addTeam.js` line 110).

---

### Step 4 — Mount cards in `AddTeamPage`

**File:** `client/src/features/team/AddTeamPage/AddTeamPage.jsx` (edit)

Insert `<ContactInfoCard />` and `<JobDetailsCard />` in the Formik form body, in this order, with appropriate spacing (`Box` gap or `mv` props matching the `FORM_WITH_STEPS_BOX_STYLE` pattern from `constants.js` lines 165–171).

**Sub-step 4a — Inject `defaultOnboardingPacketsEnabled` into Formik `initialValues`.**
In `AddTeamPage`, read `defaultOnboardingPacketsEnabled` via `useSelector(getProductGrowthInceptionPinsDefaultPackets)` (selector in `client/src/selectors/session.js`). When the flag is truthy, spread it into the Formik `initialValues` object, replicating the pattern from `AddTeamDrawerContainer.jsx:616-632`:

```js
const defaultOnboardingPacketsEnabled = useSelector(getProductGrowthInceptionPinsDefaultPackets);
// ...
const defaultInitialValues = defaultOnboardingPacketsEnabled
  ? { jobTaxClassification: 'w2-employee', level: EMPLOYEE_CLASSIFICATIONS.classification, defaultOnboardingPacketsEnabled }
  : {};
const formInitialValues = initialValues({
  isPayrollEnrolled,
  isDefaultManager,
  currentTeamMember,
  ...defaultInitialValues,
});
```

Pass `formInitialValues` (not a bare `initialValues()` call) as the Formik `initialValues` prop. The `initialValues` function destructures `{ isPayrollEnrolled, isDefaultManager, currentTeamMember, ...defaults }` from its argument — calling it with no argument causes a `TypeError` at runtime. This mirrors the exact pattern in `AddTeamDrawerContainer.jsx:616-632`. Note: when `defaultOnboardingPacketsEnabled` is true, `jobTaxClassification` is hard-set to `'w2-employee'`; if Employment Type is rendered unconditionally (per the Deliberate Divergence section), this pre-selection is intentional. Without this step, `values.defaultOnboardingPacketsEnabled` is always `undefined` and the email asterisk (AC-3) never appears even when the flag is on.

---

### Step 5 — Write unit tests

**File:** `client/src/features/team/AddTeamPage/components/ContactInfoCard/ContactInfoCard.test.jsx`

See "Test Coverage Targets" section below.

**File:** `client/src/features/team/AddTeamPage/components/JobDetailsCard/JobDetailsCard.test.jsx`

See "Test Coverage Targets" section below.

---

### Step 6 — Verify in browser (feature flag on)

With the feature flag from HRM-3221 enabled:
1. Navigate to the Add Team child page.
2. Confirm both cards render.
3. Check first name asterisk visible; last name asterisk absent.
4. Check "Invite your new hire" checkbox defaults checked.
5. Check `ContactInfoRequired` appears when email + phone empty and invite checked.
6. Confirm `ContactInfoRequired` clears when email is filled.
7. Confirm location name matches current location.
8. Confirm Employment Type chip renders three options.
9. If `managersCanAccess=true`, confirm Access Level chip renders three options.

---

## Test Coverage Targets

### `ContactInfoCard.test.jsx`

| Test ID | Description | AC covered |
|---------|-------------|-----------|
| T-C-1 | Happy path — renders all four input fields and the invite checkbox | AC-1, AC-2, AC-3, AC-4, AC-5 |
| T-C-2 | First name field has asterisk; last name field does not | AC-1, AC-2 |
| T-C-3 | Email has no asterisk when `defaultOnboardingPacketsEnabled=false` | AC-3 |
| T-C-4 | Email has asterisk when `defaultOnboardingPacketsEnabled=true` | AC-3 |
| T-C-5 | `ContactInfoRequired` is hidden when `sendSms=true` and `email` is filled | AC-7 |
| T-C-6 | `ContactInfoRequired` is hidden when `sendSms=true` and `phone` is filled | AC-7 |
| T-C-7 | `ContactInfoRequired` is visible when `sendSms=true`, `email=''`, `phone=''` | AC-6 (EC-1) |
| T-C-8 | `ContactInfoRequired` is hidden when `sendSms=false` regardless of email/phone | AC-8 |
| T-C-9 | Checkbox label shows generic text when `firstName` is empty | EC-2 |
| T-C-10 | Checkbox label personalises with `firstName` when `firstName='Alex'` | EC-2 |

### `JobDetailsCard.test.jsx`

| Test ID | Description | AC covered |
|---------|-------------|-----------|
| T-J-1 | Happy path — renders location name, Employment Type chips, Access Level chips | AC-9, AC-10, AC-11 |
| T-J-2 | Location name displays value from `getCurrentLocationName` selector | AC-9 |
| T-J-3 | Employment Type renders three chip options (W-2, 1099-individual, 1099-business) for US location | AC-10, AC-13 |
| T-J-4 | Employment Type renders abbreviated labels for non-US location | AC-13, EC-3 |
| T-J-5 | Access Level chip group is present when `managersCanAccess=true` | AC-11, AC-12 |
| T-J-6 | Access Level chip group is absent when `managersCanAccess=false` | AC-12, EC-4 |
| T-J-7 | Selecting an Employment Type chip updates `jobTaxClassification` in Formik | AC-10 |
| T-J-8 | Selecting an Access Level chip updates `level` in Formik | AC-11 |
| T-J-9 | Employee chip is pre-selected by default on a new-add: assert that the chip labelled `'Employee'` is selected when `level` initialValue is `EMPLOYEE_CLASSIFICATIONS.classification` (`'employee'`). `ChipGroup.jsx:17` normalises both sides via `capitalize()`, so the lowercase constant correctly matches the capitalised chip label (EC-5). | AC-11, EC-5 |
| T-J-10 | Only two Access Level chip options (Employee, Manager) appear when the current user lacks GM feature permission, even when `managersCanAccess=true` — mock `getCurrentLocationAccessLevelOptions` to return the two-option array produced by `removeGeneralManagerOption`. | AC-11 |

---

## Self-Review Checklist

- [ ] No new validation logic introduced — all `validationSchemas.js` rules ported verbatim.
- [ ] `CardContainer` (deprecated) is NOT used — `TileContainer` is used instead.
- [ ] `ChipGroupField` imported from `features/team/components/ChipGroup/ChipGroupField`, not from `fe-design-base`.
- [ ] All user-visible strings go through `toI18n()` — no hardcoded English.
- [ ] No new i18n keys added (all reused from existing `new_team_drawer.json`).
- [ ] `InviteOnlyCheckbox` reused as-is — not reimplemented inline.
- [ ] `ContactInfoRequired` reused as-is — not reimplemented inline.
- [ ] Both card components connect to Redux only for selectors that require it (`currentLocationName`, `managersCanAccess`, `isCountryCodeUS`).
- [ ] No email/phone duplicate-check API calls in `ContactInfoCard` (stripped per non-goals).
- [ ] Feature flag from HRM-3221 covers both cards — no new flag created.
- [ ] Lint passes (`eslint`).
- [ ] TypeScript / prop-types warnings resolved.
- [ ] All test targets listed above pass.
- [ ] Storybook / visual review against Figma node `1472-12930` (spot-check card layout, field order, chip labels).

---

## Definition of Done

- [ ] `ContactInfoCard` renders with correct field order, asterisks, and invite checkbox in Formik context.
- [ ] `ContactInfoRequired` conditional logic matches AC-6, AC-7, AC-8.
- [ ] `JobDetailsCard` renders location (read-only), Employment Type chips, and Access Level chips (gated by `managersCanAccess`).
- [ ] US vs. non-US Employment Type label variants work correctly.
- [ ] All 20 unit tests pass (10 contact + 10 job details).
- [ ] Cards are visible in the child page under the HRM-3221 feature flag.
- [ ] PR description references HRM-3222 and includes before/after screenshots.
- [ ] No regressions on existing `AddTeamDrawer` (run `AddTeamDrawerContainer.test.jsx`).
