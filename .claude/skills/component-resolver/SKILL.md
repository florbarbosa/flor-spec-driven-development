---
name: component-resolver
description: Resolve a UI element to a real fe-design-base component and its exact props. Designbase Storybook MCP first, confirmed against lib/fe-design-base source. Use while writing a design.md component map or while building UI, so components are resolved, not invented.
argument-hint: "[UI element or component name, e.g. single-select pill group]"
allowed-tools: Read, Glob, Grep, Bash, mcp__designbase-storybook__list-all-documentation, mcp__designbase-storybook__get-documentation
---

# component-resolver

Every UI element in a spec or a build must map to a real component with real props. This skill is how
you find it. The rule: **resolve, never invent.**

## Tiers (use the lowest-numbered tier that works)
1. **Tier 1 - Designbase Storybook MCP.** The canonical design system. Call
   `mcp__designbase-storybook__list-all-documentation` to find the component, then
   `mcp__designbase-storybook__get-documentation` for its props. This is the default and covers
   almost everything.
2. **Tier 2 - experimental storybook.** Only if a newer/experimental component is needed and Tier 1
   has no fit. Flag it as experimental in the component map.
3. **Tier 3 - custom build.** Only if neither tier has it. A custom component must be justified in the
   design and flagged.

## Procedure
1. Name the UI element (e.g. "single-select pill group", "read-only location label").
2. Query the MCP (Tier 1). If several candidates exist (e.g. ChipGroup vs RadioButtonGroup vs
   SegmentedPicker for a pill group), compare them against the design intent and pick one, with a
   one-line justification.
3. **Confirm props against the real source.** Read `client/lib/fe-design-base/**` for the chosen
   component to verify prop names, types, Formik-binding, and defaults. The MCP can lag source.
4. Record **surprises** explicitly: deprecated components (do not use), props that must not be
   overridden, single-vs-multi-select behavior keyed off value type, missing props that force
   composition (e.g. composing a tooltip into a `label` ReactNode), etc.

## Output
A component-map row ready for `design.md`:

| UI element | Component | Tier | Key props |
|---|---|---|---|

Plus any "Prop notes / surprises" worth carrying. Cite the source path you confirmed against. If a
component is `@deprecated` in source, say so and name the replacement.

## Gotchas learned in the pilot
- The `Card` organism is `@deprecated` (superseded by `Tile`); use a `Box bgcolor="mono0"` panel for
  form surfaces.
- fe-design-base `*Field` components are Formik-bound (take a `name`, wire into Formik context); plan
  for a single Formik provider, not per-card providers.
- A shared component may hardcode a `data-testid`; reusing it across siblings creates duplicate
  testids. Prefer scoping test queries to the section, or derive unique testids.
