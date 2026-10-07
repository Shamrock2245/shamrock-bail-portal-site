/**
 * GET the public critical path and require HTTP 200.
 * The homepage must contain the office number 239-332-2245.
 *
 * URLs come from page code and routers, not from guessed slugs.
 * Retired paths that 404 today are intentionally absent:
 *   /portal-start, /get-someone-out, /portal
 *
 * Disable: GitHub → Actions → "Live site uptime" → Disable workflow.
 */
import fs from 'node:fs'

const HOME_PHONE = '239-332-2245'
const TIMEOUT_MS = 20000
const USER_AGENT = 'ShamrockSiteCheck/1.0 (+https://www.shamrockbailbonds.biz)'

const PAGES = [
  {
    name: 'Home',
    url: 'https://www.shamrockbailbonds.biz/',
    source: 'src/pages/HOME.c1dmp.js and seo/sitemap-generator.js',
    requirePhone: true,
  },
  {
    name: 'Contact',
    url: 'https://www.shamrockbailbonds.biz/contact',
    source: 'src/pages/Contact.ilgty.js pageUrl',
  },
  {
    name: 'How bail works',
    url: 'https://www.shamrockbailbonds.biz/how-bail-works',
    source: 'src/pages/How Bail Works.lrh65.js (start buttons open the paperwork launchpad)',
  },
  {
    name: 'Portal landing',
    url: 'https://www.shamrockbailbonds.biz/portal-landing',
    source: 'src/pages/portal-landing.bagfn.js and src/backend/routers.js',
  },
  {
    name: 'Portal defendant',
    url: 'https://www.shamrockbailbonds.biz/portal-defendant',
    source: 'src/pages/portal-defendant.skg9y.js',
  },
  {
    name: 'Portal indemnitor',
    url: 'https://www.shamrockbailbonds.biz/portal-indemnitor',
    source: 'src/pages/portal-indemnitor.k53on.js',
  },
  {
    name: 'Portal staff',
    url: 'https://www.shamrockbailbonds.biz/portal-staff',
    source: 'src/pages/portal-staff.qs9dx.js',
  },
  {
    name: 'Bond start (paperwork launchpad)',
    url: 'https://paperwork.shamrockbailbonds.biz/',
    source: 'src/public/portal-config.js PAPERWORK_APP_URL (replaces retired /portal-start)',
  },
]

async function checkPage(page) {
  const started = Date.now()
  try {
    const response = await fetch(page.url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
      },
    })
    const body = await response.text()
    const ms = Date.now() - started
    const problems = []
    if (response.status !== 200) {
      problems.push(`HTTP ${response.status} (final URL ${response.url})`)
    }
    if (body.length < 500) {
      problems.push(`body is only ${body.length} bytes`)
    }
    if (page.requirePhone && !body.includes(HOME_PHONE)) {
      problems.push(`homepage is missing ${HOME_PHONE}`)
    }
    return { page, ms, status: response.status, finalUrl: response.url, problems }
  } catch (err) {
    return {
      page,
      ms: Date.now() - started,
      status: 0,
      finalUrl: page.url,
      problems: [err.name === 'TimeoutError' ? `timed out after ${TIMEOUT_MS}ms` : err.message],
    }
  }
}

const results = await Promise.all(PAGES.map(checkPage))
const failures = results.filter((result) => result.problems.length > 0)

for (const result of results) {
  const mark = result.problems.length ? 'FAIL' : 'OK'
  console.log(`${mark} ${result.status} ${result.ms}ms ${result.page.url}`)
  for (const problem of result.problems) console.log(`  - ${problem}`)
}

if (failures.length > 0) {
  const lines = [
    'Critical-path check failed for https://www.shamrockbailbonds.biz',
    '',
    ...failures.flatMap((result) => [
      `- ${result.page.name}: ${result.page.url}`,
      `  source: ${result.page.source}`,
      ...result.problems.map((problem) => `  ${problem}`),
    ]),
    '',
    'The office number 239-332-2245 must appear on the homepage.',
  ]
  const report = lines.join('\n')
  fs.writeFileSync('uptime-failure.txt', report)
  console.error(report)
  process.exit(1)
}

console.log(`Critical path OK (${results.length} pages, homepage contains ${HOME_PHONE})`)
