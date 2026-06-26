export const meta = {
  name: 'spec-audit-loop',
  description: 'Adversarial audit/revise loop for issue specs. Runs a principal-engineer reviewer and a reviser per issue until approved or max rounds reached.',
  phases: [
    { title: 'Audit', detail: 'Principal-engineer reviewer verifies every claim against the real target repo' },
    { title: 'Revise', detail: 'Reviser applies fixes to spec files based on blocking findings' },
  ],
}

// NOTE: args are resolved at the call site. process.env is not available in the workflow sandbox.
// SPEC_DIR and REPO are resolved from args with absolute-path fallbacks for direct scriptPath invocation.
const _projectSlug = (args && args.projectSlug) || 'packet-config-add-team'
const _repo = (args && args.repo) || '/Users/fbarbosa/Documents/Homebase1'
const _specDir = (args && args.specDir) || `/Users/fbarbosa/Documents/flor-spec-driven-development/specs/${_projectSlug}`

const SPEC_DIR = _specDir
const REPO = _repo
const MAX_ROUNDS = (args && args.maxRounds) || 2

const VERDICT_SCHEMA = {
  type: 'object',
  required: ['approved', 'summary', 'blockingFindings', 'nonBlockingNotes'],
  properties: {
    approved: { type: 'boolean' },
    summary: { type: 'string' },
    blockingFindings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['category', 'location', 'description', 'fix'],
        properties: {
          category: { type: 'string', enum: ['grounding', 'size', 'scope-creep', 'logic-change', 'missing-ac', 'build-readiness', 'design-system', 'edge-cases', 'test-coverage'] },
          location: { type: 'string' },
          description: { type: 'string' },
          fix: { type: 'string' },
        },
      },
    },
    nonBlockingNotes: {
      type: 'array',
      items: {
        type: 'object',
        required: ['location', 'note'],
        properties: {
          location: { type: 'string' },
          note: { type: 'string' },
        },
      },
    },
  },
}

// Discover which issues to audit
phase('Audit')

let issuesToReview = (args && args.issues) || []

if (issuesToReview.length === 0) {
  log('No issues specified — scanning for unapproved specs...')
  const discovered = await agent(
    `Scan the directory ${SPEC_DIR} for all issue specs that do NOT have "approved: true" in their frontmatter. ` +
    `Look for files matching the pattern */issues/*/requirements.md. ` +
    `For each requirements.md found, read the first 10 lines to check for "approved: true" in the YAML frontmatter. ` +
    `Return an object with a "slugs" array of issue slugs (the directory name containing the spec files) that are NOT yet approved. ` +
    `Return only the slug names, e.g. {"slugs": ["01-child-page-route-shell", "02-contact-info-card"]}.`,
    { label: 'discover-unapproved', schema: { type: 'object', required: ['slugs'], properties: { slugs: { type: 'array', items: { type: 'string' } } } } }
  )
  issuesToReview = (discovered && discovered.slugs) ? discovered.slugs : []
}

if (issuesToReview.length === 0) {
  log('No unapproved specs found. All specs are approved or no specs exist.')
  return { approved: [], notApproved: [], all: [] }
}

log(`Auditing ${issuesToReview.length} spec(s): ${issuesToReview.join(', ')}`)

