---
issue: "02-contact-information-card"
approved: false
---

# Tasks — Contact Information Card

## Build Steps

- [ ] **Step 1 — Verify `fe-design-base TextField` supports `errorBorder`**
  - Use `mcp__designbase-storybook__get-documentation` for `TextField`. Confirm whether the `errorBorder` prop exists or if border styling must be done differently.
  - Record finding in a code comment in `ContactInformationCard.tsx`.

- [ ] **Step 2 — Create `ContactInformationCard.tsx`**
  - File: `client/src/features/addTeam/AddTeamPage/ContactInformationCard/ContactInformationCard.tsx`
  - What to do:
    - Props interface: `firstName`, `lastName`, `phone`, `email`, `sendSms`, `requestInformation`, `errors`, `handleChange`, `handleBlur`, `isPayrollSetup`, `user` (for `usePersonalInformationEditState`).
    - Call `usePersonalInformationEditState({ user, currentUserId })` (import `useSelector(getCurrentUserId)` from `selectors/session`).
    - Render alert banner conditionally on `showDrawerContactInformationAlert` (matching `ContactInfo.jsx:37-46`).
    - Render first name + last name row.
    - Render phone + email row with `errorBorder` when `requestInformation === 'packet'` and both phone and email are empty.
    - Render `Checkbox` for `sendSms` when `!isPayrollSetup`.
    - All strings via `toI18n()`. All components from `fe-design-base`.

- [ ] **Step 3 — Create `index.ts`**
  - File: `client/src/features/addTeam/AddTeamPage/ContactInformationCard/index.ts`
  - What to do: `export { default } from './ContactInformationCard';`

- [ ] **Step 4 — Add form state to `AddTeamPage.tsx` and render the card**
  - File: `client/src/features/addTeam/AddTeamPage/AddTeamPage.tsx`
  - What to do:
    - Add `useState` for: `firstName` (default `''`), `lastName` (default `''`), `phone` (default `''`), `email` (default `''`), `sendSms` (default `true`), `requestInformation` (default `null`), `errors` (default `{}`).
    - Wire `handleChange` and `handleBlur` using `buildStateValidator(schema)` and `validateState` (same pattern as `AddIndividualDrawer.jsx:283-308`). Import the schema and validators from their existing files.
    - Render `<ContactInformationCard>` inside `<Box data-testid="add-team-page-content">`.

- [ ] **Step 5 — Write tests**
  - File: `client/src/features/addTeam/AddTeamPage/ContactInformationCard/ContactInformationCard.test.tsx`
  - Cover:
    - Renders first name, last name, phone, email inputs
    - First name is required: renders without error initially; error appears after blur with empty value
    - Both phone + email empty + `requestInformation==='packet'` → `errorBorder` on both inputs
    - `sendSms` checkbox visible when `isPayrollSetup=false`, hidden when `true`
    - Alert banner renders when `showDrawerContactInformationAlert=true`
    - Fields disabled when `drawerContactInformationEditButtonDisabled=true`

- [ ] **Step 6 — Verify**
  - `bun ts` — expect: no errors
  - `jest client/src/features/addTeam/AddTeamPage/ContactInformationCard/ContactInformationCard.test.tsx` — expect: all pass
  - Run app with flag ON, navigate to `/team/add` — confirm card renders with all 4 fields and SMS checkbox

---

## Test Coverage Targets

**Happy path**
- [ ] All 4 contact fields render with correct labels and placeholders
- [ ] `sendSms` checkbox renders checked by default when `isPayrollSetup=false`
- [ ] Typing in `firstName` updates value; no error initially

**Error states**
- [ ] E-1: Both phone + email empty + packet mode → error borders on both inputs
- [ ] E-2: `firstName` exceeds 40 chars → `toI18n('fe_design_base.max_length')` error text appears
- [ ] E-3: Invalid email on blur → `toI18n('fe_design_base.email_invalid')` error text appears
- [ ] E-3: Invalid phone on blur → `toI18n('fe_design_base.phone_invalid')` error text appears

**Edge cases**
- [ ] E-4: `editingUser` with `drawerContactInformationEditButtonDisabled=true` → all inputs have `disabled` attribute
- [ ] E-4: `showDrawerContactInformationAlert=true` → alert banner renders above fields
- [ ] E-5: `isPayrollSetup=true` → `sendSms` checkbox not in the DOM

**Loading & empty states**
- [ ] N/A — synchronous form; no loading state

**Tooling**
- [ ] `bun ts` passes
- [ ] `jest` suite passes
- [ ] `eslint` passes on changed files

---

## Self-Review Checklist

**Spec adherence**
- [ ] Every AC from `requirements.md` is addressed
- [ ] No scope creep — only the 4 files in `design.md` were touched
- [ ] All non-goals remain true — `ContactInfo.jsx` and yup schema are unchanged
- [ ] No changes to submit payload or validation schema

**Code quality**
- [ ] All imports use `fe-design-base`, not deprecated `components/`
- [ ] `toI18n()` for every user-visible string — no hardcoded English
- [ ] `useHistory` used correctly if needed (not needed in this card — no navigation)
- [ ] No `any` on exported interfaces
- [ ] No `console.log`

**Tests**
- [ ] `usePersonalInformationEditState` is mocked in tests
- [ ] `getCurrentUserId` selector is stubbed via `createFakeStore`
- [ ] No assertions that swallow failures

**PR readiness**
- [ ] Total files changed = 4
- [ ] Branch: `fb/{ticket-id}-contact-information-card`
- [ ] Linear ticket linked via `hops linear`
- [ ] Draft PR opened

---

## Definition of Done

The issue is done when all build steps are checked, the contact information card renders on `/team/add` with all fields and validation working, all tests pass, and the draft PR has been opened with `/review-pr --auto-comment` findings posted.
