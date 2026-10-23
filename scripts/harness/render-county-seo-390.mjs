/**
 * Render the Lee and Collier About + FAQ blocks at 390px.
 * Before uses main's about join and FAQ merge against the CMS fixtures.
 * After uses src/backend/county-overrides.js.
 */
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const ROOT = process.cwd()
const OUT_DIR = path.join(ROOT, 'docs/seo/screenshots')
const FIXTURES = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/harness/lee-collier-cms-fixtures.json'), 'utf8'))
const GEO = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/backend/data/florida-local-geo.json'), 'utf8'))
const PHONE = '(239) 332-2245'

function sliceFunction(source, name) {
  const start = source.indexOf(`function ${name}(`)
  if (start < 0) throw new Error(`missing ${name}`)
  let i = source.indexOf('{', start)
  let depth = 0
  for (; i < source.length; i += 1) {
    const ch = source[i]
    if (ch === '{') depth += 1
    else if (ch === '}') {
      depth -= 1
      if (depth === 0) return source.slice(start, i + 1)
    }
  }
  throw new Error(`unclosed ${name}`)
}

const generatorSrc = fs.readFileSync(path.join(ROOT, 'src/backend/county-generator.jsw'), 'utf8')
const generatorFns = new Function(
  `${sliceFunction(generatorSrc, 'formatCityList')}\n${sliceFunction(generatorSrc, 'generateFAQs')}\nreturn { formatCityList, generateFAQs };`
)()

function mentionsAddress(text, address) {
  if (!text || !address) return false
  const street = String(address).split(',')[0].trim().split(/\s+/).slice(0, 2).join(' ').toLowerCase()
  return !!street && String(text).toLowerCase().indexOf(street) !== -1
}

function jailBlock(countyName, geo) {
  const sites = (geo.jails || []).filter((site) => site && site.name && site.address)
  if (sites.length < 2) return ''
  const parts = sites.map((site) => `${site.name}, ${site.address}`)
  const joined = parts.length === 2
    ? `${parts[0]}, and ${parts[1]}`
    : `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`
  const word = sites.length === 2 ? 'two' : String(sites.length)
  return `${countyName} County operates ${word} jail sites: ${joined}. Shamrock posts surety bonds for ${countyName} County arrests 24/7. Call ${PHONE} with the inmate name.`
}

function citySentence(countyName, cities) {
  if (!cities.length) return ''
  return `We cover ${countyName} County communities including ${cities.slice(0, 8).join(', ')}.`
}

function beforeAbout(slug, countyName) {
  const fixture = FIXTURES[slug]
  const geo = GEO.counties[slug]
  const base = fixture.serviceAreaCopy
  const jail = jailBlock(countyName, geo)
  const jailText = jail && !mentionsAddress(base, geo.jailAddress) ? jail : ''
  const cities = citySentence(countyName, fixture.majorCities)
  return [base, jailText, cities].filter(Boolean).join(' ')
}

