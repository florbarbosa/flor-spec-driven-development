# flor-spec-driven-development

> **Write the spec. Review the spec. Then write the code.**

An experiment in spec-driven development for the HRM team at Homebase — a structured process where every Linear issue becomes a reviewed, grounded spec before anyone writes a single line of product code.

---

## What is spec-driven development?

Spec-driven development (SDD) is a practice where detailed specifications are authored, reviewed, and approved *before* implementation begins. Rather than discovering ambiguity during code review, you surface it during spec review — when changes are cheap.

The key principles:

- **The spec is the contract.** What gets built is exactly what the spec says — no more, no less.
- **Every claim is grounded.** Specs cite real `file:line` references in the target repo, not assumptions.
- **The review is adversarial.** A principal-engineer reviewer actively tries to find gaps, ungrounded claims, scope creep, and missing edge cases.
- **Issues stay small.** One issue = one PR = one focused concern. >10 files = split the issue.
- **The engineer stays in the loop.** Claude does the heavy lifting; engineers approve every checkpoint.

---

## This experiment

The HRM team is testing SDD as a way to ship the [Packet Config milestone](https://linear.app/homebase) with more confidence and less review churn. The hypothesis: if specs are thorough and adversarially reviewed, PRs are smaller, reviews are faster, and integration bugs surface before the code is written.

**What lives here:**
- The process (skills, templates, conventions, documentation)
- The specs for each HRM project (committed alongside the process)

**What lives in Homebase1:**
- The actual product code — not here

Projects are added one by one. Each project gets a directory under `specs/` with its own `project.config.md` (all the resources: Linear project, Figma files, recordings, Slack threads) and a set of issue-level specs organized by milestone.

---

## The flow

```
  ┌──────────┐     ┌─────────┐     ┌──────────────┐     ┌───────────────┐
  │  /setup  │ ──▶ │  Recon  │ ──▶ │ /spec-author  │ ──▶ │/spec-audit │
  │          │     │         │     │               │     │               │
  │ Collect  │     │ Map what│     │ Linear issues │     │ Adversarial   │
  │ all your │     │ exists  │     │ → specs with  │     │ review loop — │
  │resources │     │ today   │     │ real citations│     │ approved or   │
  └──────────┘     └─────────┘     └──────────────┘     │ back to revise│
                                                         └───────┬───────┘
                                                                 │
                                          ┌──────────────────────┘
                                          ▼
  ┌───────────────┐     ┌────────────┐     ┌──────────────────────────────┐
  │ /spec-builder │ ──▶ │  Draft PR  │ ──▶ │    Team review → merge       │
  │               │     │            │     │                              │
  │ Build + verify│     │ /review-pr │     │ Inline comments already      │
  │ + be/fe-review│     │ --auto-    │     │ posted. Address findings.    │
  │ + commit      │     │ comment    │     │                              │
  └───────────────┘     └────────────┘     └──────────────────────────────┘
```

Every step has a Claude skill. The engineer approves every checkpoint.

---

## Skills

| Skill | Trigger | What it does |
|-------|---------|--------------|
| `/setup` | Once per project | Interactive wizard — collects Linear project, Figma, recordings, Slack threads, target repo. Writes `project.config.md`. |
| `/spec-author` | After setup | Fetches milestones from Linear, asks which to generate specs for. Authors `requirements.md` + `design.md` + `tasks.md` per issue. |
| `/spec-audit` | After authoring | Adversarial principal-engineer review/revise loop. Verifies every anchor against real code. Blocks issues touching >10 files until split. |
| `/spec-builder` | One issue at a time | Builds the approved issue in the target repo. Verifies (tsc/jest/eslint), runs code review, gets engineer sign-off, commits + pushes + opens draft PR. |
| `/be-review` | Auto or standalone | Backend: Ruby/Rails quality, security, DB safety, Packwerk cross-pack rules. |
| `/fe-review` | Auto or standalone | Frontend: TypeScript/React quality, Designbase compliance, i18n, UX tracking, a11y. |
| `/review-pr` | Auto or standalone | Posts all findings to the GitHub PR — inline comments + summary body. |
| `/component-resolver` | During authoring or building | Resolves a UI element to the exact `fe-design-base` component and confirmed props. |

---

## Quick start

```bash
# 1. Clone this repo and open it as your CWD in Claude Code
# (skills are repo-scoped — they load automatically)

# 2. Onboard a new HRM project
/setup

# 3. Select milestones and generate specs from Linear
/spec-author

# 4. Adversarially review every spec before touching code
/spec-audit

# 5. Build one issue at a time — one PR each
/spec-builder 01-my-issue-slug
```

---

## The rules

| Rule | Enforcement |
|------|-------------|
| **1 issue = 1 PR** | Hard rule in `spec-builder` — no exceptions |
| **> 10 files = split the issue** | Blocking finding in `spec-audit` |
| **Homebase conventions always apply** | `be-review` + `fe-review` check everything |
| **Never invent component APIs** | `spec-audit` blocks unverified component claims |
| **Every spec cites `file:line`** | `spec-audit` blocks ungrounded claims |
| **Never push without approval** | `spec-builder` stops and asks at every checkpoint |
| **Build to spec, not beyond** | Out-of-scope work is reported, never implemented |

---

## Repo structure

```
flor-spec-driven-development/
├── README.md
├── AGENTS.md                    ← operating rules for every agent
├── docs/
│   └── HANDOFF.md               ← the full loop, documented
├── templates/
│   ├── project.config.md        ← written by /setup, read by all skills
│   ├── project-spec.md          ← project-level milestone spec
│   └── issue/
│       ├── requirements.md      ← user stories, ACs, edge cases
│       ├── design.md            ← component map, file plan, state/data
│       └── tasks.md             ← build steps, test targets, checklist
├── conventions/
│   ├── conventions-fe.md        ← Homebase frontend standards
│   └── conventions-be.md        ← Homebase backend standards
├── specs/                       ← one directory per HRM project
│   └── <project-slug>/
│       ├── project.config.md    ← resources: Linear, Figma, recordings
│       ├── project-spec.md      ← milestone overview and issue breakdown
│       └── <milestone-slug>/
│           ├── 00-recon/        ← existing behavior inventory
│           └── issues/
│               └── <issue-slug>/
│                   ├── requirements.md
│                   ├── design.md
│                   └── tasks.md
└── .claude/
    ├── skills/                  ← 8 skills, auto-loaded when CWD is this repo
    └── workflows/
        └── spec-audit-loop.js   ← adversarial audit/revise dynamic loop
```

---

## Why this matters for HRM

The HRM team works in a domain with high coordination cost: packs with strict cross-pack data access rules (Packwerk), a shared component system (Designbase), and multiple milestones in flight at once. Integration bugs in this environment are expensive — they surface late, block other issues, and require coordination across multiple engineers.

Spec-driven development addresses this by front-loading the discovery work. By the time an engineer opens a PR, the spec has already been:
- Grounded in real code (`file:line` citations verified by an adversarial reviewer)
- Checked for scope creep and unintended logic changes
- Broken into a size that fits in a focused PR
- Reviewed for edge cases and test coverage targets

The PR review becomes a verification of execution, not a discovery of design problems.

---

*A living experiment — this process will evolve as the HRM team learns what works in practice.*


## TBD

- How can we consider and highlight edge cases for a project when building specs
