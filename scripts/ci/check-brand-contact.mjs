/**
 * Fail if source or content files carry the wrong Shamrock contact details.
 *
 * Canonical public NAP:
 *   phones 239-332-2245, 727-295-2245 (also Se habla español), 239-955-0178
 *   email  admin@shamrockbailbonds.biz
 *   site   https://www.shamrockbailbonds.biz
 *   office 1528 Broadway, Fort Myers, FL
 *
 * Fails on:
 *   - banned domains (built below so this file does not contain them whole)
 *   - the retired street name (Breton + Cir) anywhere, including docs/archive
 *   - the old street number (1520 + Broadway) anywhere, including docs/archive
 *   - a Shamrock DID-prefix phone (239-332, 727-295, 239-955) that is not
 *     canonical and not in the acknowledged operational set
 *
 * docs/archive is historical and is scanned for the retired street name and the old street number only.
 * Operational numbers that are real Shamrock lines, but not the three
 * public NAP phones, are acknowledged so this check stays green. They are
 * listed in the pull request; a new prefix number still fails.
 *
 * The live-person overflow DID is not acknowledged and is not a public number.
 * Se habla español is canonical 727-295-2245. That overflow DID still appears
 * in TELEPHONY_UNTOUCHED (CoS option a: do not edit the parallel ring). The
 * checker does not fail those paths for that DID. Every other path, including
 * src/ and public SEO, fails.
 *
 * Disable: GitHub → Actions → "Brand contact" → Disable workflow.
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const SKIP_DIRS = new Set(['.git', 'node_modules', '.netlify', 'venv', '.wix', '__pycache__'])
const TEXT_EXT = new Set([
  '.js', '.jsw', '.mjs', '.cjs', '.json', '.html', '.htm', '.md',
  '.yml', '.yaml', '.txt', '.css', '.xml', '.py', '.toml',
  // Apps Script (.gs) and retired Apps Script copies (*.js.legacy).
  // HtmlService templates are .html / .htm, including *.embed.html.
  '.gs', '.legacy',
])

const CANONICAL = new Set([
  '2393322245',
  '7272952245',
  '2399550178',
])

/** Real lines already in the product. Not public NAP, not typos.
 *  The live-person overflow DID is intentionally absent. */
const ACKNOWLEDGED = new Set([
  '2399550314', // spare DID, marked not NAP in llms-txt-builder.js
  '2397849365', // staff desk
  '2393197008', // staff desk
])

/** Paths that still implement or document the live-person parallel ring.
 *  Not a phone allowlist. Any other file that contains that DID fails. */
const TELEPHONY_UNTOUCHED = new Set([
  'backend-gas/ElevenLabs_WebhookHandler.js',
  'backend-gas/ElevenLabs_AfterHoursAgent.js',
  'backend-gas/Shannon_PaperworkTools.js',
  'backend-gas/Code.js',
  'scripts/push_shannon_agent.py',
  'scripts/test_shannon_staff_desk.py',
  'scripts/test_tune_workflow.py',
  'OPERATIONS.md',
  'AGENTS.md',
  'docs/shannon-knowledge-base.txt',
])

const OVERFLOW_DID = ['239', '955', '0301'].join('')

const SHAMROCK_PREFIXES = ['239332', '727295', '239955']

const BANNED_DOMAINS = [
  'shamrockbailbonds.' + 'com',
  'shamrockbail.' + 'com',
  'shamrockbail.' + 'biz',
]

const BRETON = 'Breton' + ' Cir'
const OLD_STREET = '1520' + ' Broadway'
const ARCHIVE_PREFIX = `docs${path.sep}archive${path.sep}`
const MAX_BYTES = 2_000_000

// A closing parenthesis alone counts as the area-code separator.
const FORMATTED_PHONE = /(?<!\d)(?:\+?1[\s.\-]?)?\(?([2-9]\d{2})\)?[\s.\-]*(\d{3})[\s.\-]+(\d{4})(?!\d)/g
const COMPACT_PHONE = /(?<!\d)\+?1?([2-9]\d{9})(?!\d)/g

function walk(dir, out) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(ent.name)) continue
    const full = path.join(dir, ent.name)
    if (ent.isDirectory()) walk(full, out)
    else if (TEXT_EXT.has(path.extname(ent.name).toLowerCase())) out.push(full)
  }
}

function lineNumber(text, index) {
  let line = 1
  for (let i = 0; i < index && i < text.length; i += 1) {
    if (text.charCodeAt(i) === 10) line += 1
  }
  return line
}

function phoneMatches(text) {
  const found = []
  for (const re of [FORMATTED_PHONE, COMPACT_PHONE]) {
    re.lastIndex = 0
    let match
    while ((match = re.exec(text)) !== null) {
      const digits = re === FORMATTED_PHONE ? `${match[1]}${match[2]}${match[3]}` : match[1]
      found.push({ digits, index: match.index })
    }
  }
  return found
}

function normalizeRel(rel) {
  return String(rel || '').split(path.sep).join('/')
}

