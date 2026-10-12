/**
 * Parse every tracked-style JSON file so config mistakes fail CI.
 * Skips dependency and VCS directories. Does not install anything.
 *
 * Disable: GitHub → Actions → "PR CI" → Disable workflow.
 */
import fs from 'node:fs'
import path from 'node:path'

import { execSync } from 'node:child_process'

const ROOT = process.cwd()
const SKIP_DIRS = new Set(['.git', 'node_modules', '.netlify', 'venv', '.wix', '__pycache__'])

function walk(dir, out) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(ent.name)) continue
    const full = path.join(dir, ent.name)
    if (ent.isDirectory()) walk(full, out)
    else if (ent.name.endsWith('.json')) out.push(full)
  }
}

let files = []
try {
  const tracked = execSync('git ls-files "*.json"', { encoding: 'utf8' })
  files = tracked.trim().split('\n').filter(Boolean).map(f => path.join(ROOT, f))
} catch {
  walk(ROOT, files)
}
files.sort()

let failed = 0
for (const file of files) {
  const rel = path.relative(ROOT, file)
  let text
  try {
    text = fs.readFileSync(file, 'utf8')
  } catch (err) {
    failed += 1
    console.error(`::error file=${rel}::${err.message}`)
    continue
  }
  if (!text.trim()) {
    failed += 1
    console.error(`::error file=${rel}::JSON file is empty`)
    continue
  }
  try {
    JSON.parse(text)
  } catch (err) {
    failed += 1
    console.error(`::error file=${rel}::${err.message}`)
  }
}

if (failed > 0) {
  console.error(`${failed} JSON file(s) failed to parse`)
  process.exit(1)
}

console.log(`JSON parse passed for ${files.length} files`)
