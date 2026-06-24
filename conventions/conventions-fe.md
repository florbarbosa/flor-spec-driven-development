# Homebase Frontend Conventions

> Used by `/fe-review`, `/spec-audit`, and `/spec-builder`. These are hard rules — not suggestions.

---

## TypeScript

- No `any` on exported or public interfaces → use `unknown` or a specific type
- No unnecessary `as` casts that silence TypeScript errors → fix the source type
- No `enum` → use string literal unions with `as const`
- No `React.FC` → type props explicitly
- Missing prop types or overly broad prop interfaces → tighten them

## React patterns

- `useHistory` / `Redirect` from `react-router-dom` — project is on RR v5; never `browserHistory`
- No React Router v6/v7 APIs
- No `axios` imports → use `client/src/api/fetch.js`
- No `window.*` reads → use Redux state, `getConfig()`, or service endpoints
- No new `window.*` globals
- No props spreading (`{...props}`) — obscures API, bypasses TypeScript checking
- No sub-render methods (`renderXxx()`) inside component bodies → extract to a proper component or inline JSX

## Hook hygiene

- Side effects in render body (`setTimeout`, subscriptions, DOM mutations) → must be inside `useEffect` with cleanup
- Every `useEffect` must have a comment describing its intent
- Deliberate dep array omissions must be commented inline explaining why
- `useMemo` on scalar values (string, number, boolean) → overhead not worth it; only for expensive calcs or reference stability
- `ref.current` captured at render time → must be read and null-checked at call time

## Component API

- Root element must not have external margins or positioning (`mt`, `mb`, `position: absolute`) — parent is responsible for layout
- Form input components must have `name`, `value`, `onChange` props; `onChange` must produce `{ target: { name, value } }`
- Pass scalars as props, not full object references when only 1-2 fields are needed

## Error handling & console hygiene

- `console.log` / `console.warn` / `console.error` in production-bound code → remove or route to Sentry
- Errors must surface in UI — `console.error` with no corresponding state update is a bug

## Naming

- Files: `PascalCase` only for React components/classes; everything else `camelCase`
- Callbacks: props use `on` prefix (`onSave`); internal handlers use `handle` prefix (`handleSave`)
- Predicates: functions returning `boolean` must read like a question (`isValid`, `hasPermission`)
- Test `describe()` blocks must match the exact casing of the export being tested

## Homebase-specific

- **`fe-design-base` only** — no deprecated `src/components/`, no `@mui/material` or `@fortawesome` direct imports
- **`uxElement` prop** — every interactive Designbase component must have it (free auto-tracking)
- **UX tracking constants** — use from `util/tracking_constants` (`PRODUCT_AREAS`, `EVENT_CATEGORIES`, `EVENT_ACTIONS`, `ACTION_TYPES`) — reference as `PRODUCT_AREAS.HRM`, never destructure at top of file
- **`toI18n()`** — all user-visible strings must use translation keys; no hardcoded English
- No dynamic i18n key prefixes (`` toI18n(`${prefix}.key`) ``) → use full static paths
- Manual pluralization → use `_one`/`_other` keys with `count` via i18next
- `style={{}}` inline only for truly dynamic values; use Designbase props or `.scss` otherwise
- Spacing on Designbase props: use tokens (`'xs'`, `'sm'`, `'md'`, `'lg'`, `'xl'`, `'2xl'`) — not raw pixel numbers
- **SCSS:** no `!important`, no hardcoded hex colors (use `stylesheets/base/_colors.scss` variables), BEM class names
- Shared components (in `shared/` or used across features) must not be connected to Redux
- **Redux Toolkit only** — no Immutable.js patterns (`.get()`, `.set()`, `.toJS()`)
- **Routing:** use `AppRoute` and `LandingRoute` for new routes; no new Rails bridge methods; no new HAML root mounts

## Testing (React Testing Library)

- RTL exclusively — no Enzyme
- Query priority: `getByRole` → `getByLabelText` → `getByText` → `getByTestId` (last resort)
- Async assertions: `findBy` or `waitFor` — not `act` workarounds
- Components using UX tracking: wrap in `UxRoot` / `withDesignBaseTheme` + `createFakeStore`
- `jest.clearAllMocks()` in `beforeEach`
- Cover: happy path + major failure branches (missing data, API failure, async rejection)
- No `given` in test descriptions — use `when` / `with` / `and`
- `userEvent` over `fireEvent`
- Do not assert that a callback was called without checking what it was called with

## Magic values (logic only — never flag CSS/style values)

- Status strings, domain thresholds, multipliers used in conditions → extract to named constants
- CSS pixel values, spacing values, Box props like `minh={40}` → **never flag or extract**
