---
issue: "<issue-slug>"
approved: false
---

# Design — <Issue Title>

## Component Map

> Resolve every UI element before building. Tier: MCP (confirmed via Designbase MCP) | experimental (from storybook) | custom (last resort — flag for design review).

| UI Element | Component | Tier | Source | Key Props | Notes / Surprises |
|-----------|-----------|------|--------|-----------|------------------|
| <Button> | `Button` | MCP | `mcp__designbase-storybook` | `variant="primary" size="md" uxElement="..."` | |
| <Text input> | `TextField` | MCP | `mcp__designbase-storybook` | `name value onChange label` | |
| <Page header> | `<ComponentName>` | MCP | `mcp__designbase-storybook` | `<props>` | <Any deprecated API, unexpected required prop, etc.> |
| <Custom element> | `<ComponentName>` | custom | built in this issue | `<props>` | Flag: needs design review before merging |

---

## File Plan

> Flag this section if total files > 10 — the issue must be split before spec-reviewer approves.

| Action | File path | Purpose |
|--------|-----------|---------|
| create | `client/src/features/<feature>/<Component>.tsx` | <Purpose> |
| create | `client/src/features/<feature>/<Component>.test.tsx` | Tests for above |
| modify | `client/src/features/<feature>/index.ts` | Export new component |
| modify | `app/controllers/<controller>.rb` | <What changes> |
| create | `spec/controllers/<controller>_spec.rb` | Tests for above |

**Total: N files** ← must be ≤ 10

---

## Routing & Mounting

- **Route:** `<path>` — defined at `config/routes.rb:line`
- **Feature flag:** gated behind `<flag_name>` — flag defined at `<file:line>`
- **Mount point:** rendered inside `<ParentComponent>` at `<file:line>`
- **Navigation:** back button navigates to `<route>` via `useHistory` (`<file:line>`)

---

## State & Data

### Data sources

| Data | Source | Shape | File:line |
|------|--------|-------|-----------|
| <Data name> | Redux slice `<sliceName>` | `{ field: type }` | `<file:line>` |
| <Data name> | API endpoint `GET /api/v1/<path>` | `{ field: type }` | `<file:line>` |
| <Data name> | Local state (`useState`) | `<type>` | — |

### Loading / error handling

- Loading state: `<what renders while data loads>`
- Error state: `<what renders if the API call fails>`
- Empty state: `<what renders if the data is empty>`

### Form state (if applicable)

- Library: Formik — `initialValues` at `<file:line>`
- Validation schema: `<file:line>` — **do not change existing validation**
- Submit handler: dispatches `<action>` from `<file:line>`

---

## Feature Flag

| Field | Value |
|-------|-------|
| Flag name | `<flag_name>` |
| Default | `false` (off) |
| Defined at | `<file:line>` |
| Rollout plan | Enable in staging first; production after QA sign-off |

---

## Eventing

| Event | Trigger | Payload | Implementation |
|-------|---------|---------|----------------|
| `<event_name>` | When user <action> | `{ product_area: PRODUCT_AREAS.X, event_category: EVENT_CATEGORIES.Y }` | `<file:line>` |

---

## i18n

| Key | Default English value |
|-----|-----------------------|
| `<namespace>.<key>` | `"<English string>"` |
| `<namespace>.<key>` | `"<English string>"` |

---

## Risks & Assumptions

| # | Risk / Assumption | Mitigation |
|---|------------------|------------|
| R-1 | <Assumption about existing API shape> | Verified at `<file:line>` |
| R-2 | <Risk of regression in <area>> | Covered by existing test at `<file:line>` |
| R-3 | <Unresolved design question> | Defaulting to <X>; flag in PR if wrong |
