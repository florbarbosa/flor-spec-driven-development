---
project: "packet-config-add-team"
linear_project_url: "https://linear.app/joinhomebase/project/packet-configuration-streamline-how-packets-are-set-up-and-sent-during-54810b23e043/overview"
milestone: "all"
status: "draft"
---

# Project Spec — Packet Configuration: Add Team

## 1. Mission & Scope

**What this project accomplishes:**
Replaces the existing Add Team Member bottom-sheet modal with a 2-step full-page experience that embeds packet configuration at the moment of invite. OAMs no longer need to navigate to a separate config page before they can send onboarding documents — Step 1 collects identity and job details, Step 2 lets them configure and preview the exact packet the new hire will receive. A new Roster column gives at-a-glance visibility into onboarding document completion status for every team member.

**What this project does NOT do:**
- Document/packet lifecycle (status, send-after-hire, one-off packets) — sibling epic
- Role-based packet differentiation (different docs for cooks vs servers) — deferred to next iteration
- Build a new employer details side panel — reuses existing component from New Hire Onboarding page
- Send Test Email modal (Section 5) — struck from scope in current AC

---

## 2. Target Repo & Intake

| Field | Value |
|-------|-------|
| Target repo | `/Users/fbarbosa/Documents/Homebase1` |
| Primary intake | [Linear project](https://linear.app/joinhomebase/project/packet-configuration-streamline-how-packets-are-set-up-and-sent-during-54810b23e043/overview) |
| Figma | [New Hire Packets — Documents](https://www.figma.com/design/HSvGEOyEmuDtUGcpOQ8Xpy/New-Hire-Packets---Documents?node-id=19-498&p=f&m=dev) |

---

## 3. Architecture Constraints & Reuse

**Existing patterns to follow:**
- Existing Add Team Member drawer — understand its entry points (Roster, Timesheets, Schedule Builder) before replacing
- Employer details side panel — reuse the existing component from New Hire Onboarding page; do not build a new one
- New Hire Onboarding page custom doc defaults — Step 2 custom doc checkboxes must default to match current location config
- Homebase child page routing pattern — new full-page experience must follow the established nested child page convention

**Things NOT to change:**
- Required/optional field logic from the existing Add Team drawer — all existing validation is preserved
- PTO policy and paid sick leave policy sections — ported as-is, no logic changes
- Existing New Hire Onboarding configuration page — this project only reads from it, does not modify it

---

## 4. Issue Breakdown

> Each issue = one PR. Issues with >10 files must be split.

| # | Milestone | Issue slug | Goal | PR size | Status |
|---|-----------|-----------|------|---------|--------|
| — | M1: Port Add Team to new Child Page | `pending` | Replace modal with child page shell | — | `pending` |
| — | M2: Second Child Page with Embedded Packet Config | `pending` | Step 2 packet configuration page | — | `pending` |
| — | M3: Add Previews | `pending` | Preview pane in Step 2 | — | `pending` |

> Issue breakdown will be proposed by `/spec-author` per milestone.

---

## 5. Cross-cutting Requirements

> Every issue must respect these.

- **Feature flags:** all new surfaces gated behind an appropriate flag (default: off) — flag name to be confirmed per issue
- **i18n:** all user-visible strings via `toI18n()` — no hardcoded English
- **Eventing:** Amplitude events per the consolidated eventing spec in Linear (TODO: link to be attached by Sammy). Engineering consumes it as source of truth for event names, properties, and trigger points
- **Spanish translations:** all new/modified strings translated to Latin American Spanish per Homebase translation workflow (TODO: translation file to be attached by Sammy)
- **Testing:** every issue must cover happy path + at least the top 3 error states
- **Observability:** Datadog + Sentry instrumentation required for new surfaces per Linear AC (packet send funnel, employer-details side panel save, document checkbox persistence)

---

## 6. Review / QA Rubric

The project is complete when:
- [ ] All issues are merged to the feature branch
- [ ] Combined test suite passes (tsc + jest + eslint)
- [ ] Each AC from Linear is covered by a spec and verifiable in the running app
- [ ] Feature flag toggled ON — no regressions on previously passing Add Team surfaces
- [ ] i18n: Spanish translation keys present for all new English keys
- [ ] Amplitude events fire per consolidated eventing spec
- [ ] Datadog/Sentry instrumentation in place for new surfaces

---

## 7. Open Questions

| # | Question | Default if unresolved | Owner | Status |
|---|----------|----------------------|-------|--------|
| 1 | What does the "Never sent" Roster column state look like? | Empty cell / dash | Design | `open` |
| 2 | Does clicking the Roster onboarding pill navigate anywhere? | No navigation | Design | `open` |
| 3 | Does primary CTA copy change between add-only and proceed-to-step-2 branches? | Keep "Add team member" | Design | `open` |
| 4 | Is Location read-only in Step 1, or can multi-location OAMs choose? | Read-only (current location context) | Design | `open` |
| 5 | Is Direct deposit shown only on payroll companies, or always? | Always shown | Design | `open` |
| 6 | Does the Documents preview tab update live as left-pane checkboxes change? | Yes, live | Design | `open` |
| 7 | If OAM proceeds with missing employer details, does system block, warn, or send with custom docs only? | Warn + allow custom docs only | Design | `open` |
| 8 | Amplitude eventing doc link (TODO Sammy) | Block on eventing detail per issue | Sammy | `open` |
| 9 | Spanish translation file link (TODO Sammy) | Block before release | Sammy | `open` |

---

## 8. Appendix: AC Coverage

> Traceability: Linear AC section → Milestone

| Linear AC Section | Milestone |
|-------------------|-----------|
| Section 1: Roster Onboarding Documents Column | M2 |
| Section 2: Add Team Member Step 1 (Contact + Job Details) | M1 |
| Section 3: Add Team Member Step 2 (Set Up Onboarding) | M2 |
| Section 4: Missing Employer Details (Empty State) | M2 |
| Section 3 Preview Pane | M3 |