function faqKey(question) {
  return String(question || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function beforeFaqs(slug, countyName) {
  const fixture = FIXTURES[slug]
  const faqs = fixture.faqs.map((item) => ({ ...item }))
  const embedded = generatorFns.generateFAQs(
    countyName,
    fixture.circuitNumber,
    fixture.circuitFull,
    fixture.majorCities,
    fixture.countySeat,
    fixture.phone,
    fixture.bookingUrl
  )
  const seen = new Set(faqs.map((item) => faqKey(item.question)))
  for (const item of embedded) {
    const key = faqKey(item.question)
    if (key && !seen.has(key)) {
      seen.add(key)
      faqs.push({ question: item.question, answer: item.answer })
    }
  }
  return faqs
}

const tmpMod = path.join(os.tmpdir(), `county-overrides-shot-${process.pid}.mjs`)
fs.copyFileSync(path.join(ROOT, 'src/backend/county-overrides.js'), tmpMod)
const overrides = await import(pathToFileURL(tmpMod).href)

function escapeText(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function faqHtml(faqs) {
  return faqs.map((item) => (
    `<article class="faq"><h3>${escapeText(item.question)}</h3><p>${escapeText(item.answer)}</p></article>`
  )).join('')
}

function pageHtml({ title, aboutHtml, faqs }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=390">
<title>${escapeText(title)}</title>
<style>
  html, body { margin: 0; padding: 0; background: #f4f7f5; }
  body { width: 390px; font-family: Georgia, "Times New Roman", serif; color: #1a1a1a; }
  main { padding: 16px 16px 28px; }
  .caption { font-family: Arial, sans-serif; font-size: 12px; letter-spacing: 0.04em; text-transform: uppercase; color: #0b6b3a; margin: 0 0 12px; }
  h2 { font-family: Arial, sans-serif; font-size: 22px; line-height: 1.25; margin: 0 0 10px; color: #143024; }
  h3 { font-family: Arial, sans-serif; font-size: 16px; line-height: 1.35; margin: 0 0 6px; }
  p { font-size: 16px; line-height: 1.45; margin: 0 0 12px; }
  a { color: #0b4f8a; }
  section { background: #fff; border: 1px solid #d7e0da; border-radius: 8px; padding: 14px; margin: 0 0 14px; }
  .faq { border-top: 1px solid #e4ebe6; padding-top: 12px; margin-top: 12px; }
  .faq:first-child { border-top: 0; padding-top: 0; margin-top: 0; }
</style>
</head>
<body>
<main>
  <p class="caption">${escapeText(title)}</p>
  <section>
    <h2>About Bail Bonds</h2>
    ${aboutHtml}
  </section>
  <section>
    <h2>Frequently Asked Questions</h2>
    ${faqHtml(faqs)}
  </section>
</main>
</body>
</html>`
}

function requestJson(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method }, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try { resolve(data ? JSON.parse(data) : {}) } catch (err) {
          reject(new Error(`${method} ${url} -> ${data.slice(0, 180)}`))
        }
      })
    })
    req.on('error', reject)
    req.end()
  })
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function shoot(chromePort, htmlPath, pngPath) {
  const targetUrl = pathToFileURL(htmlPath).href
  const tab = await requestJson(`http://127.0.0.1:${chromePort}/json/new?${encodeURIComponent(targetUrl)}`, 'PUT')
  const ws = new WebSocket(tab.webSocketDebuggerUrl)
  let nextId = 0
  const pending = new Map()
  const waitOpen = new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve)
    ws.addEventListener('error', () => reject(new Error('chrome websocket failed')))
  })
  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data)
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg)
      pending.delete(msg.id)
    }
  })
  await waitOpen
  function send(method, params = {}) {
    const id = ++nextId
    return new Promise((resolve, reject) => {
      pending.set(id, (msg) => {
        if (msg.error) reject(new Error(JSON.stringify(msg.error)))
        else resolve(msg.result)
      })
      ws.send(JSON.stringify({ id, method, params }))
    })
  }
  await send('Page.enable')
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 800,
    deviceScaleFactor: 1,
    mobile: true,
  })
  await send('Page.navigate', { url: targetUrl })
  await sleep(400)
  const heightResult = await send('Runtime.evaluate', {
    expression: 'Math.ceil(document.documentElement.scrollHeight)',
    returnByValue: true,
  })
  const height = heightResult.result.value
  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: 390, height, scale: 1 },
  })
  fs.writeFileSync(pngPath, Buffer.from(shot.data, 'base64'))
  ws.close()
  await requestJson(`http://127.0.0.1:${chromePort}/json/close/${tab.id}`, 'GET').catch(() => {})
  return { pngPath, height }
}

const shots = [
  {
    file: 'before_lee_390',
    title: 'Lee County — before (main page logic + CMS fixture)',
    aboutHtml: `<p>${escapeText(beforeAbout('lee', 'Lee'))}</p>`,
    faqs: beforeFaqs('lee', 'Lee'),
  },
  {
    file: 'after_lee_390',
    title: 'Lee County — after (runtime override)',
    aboutHtml: overrides.renderedOverrideBundle('lee').aboutHtml,
    faqs: overrides.getCountyOverrideFaqs('lee'),
  },
  {
    file: 'before_collier_390',
    title: 'Collier County — before (main page logic + CMS fixture)',
    aboutHtml: `<p>${escapeText(beforeAbout('collier', 'Collier'))}</p>`,
    faqs: beforeFaqs('collier', 'Collier'),
  },
  {
    file: 'after_collier_390',
    title: 'Collier County — after (runtime override)',
    aboutHtml: overrides.renderedOverrideBundle('collier').aboutHtml,
    faqs: overrides.getCountyOverrideFaqs('collier'),
  },
]

fs.mkdirSync(OUT_DIR, { recursive: true })
const htmlDir = path.join(os.tmpdir(), `county-seo-html-${process.pid}`)
fs.mkdirSync(htmlDir, { recursive: true })
for (const shot of shots) {
  fs.writeFileSync(path.join(htmlDir, `${shot.file}.html`), pageHtml(shot))
}

const port = 9333
const userData = path.join(os.tmpdir(), `chrome-county-seo-${process.pid}`)
const chrome = spawn('google-chrome', [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--hide-scrollbars',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userData}`,
  'about:blank',
], { stdio: 'ignore' })

try {
  let ready = false
  for (let i = 0; i < 40; i += 1) {
    try {
      await requestJson(`http://127.0.0.1:${port}/json/version`)
      ready = true
      break
    } catch (err) {
      await sleep(150)
    }
  }
  if (!ready) throw new Error('Chrome did not open a debugging port')
  for (const shot of shots) {
    const htmlPath = path.join(htmlDir, `${shot.file}.html`)
    const pngPath = path.join(OUT_DIR, `${shot.file}.png`)
    const result = await shoot(port, htmlPath, pngPath)
    console.log(`${shot.file}.png ${result.height}px ${fs.statSync(pngPath).size} bytes`)
  }
} finally {
  chrome.kill('SIGKILL')
}
