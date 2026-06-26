# Process Backlog

Pending improvements to the SDD flow. Add items here as they come up; close them out with a date when applied.

---

## Open

- [ ] **PR size flag** — In `spec-builder` Step 4, if the built PR exceeds 10 files, surface a stronger warning and suggest splitting scope into a follow-up issue rather than just continuing.
- [ ] **Update existing Linear issues** — The packet-config project's existing Linear issues were created before the HRM template rule was added. Update them to include proper description, ACs, dev notes, dependencies, and ordering. (ref: `spec-author/SKILL.md` Step 3)
- [ ] **README + HANDOFF updates** — Reflect all new steps added in this session: rollout step in `/setup`, branch setup in `/spec-builder`, next-step prompts at end of each skill, model defaults for audit agents.
- [ ] **Rollout/experiment documentation** — The `/setup` Step 5 rollout section is a placeholder. Document how `redux_rollout` vs experiment flags work at Homebase, how to register a new entry in `fetch.rb`, and what BE work is required before FE flags can be used. (ref: `docs/refinements/2026-06-25.md`)
- [ ] **Slack draft on PR open** — Future exploration: once a draft PR is open, draft a Slack message to each team that needs to review it. Should be opt-in, not auto-sent.
- [ ] **QA process** — Visual QA is currently manual beyond the screenshot step. Add more structure for Homebase-specific cases: flag/rollout-gated pages, auth-required routes, multi-location scenarios.
- [ ] **Update `project.config.md` template** — Add `rollout_strategy` section to the template so new projects pick it up automatically from `/setup`.

## Done

- [x] 2026-06-25 — `spec-review-loop.js` renamed to `spec-audit-loop.js`; naming consistent everywhere
- [x] 2026-06-25 — Always-draft PR rule hardened across all skills and docs
- [x] 2026-06-25 — `MAX_ROUNDS` reduced 3 → 2; round summary logging added to audit loop
- [x] 2026-06-25 — `spec-author`: Linear issue creation now follows HRM template (description, ACs, dev notes, dependencies, ordered by work sequence)
- [x] 2026-06-25 — `spec-builder`: branch setup check added at start (auto-pull + create branch from main when clean)
- [x] 2026-06-25 — `spec-audit`: reviewer uses `model: opus`; reviser uses `model: sonnet`
- [x] 2026-06-25 — `fe-review`: posts PR comment summarizing applied fixes after commit
- [x] 2026-06-25 — Next-step prompts added to end of `spec-author`, `spec-audit`, `spec-builder`
- [x] 2026-06-25 — `/setup` Step 5: rollout/experiment strategy question added (with TODO for deeper Homebase docs)