function isFlaggedPhone(digits, rel = '') {
  if (!SHAMROCK_PREFIXES.some((prefix) => digits.startsWith(prefix))) return false
  if (CANONICAL.has(digits) || ACKNOWLEDGED.has(digits)) return false
  if (digits === OVERFLOW_DID && TELEPHONY_UNTOUCHED.has(normalizeRel(rel))) return false
  return true
}

function selfTest() {
  const badDigits = '239332' + '9999'
  const badParen = '(239)' + '332-9999'
  const cases = [
    { name: 'paren with no space', text: badParen, digits: badDigits, flagged: true },
    { name: 'paren with space still flagged', text: '(239) ' + '332-9999', digits: badDigits, flagged: true },
    { name: 'canonical office with space', text: '(239) 332-2245', digits: '2393322245', flagged: false },
    { name: 'canonical office dashed', text: '239-332-2245', digits: '2393322245', flagged: false },
    { name: 'canonical tampa no space', text: '(727)' + '295-2245', digits: '7272952245', flagged: false },
    { name: 'spanish line is 727', text: 'Se habla español: 727-295-2245', digits: '7272952245', flagged: false },
    { name: 'canonical sms no space', text: '(239)' + '955-0178', digits: '2399550178', flagged: false },
    {
      name: 'overflow did flagged on a public page',
      text: '(239) ' + ['955', '0301'].join('-'),
      digits: ['239', '955', '0301'].join(''),
      rel: 'src/pages/HOME.c1dmp.js',
      flagged: true,
    },
    {
      name: 'overflow did left in the gas ring file',
      text: '(239) ' + ['955', '0301'].join('-'),
      digits: ['239', '955', '0301'].join(''),
      rel: 'backend-gas/ElevenLabs_WebhookHandler.js',
      flagged: false,
    },
    { name: 'other 239 prefix', text: '(239)' + '555-1234', digits: '2395551234', flagged: false },
  ]
  const failures = []
  if (ACKNOWLEDGED.has(['239', '955', '0301'].join(''))) {
    failures.push('overflow DID must not be in the allowlist')
  }
  for (const item of cases) {
    const matches = phoneMatches(item.text).filter((phone) => phone.digits === item.digits)
    if (matches.length === 0) failures.push(`${item.name}: did not extract ${item.digits} from ${item.text}`)
    const flagged = matches.some((phone) => isFlaggedPhone(phone.digits, item.rel || 'src/pages/example.js'))
    if (flagged !== item.flagged) {
      failures.push(`${item.name}: flagged=${flagged}, expected ${item.flagged}`)
    }
  }
  const oldStreet = '1520' + ' Broadway'
  if (!new RegExp(OLD_STREET.replace(' ', '\\s+'), 'i').test(oldStreet)) {
    failures.push('old street number was not detected')
  }
  if (new RegExp(OLD_STREET.replace(' ', '\\s+'), 'i').test('1528 Broadway')) {
    failures.push('canonical 1528 Broadway was flagged as the old number')
  }
  if (failures.length > 0) {
    for (const failure of failures) console.error(`self-test: ${failure}`)
    process.exit(1)
  }
  console.log(`Brand contact self-test passed (${cases.length} phone cases)`)
}

selfTest()

const files = []
walk(ROOT, files)
files.sort()

const violations = []
const seen = new Set()

function add(file, line, message) {
  const key = `${file}:${line}:${message}`
  if (seen.has(key)) return
  seen.add(key)
  violations.push({ file, line, message })
}

for (const file of files) {
  const rel = path.relative(ROOT, file)
  const stat = fs.statSync(file)
  if (stat.size > MAX_BYTES) continue
  const text = fs.readFileSync(file, 'utf8')
  if (text.includes('\0')) continue
  const archive = rel.startsWith(ARCHIVE_PREFIX) || rel.startsWith('docs/archive/')

  const bretonRe = new RegExp(BRETON.replace(' ', '\\s+'), 'gi')
  const oldStreetRe = new RegExp(OLD_STREET.replace(' ', '\\s+'), 'gi')
  let match
  while ((match = bretonRe.exec(text)) !== null) {
    add(rel, lineNumber(text, match.index), `old office street "${BRETON}"`)
  }
  while ((match = oldStreetRe.exec(text)) !== null) {
    add(rel, lineNumber(text, match.index), `old office street number "${OLD_STREET}"`)
  }

  if (archive) continue

  for (const domain of BANNED_DOMAINS) {
    const domainRe = new RegExp(domain.replace(/\./g, '\\.'), 'gi')
    while ((match = domainRe.exec(text)) !== null) {
      add(rel, lineNumber(text, match.index), `wrong domain ${domain}`)
    }
  }

  for (const phone of phoneMatches(text)) {
    if (!isFlaggedPhone(phone.digits, rel)) continue
    const pretty = `${phone.digits.slice(0, 3)}-${phone.digits.slice(3, 6)}-${phone.digits.slice(6)}`
    add(rel, lineNumber(text, phone.index), `Shamrock-looking phone ${pretty} is not a canonical number`)
  }
}

if (violations.length > 0) {
  for (const item of violations) {
    console.error(`::error file=${item.file},line=${item.line}::${item.message}`)
  }
  console.error(`${violations.length} brand-contact violation(s)`)
  process.exit(1)
}

console.log(`Brand contact check passed (${files.length} files scanned)`)
