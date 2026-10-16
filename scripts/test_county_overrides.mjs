/**
 * Lee and Collier county-page overrides stay on those two slugs.
 * Rendered copy must not carry release-time, speed, or the retired DID.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = process.cwd()
const tmp = path.join(os.tmpdir(), `county-overrides-${process.pid}.mjs`)
fs.copyFileSync(path.join(ROOT, 'src/backend/county-overrides.js'), tmp)
const mod = await import(pathToFileURL(tmp).href)

const {
  applyCountyContentOverride,
  getCountyOverrideFaqs,
  buildFaqPageSchema,
  isHttpUrl,
  hasCountyOverride,
  normalizeCountySlug,
  renderedOverrideBundle,
  findDisallowedSpeedClaims,
  SPANISH_LINE_LABEL,
  HOURS_LINE,
  TRANSFER_LINE,
  FAQ_CAP,
  COUNTY_HUB_URL,
} = mod

const failures = []
function assert(cond, message) {
  if (!cond) failures.push(message)
}

const PHONE_NEEDLES = ['955-0301', '9550301', '2399550301', '12399550301']

function assertClean(label, text) {
  const hits = findDisallowedSpeedClaims(text)
  if (hits.length) failures.push(`${label} speed claims: ${hits.join(', ')}`)
  for (const needle of PHONE_NEEDLES) {
    if (String(text).includes(needle)) failures.push(`${label} contains ${needle}`)
  }
}

assert(SPANISH_LINE_LABEL === 'Se habla español / 24/7 line: (727) 295-2245', 'Spanish label')
assert(HOURS_LINE === 'Office walk-in hours Mon–Fri 9–5 · Phones answered 24/7', 'hours line')
assert(
  TRANSFER_LINE === 'Out-of-state or transfer bonds? We write transfer bonds throughout the US — call (239) 332-2245.',
  'transfer line'
)

const counties = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/backend/data/allFloridaCounties.json'), 'utf8')).counties
const landings = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/backend/data/florida-city-landings.json'), 'utf8')).landings

let overrideSlugs = []
for (const county of counties) {
  const slug = normalizeCountySlug(county.slug || county.name)
  if (hasCountyOverride(slug)) overrideSlugs.push(slug)
  else {
    const sample = {
      county_slug: slug,
      content: { about_html: '<p>cms about</p>', about_county: 'cms about', hero_headline: 'Keep me', faq: [{ question: 'Q', answer: 'within several hours' }] },
      cities: ['Cms City'],
      facts: { major_cities: ['Cms City'] },
    }
    assert(applyCountyContentOverride(sample) === sample, `${slug} must not be copied`)
    assert(getCountyOverrideFaqs(slug) === null, `${slug} must not have FAQ override`)
  }
}
overrideSlugs.sort()
assert(JSON.stringify(overrideSlugs) === JSON.stringify(['collier', 'lee']), `override slugs ${overrideSlugs.join(',')}`)

for (const landing of landings) {
  assert(!hasCountyOverride(landing.slug), `landing ${landing.slug} must not be overridden`)
  const sample = { county_slug: landing.slug, content: { about_county: 'place', hero_headline: 'H' }, cities: [] }
  assert(applyCountyContentOverride(sample) === sample, `landing ${landing.slug} object changed`)
}

for (const slug of ['lee', 'collier']) {
  const before = {
    county_slug: slug,
    content: {
      hero_headline: `${slug} County Bail Bonds: 24/7 Help for Families`,
      about_county: 'CMS service area',
      about_html: '<p>CMS service area</p>',
      service_areas: 'old cities',
      faq: [{ question: 'old', answer: 'within several hours and as quickly as possible' }],
    },
    cities: ['Old'],
    facts: { major_cities: ['Old'] },
    clerk: { website: slug === 'lee' ? 'https://www.leeclerk.org/' : 'https://www.collierclerk.com/' },
  }
  const after = applyCountyContentOverride(before)
  assert(after !== before, `${slug} should be a new object`)
  assert(after.content.hero_headline === before.content.hero_headline, `${slug} H1 changed`)
  assert(after.content.about_html !== before.content.about_html, `${slug} about html unchanged`)
  assert(!after.content.about_html.includes('Ortiz Avenue'), `${slug} still says booked on Ortiz Avenue`)
  assert(after.content.about_html.includes(HOURS_LINE), `${slug} hours line`)
  assert(after.content.about_html.includes(TRANSFER_LINE), `${slug} transfer line`)
  assert(!/<a[^>]+>[^<]*transfer/i.test(after.content.about_html), `${slug} transfer anchor`)
  assert(!/href="[^"]*transfer/i.test(after.content.about_html), `${slug} transfer href`)
  assert(after.content.about_html.includes('href="/florida-bail-bonds-1"'), `${slug} hub link`)
  assert(after.content.about_html.includes('10%') && after.content.about_html.includes('$100 minimum'), `${slug} premium`)
  assert(!/OSI|Palmetto/i.test(after.content.about_html), `${slug} names a carrier`)
  const faqs = getCountyOverrideFaqs(slug)
  assert(faqs && faqs.length > 0 && faqs.length <= FAQ_CAP, `${slug} FAQ cap ${faqs && faqs.length}`)
  assert(JSON.stringify(after.content.faq) === JSON.stringify(faqs), `${slug} content.faq !== rendered faqs`)
  const schema = buildFaqPageSchema(faqs)
  assert(schema && schema['@type'] === 'FAQPage', `${slug} schema type`)
  assert(schema.mainEntity.length === faqs.length, `${slug} schema length`)
  faqs.forEach((item, i) => {
    assert(schema.mainEntity[i].name === item.question, `${slug} schema question ${i}`)
    assert(schema.mainEntity[i].acceptedAnswer.text === item.answer, `${slug} schema answer ${i}`)
  })
  const bundle = renderedOverrideBundle(slug)
  for (const text of bundle.strings) assertClean(`${slug} render`, text)
  assert(bundle.aboutText.includes(TRANSFER_LINE), `${slug} plain transfer line`)
}

const lee = renderedOverrideBundle('lee')
assert(lee.aboutText.includes('Downtown Jail, 2115 Dr Martin Luther King Jr Blvd'), 'Lee downtown address')
assert(lee.aboutText.includes('central intake and booking'), 'Lee booking role')
assert(lee.aboutText.includes('Core, 2501 Ortiz Ave'), 'Lee Core address')
assert(lee.aboutHtml.includes('href="https://www.leeclerk.org/"'), 'Lee clerk link')
assert(lee.cities.includes('Sanibel') && lee.cities.includes('North Fort Myers'), 'Lee cities')
assert(lee.faqs.some((item) => item.question === 'Which jail is my loved one in, in Lee County?'), 'Lee jail FAQ')
assert(lee.faqs.some((item) => item.question === 'Where do I find Lee County court records?'), 'Lee records FAQ')
assert(lee.aboutText.includes('within 24 hours of arrest'), 'Lee Rule 3.130')

const collier = renderedOverrideBundle('collier')
assert(collier.aboutText.includes('3347 Tamiami Trail E, Naples, FL 34112'), 'Collier Naples jail')
assert(collier.aboutText.includes('302 Stockade Rd, Immokalee, FL 34142'), 'Collier Immokalee jail')
assert(collier.aboutText.includes('Everglades City'), 'Everglades City')
assert(!/Everglades(?! City)/.test(collier.aboutText), 'bare Everglades')
assert(collier.aboutHtml.includes('href="https://www.collierclerk.com/"'), 'Collier clerk link')
assert(collier.cities.at(-1) === 'Everglades City', 'Collier city list ends with Everglades City')
assert(collier.faqs.some((item) => /expedite|within 2-8 hours|several hours/i.test(item.answer)) === false, 'Collier speed FAQ')

assert(isHttpUrl('https://www.leeclerk.org/') === true, 'https clerk')
assert(isHttpUrl('http://www.collierclerk.com/') === true, 'http clerk')
assert(isHttpUrl('') === false, 'empty clerk')
assert(isHttpUrl('   ') === false, 'blank clerk')
assert(isHttpUrl('tel:+17272952245') === false, 'tel is not a clerk URL')
assert(isHttpUrl('/florida-bail-bonds-1') === false, 'relative is not a clerk URL')
assert(isHttpUrl('javascript:alert(1)') === false, 'javascript URL')

const page = fs.readFileSync(path.join(ROOT, 'src/pages/Florida Counties.qx7lv.js'), 'utf8')
assert(page.includes('SPANISH_LINE_LABEL'), 'page does not use the Spanish label constant')
assert(!page.includes('Automated line'), 'Automated line label remains')
assert(!page.includes('Under 20 minutes'), 'flagship speed claim remains')
assert(!page.includes('8 AM–6 PM'), 'flagship hours remain')
assert(page.includes('openingHoursSpecification'), 'local business hours block removed')
assert(page.includes('"dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]'), 'hours days were rewritten')
assert(COUNTY_HUB_URL.endsWith('/florida-bail-bonds-1'), 'hub url')

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}
console.log(`county overrides ok (${counties.length} counties, ${landings.length} landings)`)
