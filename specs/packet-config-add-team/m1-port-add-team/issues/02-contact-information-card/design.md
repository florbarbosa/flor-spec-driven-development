---
issue: "02-contact-information-card"
approved: false
---

# Design — Contact Information Card

## Component Map

| UI Element | Component | Tier | Source | Key Props | Notes / Surprises |
|-----------|-----------|------|--------|-----------|------------------|
| Card wrapper | `Box` | MCP | `fe-design-base/atoms/Box` | `p={32} mb={24}` | No dedicated Card component in Designbase for this usage; use Box with appropriate padding |
| Card section title | `Text` | MCP | `fe-design-base/atoms/Text` | `variant="heading3" i18n="add_team.individual_drawer.contact_info"` | Same key used at `ContactInfo.jsx:85` |
| First name input | `TextField` | MCP | `fe-design-base/molecules/TextField` | `name="firstName" label={toI18n('add_team.first_name')} required value errorText onChange onBlur` | Existing usage at `ContactInfo.jsx:52-63` used deprecated `components/forms/TextField` — new card uses fe-design-base |
| Last name input | `TextField` | MCP | `fe-design-base/molecules/TextField` | `name="lastName" label={toI18n('add_team.last_name')} value errorText onChange onBlur` | Optional field |
| Phone input | `TextField` | MCP | `fe-design-base/molecules/TextField` | `name="phone" type="phone" placeholder errorBorder errorText value onChange onBlur` | `errorBorder` prop: check if `fe-design-base TextField` supports this — verify via MCP before building |
| Email input | `TextField` | MCP | `fe-design-base/molecules/TextField` | `name="email" placeholder errorBorder errorText value onChange onBlur` | Same `errorBorder` concern as phone |
| Invite SMS checkbox | `Checkbox` | MCP | `fe-design-base/molecules/Checkbox` | `name="sendSms" checked={sendSms} label={toI18n('add_team.individual_drawer.send_sms')} onChange` | Existing usage at `Form.jsx:131` used deprecated `components/forms/CheckboxInput` |
| Info alert banner | `Box` | MCP | `fe-design-base/atoms/Box` | `p={12} bg="blueLightest" bradius={8} mb24` | Matches existing pattern at `ContactInfo.jsx:38-45`; render only when `showDrawerContactInformationAlert` is true |

---

## File Plan

| Action | File path | Purpose |
|--------|-----------|---------|
| create | `client/src/features/addTeam/AddTeamPage/ContactInformationCard/ContactInformationCard.tsx` | New card component |
| create | `client/src/features/addTeam/AddTeamPage/ContactInformationCard/ContactInformationCard.test.tsx` | Tests for the card |
| create | `client/src/features/addTeam/AddTeamPage/ContactInformationCard/index.ts` | Re-export |
| modify | `client/src/features/addTeam/AddTeamPage/AddTeamPage.tsx` | Add form state (useState) + render `ContactInformationCard` in content area |

**Total: 4 files** ✓

---

## Routing & Mounting

- **Mount point:** Rendered inside `<Box data-testid="add-team-page-content">` in `AddTeamPage.tsx` (introduced in issue 01).
- **No new routes** in this issue.

---

## State & Data

### Data sources

| Data | Source | Shape | File:line |
|------|--------|-------|-----------|
| `firstName`, `lastName`, `phone`, `email` | Local `useState` in `AddTeamPage.tsx` | `string` | New — mirrors INIT_STATE at `AddIndividualDrawer.jsx:78-108` |
| `sendSms` | Local `useState` in `AddTeamPage.tsx` | `boolean`, default `true` | `AddIndividualDrawer.jsx:97` |
| `errors` | Local `useState` in `AddTeamPage.tsx` | `Record<string, string>` | `AddIndividualDrawer.jsx:92` |
| `requestInformation` | Local `useState` in `AddTeamPage.tsx` | `string \| null` | `AddIndividualDrawer.jsx:102` |
| `isPayrollSetup` | Passed from parent / Redux `getIsPayrollSetup` | `boolean` | `FormView.tsx:153` |
| `drawerContactInformationEditButtonDisabled`, `showDrawerContactInformationAlert` | `usePersonalInformationEditState` hook | `{ drawerContactInformationEditButtonDisabled: boolean, showDrawerContactInformationAlert: boolean }` | `ContactInfo.jsx:27-33` |

### Loading / error handling

- No async data in this card — all validation is synchronous (yup schema + `validateState` at `AddIndividualDrawer.jsx:127`).
- Error state: field-level inline error text from `errors` state.

### Form state

- Library: plain `useState` — no Formik in this issue. Validation logic reused from `buildStateValidator(schema)` at `AddIndividualDrawer.jsx:127`.
- Validation schema: `yup.object` at `AddIndividualDrawer.jsx:112-125` — **do not change this schema**.
- Submit handler: not in this issue (issue 04).

---

## Feature Flag

> This card renders unconditionally once the route is loaded. The flag gates CTA navigation (issue 01), not individual cards.

---

## Eventing

> Deferred to `05-step1-eventing`.

---

## i18n

| Key | Default English value |
|-----|-----------------------|
| `add_team.first_name` | `"First name"` — used at `ContactInfo.jsx:51` |
| `add_team.last_name` | `"Last name"` — used at `ContactInfo.jsx:67` |
| `add_team.individual_drawer.contact_info` | `"Contact information"` — used at `ContactInfo.jsx:85` |
| `add_team.individual_drawer.phone_placeholder` | `"Phone number"` — used at `ContactInfo.jsx:97-99` |
| `add_team.individual_drawer.email_placeholder` | `"Email address"` — used at `ContactInfo.jsx:116-118` |
| `add_team.individual_drawer.send_sms` | `"Send invite via text"` — used at `Form.jsx:132` |
| `fe_design_base.max_length` | Existing error message — used at `AddIndividualDrawer.jsx:116` |
| `fe_design_base.email_invalid` | Existing error message — used at `AddIndividualDrawer.jsx:117` |
| `fe_design_base.phone_invalid` | Existing error message — used at `AddIndividualDrawer.jsx:119` |
| `product_usage.hover_text.edit_button_disabled_text` | Existing message — used at `ContactInfo.jsx:41-45` |

---

## Risks & Assumptions

| # | Risk / Assumption | Mitigation |
|---|------------------|------------|
| R-1 | `fe-design-base TextField` may not have an `errorBorder` prop (the existing code uses a deprecated `components/forms/TextField`) | Verify via `mcp__designbase-storybook__get-documentation` before building. Fallback: style the border via `Box` wrapper + conditional className |
| R-2 | `usePersonalInformationEditState` is used in `ContactInfo.jsx` — it references `currentUserId` from session and the `user` prop (editing mode only) | The hook is unchanged; the new card just calls it the same way. Importing from `hooks/usePersonalInformationEditState`. |
| R-3 | `AddTeamPage` accumulating form state via `useState` may grow unwieldy by M2 | Acceptable for M1; flag in PR for future Redux slice extraction in M2 |
