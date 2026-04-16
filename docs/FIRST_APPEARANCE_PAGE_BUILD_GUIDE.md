# First Appearance Page — Wix Editor Build Guide

**URL Slug:** `/first-appearance`  
**Page Title:** "Florida First Appearance Hearings | County Schedules & Live Streams | Shamrock Bail Bonds"  
**Meta Description:** "What is a First Appearance Hearing in Florida? Learn what happens, what it is NOT, and find live Zoom and stream links for Lee, Hendry, Hillsborough, Orange, Osceola, and all Florida counties."  
**Velo Page Code:** `src/pages/First Appearance.js`

---

## Page Architecture

The page is divided into eight distinct sections. Build them top-to-bottom in the Wix Editor.

---

## Section 1: Hero Banner

**Design:** Full-width dark background (use site's dark navy `#0a1628`). White headline, green subtext.

| Element | Type | ID | Content |
| :--- | :--- | :--- | :--- |
| Headline | Text | — | "Your Loved One Has a Court Date in the Next 24 Hours." |
| Subheadline | Text | — | "Here's what happens at First Appearance — and how to get them home fast." |
| Call CTA | Button | `#heroCallBtn` | "Call 239-332-2245 Now" |
| Online CTA | Button | `#heroOnlineBtn` | "Start the Bail Process Online" |

---

## Section 2: What IS a First Appearance?

**Design:** White background, two-column layout. Left: icon list. Right: timeline graphic.

**Headline:** "What Happens at a First Appearance Hearing?"

**Body Text (static, place directly in Wix text elements):**

> Under Florida Rule of Criminal Procedure 3.130, every arrested person must be brought before a judge within **24 hours** of their arrest. This hearing is called the First Appearance.

**The 5 Things the Judge Does (use an icon list or numbered repeater):**

1. **Informs the defendant of the charges** — The judge reads the specific crimes alleged.
2. **Advises of constitutional rights** — Right to remain silent, right to an attorney.
3. **Determines probable cause** — Reviews the arrest report. If no probable cause exists, the defendant is released immediately.
4. **Sets bail and release conditions** — This is the most important step for families. The judge decides the bond amount and any conditions (GPS monitoring, no-contact orders, etc.).
5. **Appoints counsel** — If the defendant cannot afford a lawyer, a Public Defender is appointed.

---

## Section 3: What a First Appearance is NOT

**Design:** Light grey background `#f3f4f6`. Three "myth-buster" cards in a row.

| Card | Icon | Title | Body |
| :--- | :--- | :--- | :--- |
| 1 | ⚖️ | "Not a Trial" | The judge will not decide guilt or innocence. That comes much later. |
| 2 | 🤐 | "Not the Time to Talk" | Defendants should say as little as possible. Anything said is recorded and can be used against them. |
| 3 | 📋 | "Not an Arraignment" | An arraignment is a separate, later hearing where the defendant enters a formal plea. |

---

## Section 4: How Bail is Determined

**Design:** White background. Left: explanatory text. Right: a simple visual checklist.

**Headline:** "How Does the Judge Decide the Bond Amount?"

**Body Text:**

> When setting bail, Florida judges weigh several factors to ensure the defendant will return for future court dates and does not pose a danger to the community.

**Factors List (use a styled list or repeater):**

- Severity and nature of the charges
- The defendant's criminal history and prior failures to appear
- Ties to the community (family, employment, length of residence in Florida)
- Risk of flight (e.g., out-of-state ties, access to resources)
- Potential danger to the public or specific victims

**CTA Box (green background):**  
"Bond Set? Call Shamrock Bail Bonds Immediately. We only need 10% — the Florida-regulated rate."  
Button: `#heroCallBtn` → "Call 239-332-2245"

---

## Section 5: County Schedule Table (Interactive)

**Design:** White background. Search bar at top, then a Repeater below.

### Search Bar
| Element | Type | ID |
| :--- | :--- | :--- |
| Search input | Text Input | `#countySearchInput` |
| Placeholder | — | "Search by county name..." |

### County Repeater (`#countyRepeater`)

Each card in the repeater should contain:

| Element | Type | ID | Notes |
| :--- | :--- | :--- | :--- |
| County name | Text | `#countyName` | Bold, large |
| Circuit | Text | `#countyCircuit` | Small grey text |
| Schedule | Text | `#countySchedule` | e.g., "10:00 AM — Daily (M–F)" |
| Location | Text | `#countyLocation` | Courthouse name |
| Notes | Text | `#countyNotes` | Zoom ID if applicable |
| Status dot | Box | `#countyStatusDot` | Green = has live stream/Zoom; Grey = in-person/directory only |
| Live button | Button | `#countyLiveBtn` | Dynamically labeled by Velo code |

### FL Courts Directory Button
| Element | Type | ID | Label |
| :--- | :--- | :--- | :--- |
| Directory link | Button | `#flCourtsDirBtn` | "🔍 Search All 67 Counties on FL Courts Directory" |

---

## Section 6: Interactive Florida Map

**Design:** Embed the Florida Virtual Courtroom Directory map using an HTML Component (iFrame).

**Implementation Options:**

### Option A — Wix HTML Component (Recommended)
Add an **HTML Component** (`<iframe>`) pointing to `https://courtrooms.flcourts.gov/`. This gives users the live, interactive map directly on the page.

```html
<iframe
  src="https://courtrooms.flcourts.gov/"
  width="100%"
  height="700"
  frameborder="0"
  title="Florida Virtual Courtroom Directory"
  style="border-radius: 8px; border: 1px solid #e5e7eb;"
  allowfullscreen>
</iframe>
```

**Note:** Add a label above: "Live Florida Courtroom Map — Click any county to find active virtual courtrooms."

### Option B — Static SVG Map with Hotspots
If the iframe does not load reliably, use a static SVG map of Florida with clickable county regions. Each region links to the county's entry in the repeater above (use `wixLocation.scrollTo()` or anchor links).

---

## Section 7: FAQ Accordion (`#faqRepeater`)

**Design:** White background, clean accordion style.

**Headline:** "Frequently Asked Questions About First Appearance"

Each repeater item contains:

| Element | Type | ID |
| :--- | :--- | :--- |
| Question text | Text | `#faqQuestion` |
| Answer text | Text | `#faqAnswer` (hidden by default) |
| Toggle button | Button | `#faqToggleBtn` (shows `+` / `−`) |

The Velo code handles the expand/collapse animation automatically.

---

## Section 8: Bottom CTA

**Design:** Dark navy background, centered. Mirror the hero section.

**Headline:** "Bond Set? We Can Have Your Loved One Home Today."

**Subtext:** "Shamrock Bail Bonds — Available 24/7 across all Florida counties. 10% premium. Payment plans available."

| Element | Type | ID | Label |
| :--- | :--- | :--- | :--- |
| Call button | Button | `#bottomCallBtn` | "Call 239-332-2245" |
| Online button | Button | `#bottomOnlineBtn` | "Start the Process Online" |

---

## SEO Configuration (Wix SEO Settings)

Set these in the Wix Editor → Page Settings → SEO:

| Field | Value |
| :--- | :--- |
| Page Title | `Florida First Appearance Hearings \| County Schedules & Live Streams \| Shamrock Bail Bonds` |
| Meta Description | `What is a First Appearance Hearing in Florida? Learn what happens, what it is NOT, and find live Zoom and stream links for Lee, Hendry, Hillsborough, Orange, Osceola, and all Florida counties.` |
| URL Slug | `first-appearance` |
| Open Graph Image | Use a clean courtroom image or the Shamrock logo on dark background |

The Velo code automatically injects `FAQPage`, `BreadcrumbList`, and `Event` structured data schemas.

---

## County Data Summary

| County | Circuit | Schedule | Access |
| :--- | :--- | :--- | :--- |
| Lee | 20th | 10:00 AM Daily | FL Courts Virtual Directory |
| Hendry | 20th | Varies | Zoom: 943 2964 9927 / PW: 550315 |
| Charlotte | 20th | Daily (M–F) | FL Courts Virtual Directory |
| Collier | 20th | Daily (M–F) | FL Courts Virtual Directory |
| Hillsborough | 13th | 1:30 PM (M–F) | Mostly in-person, Courtroom 17 |
| Orange | 9th | Varies | 9th Circuit live stream |
| Osceola | 9th | Varies | 9th Circuit live stream |
| Pinellas | 6th | Varies | FL Courts Virtual Directory |
| Sarasota | 12th | Varies | FL Courts Virtual Directory |
| Manatee | 12th | Varies | FL Courts Virtual Directory |
| DeSoto | 12th | Varies | FL Courts Virtual Directory |
| Palm Beach | 15th | Varies | FL Courts Virtual Directory |
| Seminole | 18th | Varies | FL Courts Virtual Directory |
| Polk | 10th | Varies | FL Courts Virtual Directory |

**Key Links:**
- FL Courts Virtual Courtroom Directory: https://courtrooms.flcourts.gov/
- Hendry County Zoom: https://zoom.us/j/94329649927?pwd=l5J4yPuaqHacJ1lQoe3GaJK9TTpA7a.1
- 9th Circuit (Orange/Osceola) Live: https://ninthcircuit.org/communication-outreach/initial-appearances-live
- Lee County Schedule: https://www.ca.cjis20.org/About-The-Court/Court-Schedules/leeschedules.aspx
- Hendry County Schedule: https://www.ca.cjis20.org/About-The-Court/Court-Schedules/hendryschedules.aspx
- Hillsborough Schedule: https://www.fljud13.org/JudicialDirectory/MurphyJLogan/ProceduresPreferences.aspx
