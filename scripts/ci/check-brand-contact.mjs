/**
 * Fail if source or content files carry the wrong Shamrock contact details.
 *
 * Canonical public NAP:
 *   phones 239-332-2245, 727-295-2245, 239-955-0178
 *   email  admin@shamrockbailbonds.biz
 *   site   https://www.shamrockbailbonds.biz
 *   office 1528 Broadway, Fort Myers, FL
 *
 * Fails on:
 *   - banned domains (built below so this file does not contain them whole)
 *   - the retired street name (Breton + Cir) anywhere, including docs/archive
 *   - a Shamrock DID-prefix phone (239-332, 727-295, 239-955) that is not
 *     canonical and not in the acknowledged operational set
 *
 * docs/archive is historical and is scanned for the retired street name only.
 * Operational numbers that are real Shamrock lines, but not the three
 * public NAP phones, are acknowledged so this check stays green. They are
 * listed in the pull request; a new prefix number still fails.
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
])

const CANONICAL = new Set([
  '2393322245',
  '7272952245',
  '2399550178',
])

/** Real lines already in the product. Not public NAP, not typos. */
const ACKNOWLEDGED = new Set([
  '2399550301', // Spanish line and live-person desk
  '2399550314', // spare DID, marked not NAP in llms-txt-builder.js
  '2397849365', // staff desk
  '2393197008', // staff desk
])

const SHAMROCK_PREFIXES = ['239332', '727295', '239955']

const BANNED_DOMAINS = [
  'shamrockbailbonds.' + 'com',
  'shamrockbail.' + 'com',
  'shamrockbail.' + 'biz',
]

const BRETON = 'Breton' + ' Cir'
const ARCHIVE_PREFIX = `docs${path.sep}archive${path.sep}`
const MAX_BYTES = 2_000_000

const FORMATTED_PHONE = /(?<!\d)(?:\+?1[\s.\-]?)?\(?([2-9]\d{2})\)?[\s.\-]+(\d{3})[\s.\-]+(\d{4})(?!\d)/g
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
  let match
  while ((match = bretonRe.exec(text)) !== null) {
    add(rel, lineNumber(text, match.index), `old office street "${BRETON}"`)
  }

  if (archive) continue

  for (const domain of BANNED_DOMAINS) {
    const domainRe = new RegExp(domain.replace(/\./g, '\\.'), 'gi')
    while ((match = domainRe.exec(text)) !== null) {
      add(rel, lineNumber(text, match.index), `wrong domain ${domain}`)
    }
  }

  const phones = []
  for (const re of [FORMATTED_PHONE, COMPACT_PHONE]) {
    re.lastIndex = 0
    while ((match = re.exec(text)) !== null) {
      const digits = re === FORMATTED_PHONE ? `${match[1]}${match[2]}${match[3]}` : match[1]
      phones.push({ digits, index: match.index })
    }
  }

  for (const phone of phones) {
    if (!SHAMROCK_PREFIXES.some((prefix) => phone.digits.startsWith(prefix))) continue
    if (CANONICAL.has(phone.digits) || ACKNOWLEDGED.has(phone.digits)) continue
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
