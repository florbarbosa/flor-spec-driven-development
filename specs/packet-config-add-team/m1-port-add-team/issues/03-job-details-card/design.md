---
issue: "03-job-details-card"
approved: false
---

# Design — Job Details Card

## Component Map

| UI Element | Component | Tier | Source | Key Props | Notes / Surprises |
|-----------|-----------|------|--------|-----------|------------------|
| Card wrapper | `Box` | MCP | `fe-design-base/atoms/Box` | `p={32} mb={24}` | Same pattern as ContactInformationCard |
| Card title | `Text` | MCP | `fe-design-base/atoms/Text` | `variant="heading3" i18n="add_team.individual_drawer.job_details"` (new key) | New i18n key needed |
| Access level selector | `AccessLevel` | custom (existing) | `AddIndividualDrawer/Form/AccessLevel/AccessLevel.jsx` | `level handleChange accessLevelOptions cxEl` | Existing component — do not modify; re-use as-is |
| Roles/wages block | `RolesBlock` | custom (existing) | `AddIndividualDrawer/Form/RolesBlock/RolesBlock.jsx` | `onChange editingRolesData key={userId} isEmployee` | Conditional on `canViewWages` |
| Packet row | `PacketRow` | custom (existing) | `AddIndividualDrawer/Form/Onboarding/PacketRow.jsx` | See existing props at `Form.jsx:162-193` | Conditional on `hasOnboardingDocsAccess && newHireOnboardingActivated` |
| Hire date input | TBD | MCP or custom | Verify via `mcp__designbase-storybook__list-all-documentation` | `value={hireDate} onChange errorText` | Current drawer may use a non-Designbase date picker — verify before building |
| Location (read-only) | `Text` | MCP | `fe-design-base/atoms/Text` | `variant="body1"` with current location name | Not a form input — display only |

---

## File Plan

| Action | File path | Purpose |
|--------|-----------|---------|
| create | `client/src/features/addTeam/AddTeamPage/JobDetailsCard/JobDetailsCard.tsx` | New card component |
| create | `client/src/features/addTeam/AddTeamPage/JobDetailsCard/JobDetailsCard.test.tsx` | Tests for the card |
| create | `client/src/features/addTeam/AddTeamPage/JobDetailsCard/index.ts` | Re-export |
| modify | `client/src/features/addTeam/AddTeamPage/AddTeamPage.tsx` | Add job state fields + render `JobDetailsCard` |

**Total: 4 files** ✓

---

## Routing & Mounting

- **Mount point:** Rendered below `ContactInformationCard` inside `<Box data-testid="add-team-page-content">` in `AddTeamPage.tsx`.
- **No new routes** in this issue.

---

## State & Data

### Data sources

| Data | Source | Shape | File:line |
|------|--------|-------|-----------|
| `level` | Local `useState` in `AddTeamPage.tsx` | `string`, default `'Employee'` | `AddIndividualDrawer.jsx:91` |
| `hireDate` | Local `useState` in `AddTeamPage.tsx` | `string \| null`, default `null` | `AddIndividualDrawer.jsx:92` |
| `wageAttributes` | Local `useState` in `AddTeamPage.tsx` | `any[]`, default `[]` | `AddIndividualDrawer.jsx:95` |
| `jobTaxClassification` | Local `useState` in `AddTeamPage.tsx` | `string \| null`, default `null` | `AddIndividualDrawer.jsx:80` |
| `contractorType` | Local `useState` in `AddTeamPage.tsx` | `string \| null`, default `null` | `AddIndividualDrawer.jsx:81` |
| `packet` | Local `useState` in `AddTeamPage.tsx` | `string`, default `'w2'` | `AddIndividualDrawer.jsx:80` |
| `fourTensRuleEnabled` | Local `useState` in `AddTeamPage.tsx` | `boolean`, default `false` | `AddIndividualDrawer.jsx:83` |
| `accessLevelOptions` | Redux — `getCurrentLocationAccessLevelOptions(state)` | `Array<{label: string}>` | `AddIndividualDrawer.jsx:145` |
| `canViewWages` | Redux — `getCanViewWages(state)` | `boolean` | `AddIndividualDrawer.jsx:139` |
| `hasOnboardingDocsAccess` | Redux — `getHasOnboardingDocs(state)` | `boolean` | `AddIndividualDrawer.jsx:171` |
| `newHireOnboardingActivated` | Redux — via `getPacketProps(state)` | `boolean` | `AddIndividualDrawer.jsx:601-605` |
| `currentLocationId` | Redux — `getCurrentLocationId(state)` | `number` | `AddIndividualDrawer.jsx:135` |

### Loading / error handling

- No async data — all selectors read from already-loaded Redux state.
- Hire date validation fires synchronously via yup `hireDateRange`.

### Form state

- `handleJobTaxClassificationChange`, `handleContractorTypeChange`, `handlePacketChange`, `setFieldValue` — same handlers as in `AddIndividualDrawer.jsx:226-260`.
- Add these handlers to `AddTeamPage.tsx`.

---

## Feature Flag

> Same flag as issue 01 — `packet_config_add_team_page`. Not re-gated here.

---

## Eventing

> Deferred to `05-step1-eventing`.

---

## i18n

| Key | Default English value |
|-----|-----------------------|
| `add_team.individual_drawer.job_details` | `"Job details"` — **new key, must be added to both `en` and `es` locale files** |
| `add_team.individual_drawer.access_level` | `"Access level"` — used at `AccessLevel.jsx:20` |
| `add_team.individual_drawer.tooltip` | `"Tooltip text"` — used at `AccessLevel.jsx:26` |
| `add_team.individual_drawer.hire_date` | `"Hire date"` — TBD; check existing i18n keys for the hire date label |
| `add_team.individual_drawer.location` | `"Location"` — new key for the read-only location display label |

---

## Risks & Assumptions

| # | Risk / Assumption | Mitigation |
|---|------------------|------------|
| R-1 | Hire date picker: the existing drawer likely uses a non-fe-design-base date picker. Migrating to Designbase may require changes to `hireDateRange` validation binding | Verify before building. If no Designbase date picker exists, use the existing pattern and flag for future migration. |
| R-2 | `RolesBlock` and `PacketRow` are class-based or use internal Redux state — mounting them in a new parent may surface prop threading issues | Test in the running app after integration; the existing `Form.jsx:149-193` shows the exact prop list needed |
| R-3 | `canEditTaxClassification` depends on `editingUser`, `hasNoActivePayments`, `hasITIN` — these need to be in `AddTeamPage` state | Add `hasNoActivePayments`, `hasITIN`, `hasPaidPayrollRunsForJob` to AddTeamPage state (all default `false` per `AddIndividualDrawer.jsx:84-86`) |
