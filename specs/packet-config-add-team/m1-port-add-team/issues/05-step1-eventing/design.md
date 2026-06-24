---
issue: "05-step1-eventing"
approved: false
---

# Design — Step 1 Eventing

## Component Map

> This issue has no new UI elements. All changes are to TypeScript files (constants + tracking functions + wiring in existing components).

| UI Element | Component | Tier | Source | Key Props | Notes / Surprises |
|-----------|-----------|------|--------|-----------|------------------|
| *(none — no new UI)* | — | — | — | — | — |

---

## File Plan

| Action | File path | Purpose |
|--------|-----------|---------|
| create | `client/src/features/addTeam/AddTeamPage/tracking.ts` | Typed tracking functions for all AddTeamPage events |
| modify | `client/src/util/tracking_constants.ts` | Add 3 new event action constants: `ADD_TEAM_PAGE_SHOWN`, `ADD_TEAM_CONTINUE_CLICKED`, `ADD_TEAM_BACK_CLICKED` |
| modify | `client/src/features/addTeam/AddTeamPage/AddTeamPage.tsx` | Wire `ADD_TEAM_PAGE_SHOWN` in `useEffect`; wire `ADD_TEAM_BACK_CLICKED` on back button; wire CTA events |

**Total: 3 files** ✓

---

## Routing & Mounting

- No routing changes in this issue.
- Events are wired directly in `AddTeamPage.tsx` — no HOC or Redux connect needed.

---

## State & Data

### Data sources

| Data | Source | Shape | File:line |
|------|--------|-------|-----------|
| `trackUxEvent` | Imported from `util/tracking` | `(params) => void` | Same import pattern as `AddIndividualDrawer/tracking.js:1` |
| `EVENT_ACTIONS` | Imported from `util/tracking_constants` | `Record<string, string>` | `util/tracking_constants.ts:548` area |
| `PRODUCT_AREAS` | Imported from `util/tracking_constants` | `Record<string, string>` | Same file |
| `EVENT_CATEGORIES` | Imported from `util/tracking_constants` | `Record<string, string>` | Same file |

### Loading / error handling

- `trackUxEvent` is fire-and-forget. No error handling needed — consistent with how all other tracking calls work in the codebase.

---

## Feature Flag

> Not applicable — events are always wired when `AddTeamPage` renders.

---

## Eventing

| Event | Trigger | Payload | Implementation |
|-------|---------|---------|----------------|
| `ADD_TEAM_PAGE_SHOWN` | `useEffect([], [])` in `AddTeamPage.tsx` | `{ product_area: PRODUCT_AREAS.TEAM, event_category: EVENT_CATEGORIES.ADD_TEAM }` | `client/src/features/addTeam/AddTeamPage/tracking.ts` → `trackAddTeamPageShown()` |
| `SAVE_AND_CLOSE_CLICKED` | "Save and Finish" click handler | `{}` | `tracking.ts` → `trackSaveAndClose()` — mirrors `AddIndividualDrawer.jsx:526-528` |
| `SAVE_AND_ADD_ANOTHER_CLICKED` | "Save and Add Another" click handler | `{}` | `tracking.ts` → `trackSaveAndAdd()` — mirrors `AddIndividualDrawer.jsx:538-540` |
| `ADD_TEAM_CONTINUE_CLICKED` | "Continue" click handler | `{ product_area: PRODUCT_AREAS.TEAM }` | `tracking.ts` → `trackContinueClicked()` |
| `ADD_TEAM_BACK_CLICKED` | Back button click handler | `{ product_area: PRODUCT_AREAS.TEAM }` | `tracking.ts` → `trackBackClicked()` |

---

## i18n

> No i18n changes in this issue.

---

## Risks & Assumptions

| # | Risk / Assumption | Mitigation |
|---|------------------|------------|
| R-1 | `EVENT_CATEGORIES.ADD_TEAM` may not exist in `tracking_constants.ts` | Grep for it before building: `grep -n "ADD_TEAM" client/src/util/tracking_constants.ts`. If it exists, use it; if not, add it alongside the new event actions. |
| R-2 | `SAVE_AND_CLOSE_CLICKED` and `SAVE_AND_ADD_ANOTHER_CLICKED` were already wired in issue 04 — wiring them again in this issue would double-fire the events | Coordinate with issue 04: issue 04 should leave a `TODO(05-step1-eventing):` comment where the event calls should go, and this issue fills them in. Alternatively, issue 04 wires these two events directly (they already exist) and issue 05 only adds the 3 new events. |
| R-3 | Amplitude event names must match what analytics dashboards expect | Confirm `ADD_TEAM_PAGE_SHOWN` string value with the analytics team before shipping |