// Run audit/revise loop per issue in parallel (up to 3 concurrent via pipeline)
const results = await pipeline(
  issuesToReview,

  // Stage 1: determine the milestone path for this issue slug
  async (slug) => {
    const pathResult = await agent(
      `Find the directory containing the spec files for issue slug "${slug}" under ${SPEC_DIR}. ` +
      `Look for a path matching */issues/${slug}/requirements.md. ` +
      `Return a JSON object with a "path" field containing the absolute directory path (without the filename), e.g. {"path": "${SPEC_DIR}/m1-name/issues/${slug}"}`,
      { label: `find-path:${slug}`, schema: { type: 'object', required: ['path'], properties: { path: { type: 'string' } } } }
    )
    return { slug, specPath: pathResult && pathResult.path ? pathResult.path : null }
  },

  // Stage 2: audit/revise loop
  async (item, slug) => {
    const { specPath } = item
    if (!specPath) {
      log(`Could not find spec path for ${slug} — skipping`)
      return { slug, approved: false, rounds: 0, error: 'spec files not found', nonBlockingNotes: [] }
    }

    let round = 0
    let lastVerdict = null

    while (round < MAX_ROUNDS) {
      round++
      log(`Round ${round}/${MAX_ROUNDS}: auditing ${slug}`)

      // Reviewer
      const verdict = await agent(
        `You are a skeptical principal engineer reviewing an issue spec before it is built. ` +
        `Your job is to find every reason this spec would cause a wrong build — not to approve it easily. ` +
        `\n\n` +
        `Spec files (read all three):\n` +
        `  ${specPath}/requirements.md\n` +
        `  ${specPath}/design.md\n` +
        `  ${specPath}/tasks.md\n\n` +
        `Target repo: ${REPO}\n\n` +
        `VERIFICATION RULES — you must actively check, not assume:\n` +
        `1. For every file:line citation in the spec: run Read or Grep to confirm the file exists and the line matches the claim\n` +
        `2. For every component in the component map: check the Designbase MCP or grep the target repo source to confirm the component name and props are real\n` +
        `3. Count the files in the file plan. If > 10, this is a BLOCKING finding (category: "size")\n\n` +
        `BLOCKING FINDING CATEGORIES:\n` +
        `- grounding: file:line doesn't exist or doesn't match\n` +
        `- size: file plan has > 10 files\n` +
        `- scope-creep: tasks touch files not in the file plan\n` +
        `- logic-change: unintended change to validation, payload shape, or required fields\n` +
        `- missing-ac: an AC in requirements has no corresponding task\n` +
        `- build-readiness: a task step is not executable as written\n` +
        `- design-system: deprecated component or invented API\n` +
        `- edge-cases: fewer than 3 edge cases in requirements.md\n` +
        `- test-coverage: test targets missing happy path or a named error state\n\n` +
        `Return a structured verdict. approved=true only if there are zero blocking findings.`,
        { label: `audit:${slug}:r${round}`, phase: 'Audit', schema: VERDICT_SCHEMA, effort: 'high' }
      )

      lastVerdict = verdict

      if (!verdict || verdict.approved) break
      if (round >= MAX_ROUNDS) break

      // Log round summary before revising
      const categories = verdict.blockingFindings.map(f => f.category)
      log(`Round ${round} blocked: ${verdict.summary} | Categories: ${categories.join(', ')}`)

      // Reviser
      log(`Round ${round}/${MAX_ROUNDS}: revising ${slug} (${verdict.blockingFindings.length} blocking finding(s))`)

      phase('Revise')

      await agent(
        `You are a spec reviser. Apply the minimum edits needed to fix each blocking finding. ` +
        `Do not rewrite content unrelated to the findings.\n\n` +
        `Spec files to edit:\n` +
        `  ${specPath}/requirements.md\n` +
        `  ${specPath}/design.md\n` +
        `  ${specPath}/tasks.md\n\n` +
        `Blocking findings to fix:\n${JSON.stringify(verdict.blockingFindings, null, 2)}\n\n` +
        `For each finding: read the relevant file, apply the smallest change that fixes it, move on. ` +
        `After fixing all findings, output a one-sentence summary of what was changed for each finding ID.`,
        { label: `revise:${slug}:r${round}`, phase: 'Revise' }
      )

      phase('Audit')
    }

    const approved = lastVerdict && lastVerdict.approved
    const nonBlockingNotes = (lastVerdict && lastVerdict.nonBlockingNotes) || []

    // If approved, add approved: true to frontmatter
    if (approved) {
      await agent(
        `Add "approved: true" to the YAML frontmatter of all three spec files for issue "${slug}". ` +
        `Files:\n` +
        `  ${specPath}/requirements.md\n` +
        `  ${specPath}/design.md\n` +
        `  ${specPath}/tasks.md\n\n` +
        `For each file: read it, find the opening "---" frontmatter block, add "approved: true" as a new line before the closing "---". ` +
        `If "approved: false" already exists, replace it with "approved: true".`,
        { label: `approve:${slug}`, phase: 'Audit' }
      )
      log(`✓ ${slug} approved after ${round} round(s)`)
    } else {
      const remaining = lastVerdict ? lastVerdict.blockingFindings : []
      const remainingCategories = remaining.map(f => f.category).join(', ')
      log(`✗ ${slug} not approved after ${round} round(s) — ${remaining.length} blocking finding(s) remain: ${remainingCategories}`)
    }

    return {
      slug,
      approved,
      rounds: round,
      blockingFindings: approved ? [] : (lastVerdict ? lastVerdict.blockingFindings : []),
      nonBlockingNotes,
      summary: lastVerdict ? lastVerdict.summary : 'Audit failed',
    }
  }
)

const filtered = results.filter(Boolean)
const approved = filtered.filter(r => r.approved)
const notApproved = filtered.filter(r => !r.approved)

log(`\nSpec audit complete: ${approved.length} approved, ${notApproved.length} need work`)

return {
  approved: approved.map(r => r.slug),
  notApproved: notApproved.map(r => ({ slug: r.slug, rounds: r.rounds, blockingFindings: r.blockingFindings })),
  all: filtered,
}
