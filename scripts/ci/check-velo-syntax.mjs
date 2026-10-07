/**
 * Syntax-check Wix Velo page and backend code with `node --check`.
 *
 * .js and .jsw files use ESM import/export. Node rejects `.jsw`, so each
 * file is copied to a temporary `.mjs` and checked there. This does not
 * execute the code and does not install dependencies.
 *
 * Disable: GitHub → Actions → "PR CI" → Disable workflow.
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const ROOT = process.cwd()
const SRC = path.join(ROOT, 'src')
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'velo-syntax-'))

function walk(dir, out) {
  if (!fs.existsSync(dir)) return
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules') continue
      walk(full, out)
    } else if (ent.name.endsWith('.js') || ent.name.endsWith('.jsw')) {
      out.push(full)
    }
  }
}

const files = []
walk(SRC, files)
files.sort()

if (files.length === 0) {
  console.error('No Velo files found under src/')
  process.exit(1)
}

let failed = 0
for (const file of files) {
  const dest = path.join(tmpDir, 'check.mjs')
  fs.copyFileSync(file, dest)
  const result = spawnSync(process.execPath, ['--check', dest], { encoding: 'utf8' })
  if (result.status !== 0) {
    failed += 1
    const rel = path.relative(ROOT, file)
    const err = `${result.stderr || result.stdout || 'syntax check failed'}`.replaceAll(dest, rel)
    console.error(`::error file=${rel}::Velo syntax check failed`)
    console.error(`${rel}\n${err.trim()}\n`)
  }
}

fs.rmSync(tmpDir, { recursive: true, force: true })

if (failed > 0) {
  console.error(`${failed} of ${files.length} Velo files failed node --check`)
  process.exit(1)
}

console.log(`node --check passed for ${files.length} Velo files under src/`)
