/**
 * Open/dedupe or close a GitHub issue for a scheduled check.
 *
 *   node scripts/ci/github-issue.mjs open <label>
 *   node scripts/ci/github-issue.mjs close <label>
 *
 * Env: GITHUB_TOKEN, GITHUB_REPOSITORY
 *      ISSUE_TITLE, ISSUE_BODY, ISSUE_BODY_FILE (open only)
 *
 * An open issue with the same label is reused. The body is updated only when
 * the failure text changes, so a check that stays red does not notify every run.
 * Recovery comments and closes every open issue with that label.
 */
import fs from 'node:fs'

const action = process.argv[2]
const label = process.argv[3]
const token = process.env.GITHUB_TOKEN
const repo = process.env.GITHUB_REPOSITORY

const LABEL_META = {
  'site-down': {
    color: 'b60205',
    description: 'Public site critical-path check failed',
  },
  'perf-regression': {
    color: 'fbca04',
    description: 'Homepage Lighthouse budget failed',
  },
}

if (!['open', 'close'].includes(action) || !LABEL_META[label]) {
  console.error('Usage: github-issue.mjs <open|close> <site-down|perf-regression>')
  process.exit(1)
}
if (!token || !repo) {
  console.error('GITHUB_TOKEN and GITHUB_REPOSITORY are required')
  process.exit(1)
}

async function gh(method, pathname, body, allow = []) {
  const response = await fetch(`https://api.github.com${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'shamrock-site-automation',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await response.text()
  let data = null
  if (text) {
    try { data = JSON.parse(text) } catch { data = text }
  }
  if (!response.ok && response.status !== 422 && !allow.includes(response.status)) {
    throw new Error(`${method} ${pathname} -> ${response.status} ${String(text).slice(0, 500)}`)
  }
  return { status: response.status, data }
}

async function ensureLabel() {
  const meta = LABEL_META[label]
  const existing = await gh('GET', `/repos/${repo}/labels/${encodeURIComponent(label)}`, null, [404])
  if (existing.status === 200) return
  await gh('POST', `/repos/${repo}/labels`, {
    name: label,
    color: meta.color,
    description: meta.description,
  })
}

async function openIssues() {
  const listed = await gh(
    'GET',
    `/repos/${repo}/issues?state=open&labels=${encodeURIComponent(label)}&per_page=20`
  )
  const items = Array.isArray(listed.data) ? listed.data : []
  return items.filter((item) => item && !item.pull_request)
}

function failureDetail() {
  const file = process.env.ISSUE_BODY_FILE
  if (file && fs.existsSync(file)) return fs.readFileSync(file, 'utf8').trim()
  return (process.env.ISSUE_BODY || `${label} check failed.`).trim()
}

function runLink() {
  if (!process.env.GITHUB_RUN_ID) return ''
  const server = process.env.GITHUB_SERVER_URL || 'https://github.com'
  return `Run: ${server}/${repo}/actions/runs/${process.env.GITHUB_RUN_ID}`
}

await ensureLabel()
const issues = await openIssues()

if (action === 'open') {
  const detail = failureDetail().slice(0, 55000)
  const body = [detail, runLink()].filter(Boolean).join('\n\n')
  const title = process.env.ISSUE_TITLE || `Automation failure: ${label}`
  if (issues.length === 0) {
    const created = await gh('POST', `/repos/${repo}/issues`, { title, body, labels: [label] })
    if (!created.data || !created.data.number) throw new Error('Issue create did not return a number')
    console.log(`Opened ${label} issue #${created.data.number}`)
  } else {
    const primary = issues[0]
    const existing = primary.body || ''
    if (existing.startsWith(detail)) {
      console.log(`Existing ${label} issue #${primary.number} already describes this failure`)
    } else {
      await gh('PATCH', `/repos/${repo}/issues/${primary.number}`, { body })
      console.log(`Updated existing ${label} issue #${primary.number}`)
    }
  }
} else if (issues.length === 0) {
  console.log(`No open ${label} issue to close`)
} else {
  const note = ['Recovered. The latest run passed.', runLink()].filter(Boolean).join('\n\n')
  for (const issue of issues) {
    await gh('POST', `/repos/${repo}/issues/${issue.number}/comments`, { body: note })
    await gh('PATCH', `/repos/${repo}/issues/${issue.number}`, {
      state: 'closed',
      state_reason: 'completed',
    })
    console.log(`Closed ${label} issue #${issue.number}`)
  }
}
