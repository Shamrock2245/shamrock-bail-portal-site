/**
 * Fail if the retired Spanish / live-person DID appears anywhere under src/.
 * County pages and the rest of the Velo site use 727-295-2245 for Se habla español.
 * Telephony files outside src/ are out of scope for this check.
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const SRC = path.join(ROOT, 'src')
const NEEDLES = ['955-0301', '9550301', '2399550301', '12399550301']
const TEXT_EXT = new Set(['.js', '.jsw', '.mjs', '.cjs', '.json', '.html', '.htm', '.css', '.md', '.txt', '.xml'])

function walk(dir, out) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules') continue
    const full = path.join(dir, ent.name)
    if (ent.isDirectory()) walk(full, out)
    else if (TEXT_EXT.has(path.extname(ent.name).toLowerCase())) out.push(full)
  }
}

const files = []
walk(SRC, files)
const hits = []
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8')
  for (const needle of NEEDLES) {
    let from = 0
    while (from < text.length) {
      const at = text.indexOf(needle, from)
      if (at === -1) break
      let line = 1
      for (let i = 0; i < at; i += 1) if (text.charCodeAt(i) === 10) line += 1
      hits.push(`${path.relative(ROOT, file)}:${line} contains ${needle}`)
      from = at + needle.length
    }
  }
}

if (hits.length > 0) {
  console.error(`955-0301 must not appear in src/ (${hits.length} hit${hits.length === 1 ? '' : 's'})`)
  for (const hit of hits) console.error(hit)
  process.exit(1)
}

console.log(`no 955-0301 in ${files.length} text files under src/`)
