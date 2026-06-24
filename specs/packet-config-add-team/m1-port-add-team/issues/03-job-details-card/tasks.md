---
issue: "03-job-details-card"
approved: false
---

# Tasks — Job Details Card

## Build Steps

- [ ] **Step 1 — Research hire date component**
  - Use `mcp__designbase-storybook__list-all-documentation` to find date picker options in fe-design-base.
  - If no Designbase date picker, identify the component currently used in the existing drawer (search `AddIndividualDrawer/Form/FormPayroll.jsx` or `Form.jsx` for any date input component).
  - Record finding in a code comment in `JobDetailsCard.tsx`.

- [ ] **Step 2 — Add missing i18n keys**
  - Files: `client/config/locales/en/front_end/add_team.yml` and `client/config/locales/es/front_end/add_team.yml` (verify exact paths)
  - What to add: `add_team.individual_drawer.job_details`, `add_team.individual_drawer.location`
  - Spanish translations: add placeholder `""` with a TODO comment until translator provides copy

- [ ] **Step 3 — Expand form state in `AddTeamPage.tsx`**
  - File: `client/src/features/addTeam/AddTeamPage/AddTeamPage.tsx`
  - What to add: `useState` for `level` (default `'Employee'`), `hireDate` (default `null`), `wageAttributes` (default `[]`), `jobTaxClassification` (default `null`), `contractorType` (default `null`), `packet` (default `'w2'`), `fourTensRuleEnabled` (default `false`), `hasNoActivePayments` (default `false`), `hasITIN` (default `false`), `hasPaidPayrollRunsForJob` (default `false`).
  - Wire `handleJobTaxClassificationChange`, `handleContractorTypeChange`, `handlePacketChange`, `setFieldValue` matching the implementations at `AddIndividualDrawer.jsx:226-260`.
  - Connect Redux selectors: `canViewWages` (`getCanViewWages`), `hasOnboardingDocsAccess` (`getHasOnboardingDocs`), `accessLevelOptions` (`getCurrentLocationAccessLevelOptions`), `currentLocationId` (`getCurrentLocationId`), and the `packetProps` fields via `getPacketProps`.

- [ ] **Step 4 — Create `JobDetailsCard.tsx`**
  - File: `client/src/features/addTeam/AddTeamPage/JobDetailsCard/JobDetailsCard.tsx`
  - What to do:
    - Props interface: all job state fields + handlers + `canViewWages`, `hasOnboardingDocsAccess`, `newHireOnboardingActivated`, `accessLevelOptions`, `editingUser`, etc.
    - Render card title with new i18n key.
    - Render location as read-only `Text` (display `currentLocationName`).
    - Render `<AccessLevel>` component.
    - Conditionally render `<RolesBlock>` when `canViewWages`.
    - Conditionally render `<PacketRow>` when `hasOnboardingDocsAccess && newHireOnboardingActivated`.
    - Render hire date input (component resolved in Step 1).

- [ ] **Step 5 — Create `index.ts`**
  - File: `client/src/features/addTeam/AddTeamPage/JobDetailsCard/index.ts`
  - What to do: `export { default } from './JobDetailsCard';`

- [ ] **Step 6 — Integrate card in `AddTeamPage.tsx`**
  - File: `client/src/features/addTeam/AddTeamPage/AddTeamPage.tsx`
  - Render `<JobDetailsCard>` below `<ContactInformationCard>` in the content area.

- [ ] **Step 7 — Write tests**
  - File: `client/src/features/addTeam/AddTeamPage/JobDetailsCard/JobDetailsCard.test.tsx`
  - Cover:
    - Access level selector renders with Employee selected by default
    - `RolesBlock` renders when `canViewWages=true`, does not render when `false`
    - `PacketRow` renders when both flags `true`, does not render when `hasOnboardingDocsAccess=false`
    - Location label renders as read-only text
    - Hire date validation error on invalid range

- [ ] **Step 8 — Verify**
  - `bun ts` — expect: no errors
  - `jest client/src/features/addTeam/AddTeamPage/JobDetailsCard/JobDetailsCard.test.tsx` — expect: all pass
  - Run app with flag ON, navigate to `/team/add` — confirm job details card renders with access level, wages, and packet row

---

## Test Coverage Targets

**Happy path**
- [ ] Card renders with all sections (access level, wages, packet row, hire date, location)
- [ ] Employee access level selected by default
- [ ] Wages block visible with `canViewWages=true`
- [ ] PacketRow visible with both onboarding flags true

**Error states**
- [ ] E-5: Hire date outside valid range → `hireDateRange` yup error rendered on field
- [ ] E-3: Contractor type not selected + packet mode → `canRequestInformation` returns false (tested via integration in AddTeamPage)

**Edge cases**
- [ ] E-1: `canViewWages=false` → `RolesBlock` absent from DOM
- [ ] E-2: `hasOnboardingDocsAccess=false` → `PacketRow` absent from DOM
- [ ] E-4: `hasPaidPayrollRunsForJob=true` → `canEditTaxClassification` logic correctly gates tax field editing

**Loading & empty states**
- [ ] N/A — no async data in this card

**Tooling**
- [ ] `bun ts` passes
- [ ] `jest` suite passes
- [ ] `eslint` passes on changed files

---

## Self-Review Checklist

**Spec adherence**
- [ ] Every AC from `requirements.md` is addressed
- [ ] No scope creep — only the 4 files in `design.md` were touched (plus i18n yml files — count: 6 total, still ≤ 10)
- [ ] `AccessLevel.jsx`, `RolesBlock.jsx`, `PacketRow.jsx` are unchanged
- [ ] Submit payload and `jobAttributes()` shape unchanged

**Code quality**
- [ ] New i18n keys present in both `en` and `es` locale files
- [ ] `toI18n()` for all new user-visible strings
- [ ] No `any` on exported interfaces
- [ ] No `console.log`

**Tests**
- [ ] Redux selectors mocked via `createFakeStore`
- [ ] Existing `AccessLevel`, `RolesBlock`, `PacketRow` tested as black boxes (no internal mock)

**PR readiness**
- [ ] Total files changed ≤ 10
- [ ] Branch: `fb/{ticket-id}-job-details-card`
- [ ] Linear ticket linked via `hops linear`
- [ ] Draft PR opened

---

## Definition of Done

The issue is done when the job details card renders on `/team/add` with access level, wages (conditional), packet row (conditional), hire date, and read-only location, all tests pass, and the draft PR has been opened with `/review-pr --auto-comment` findings posted.
