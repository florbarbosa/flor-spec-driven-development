---
name: spec-audit
description: Adversarial principal-engineer audit loop per issue. Verifies every claim against real target-repo code. Blocks issues touching >10 files. Returns approved or unresolvable blocking findings after up to 3 rounds.
argument-hint: "[optional: issue slug or list of slugs, e.g. 01-child-page-route-shell]"
allowed-tools: Read, Glob, Grep, Bash, Edit, Agent, mcp__designbase-storybook__list-all-documentation, mcp__designbase-storybook__get-documentation, mcp__linear__get_issue
---

# /spec-audit

Adversarial review of issue specs. Acts as a skeptical principal engineer: reads every spec file, verifies every claim against the real target repo, and blocks anything that would cause a wrong build. Runs a review → revise loop until approved or until the max rounds are exhausted.

---

## Steps

### Step 0: Load context

Read `specs/*/project.config.md` (auto-detect project, or ask if multiple exist). Extract `target_repo`.

**Identify specs to review:**
- If an issue slug (or list of slugs) was passed as an argument → review only those
- Otherwise → scan `specs/<project>/` for all spec files missing `approved: true` in their frontmatter

Display:
```
Reviewing N spec(s):
  - <slug>  (milestone: <name>)
  ...
```

### Step 1: Review loop (per issue, up to 3 concurrent)

For each spec, run up to `MAX_ROUNDS = 2` audit → revise iterations. After each rejected round, log a one-line summary: what blocked it (categories) and the reviewer's overall summary sentence — so the engineer can see at a glance why each round failed without reading the full finding list.

---

#### Reviewer agent (subagent_type: general-purpose, model: opus, effort: high)

The reviewer acts as a skeptical principal engineer. It receives:
- Full content of `requirements.md`, `design.md`, `tasks.md`
- Target repo path (absolute)
- Access to Read, Glob, Grep, Bash, Designbase MCP

**The reviewer must verify — not assume:**
- Run `Grep` and `Read` to confirm every `file:line` citation exists and matches the claim
- Check `mcp__designbase-storybook__get-documentation` for every component named in the component map
- Run `ls` / `find` to confirm file paths in the file plan are plausible given the repo structure

**Blocking finding categories** (return as structured JSON):

| Category | Description | Severity |
|----------|-------------|----------|
| `grounding` | A `file:line` citation doesn't exist or doesn't match the claim | blocking |
| `size` | File plan has >10 files — issue must be split before building | blocking |
| `scope-creep` | Tasks.md steps touch files not listed in the file plan | blocking |
| `logic-change` | An AC or task changes existing validation, payload shape, or required fields without being explicit about it | blocking |
| `missing-ac` | An AC in requirements.md has no corresponding task in tasks.md | blocking |
| `build-readiness` | A task step is not executable as written (missing file path, vague instruction, invented component name) | blocking |
| `design-system` | A component claim uses a deprecated import path or an invented API not confirmed in Designbase MCP | blocking |
| `edge-cases` | requirements.md has fewer than 3 edge cases | blocking |
| `test-coverage` | tasks.md test targets are missing happy path or a named error state from requirements.md | blocking |

**Non-blocking notes:** real issues worth surfacing but not blocking (e.g. a suggestion, a minor inconsistency, a risk worth flagging).

Returns JSON:
```json
{
  "approved": false,
  "summary": "Two grounding errors and a size violation.",
  "blockingFindings": [
    {
      "category": "grounding",
      "location": "design.md: Component Map, TextField row",
      "description": "Claims TextField is at client/src/fe-design-base/TextField.tsx:1 but grep finds no such file.",
      "fix": "Run the Designbase MCP to confirm the correct import path."
    }
  ],
  "nonBlockingNotes": [
    {
      "location": "requirements.md: AC-1.2",
      "note": "The AC says 'the system shall display an error' but doesn't specify whether it's inline or a toast."
    }
  ]
}
```

---

#### Reviser agent (if not approved, subagent_type: general-purpose, model: sonnet)

The reviser receives:
- All three spec files (full content)
- The reviewer's blocking findings (JSON)
- Write access to the three spec files for this issue only

For each blocking finding:
- Read the relevant spec file
- Apply the minimum edit that resolves the finding (do not rewrite unrelated content)
- After all edits, output a one-sentence summary of what was changed for each finding

The reviser must NOT:
- Change ACs or non-goals not mentioned in the findings
- Add scope beyond what the finding requires
- Delete content unless it's directly incorrect

---

### Step 2: Approval or escalation

After each round: re-run the reviewer on the revised spec.

**If approved:** Add `approved: true` to the YAML frontmatter of all three spec files for this issue. Display:
```
✓  <issue-slug>  approved after N round(s)
   Non-blocking notes: N (see below)
```

**If still blocked after 3 rounds:** Display:
```
✗  <issue-slug>  not approved — N blocking finding(s) remain
```
List each remaining finding with its category, location, and fix. The engineer must resolve these manually before running `/spec-builder`.

### Step 3: Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Spec Audit Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✓ Approved:       N issue(s)
  ✗ Needs work:     N issue(s)
  ⚠ Non-blocking:   N note(s) across all specs

  Approved issues are ready to build with /spec-builder.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

List non-blocking notes after the summary (grouped by issue).

Ask (AskUserQuestion):
- **Build the first approved issue** *(Recommended)* — invoke `/spec-builder <first-approved-slug>` immediately.
- **Review approved specs myself first** — stop here; run `/spec-builder <slug>` when ready.
- **Not yet — address remaining blocking findings first** — shown only when issues still need work.

---

## Hard rules

- **Verify, never assume.** The reviewer must run Read/Grep/Bash to confirm every claim — returning a verdict based only on the spec text is not acceptable.
- **Size is always blocking.** >10 files in the file plan is a hard block, no exceptions.
- **Minimum viable edits.** The reviser fixes only what the finding identifies — no opportunistic rewrites.
- **Scope discipline.** The reviewer never adds scope; it only checks whether the spec's scope is clean.
