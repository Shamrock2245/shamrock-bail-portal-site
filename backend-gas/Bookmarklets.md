# Booking Form Bookmarklets - All Counties

## Overview

These bookmarklets extract arrest data from county websites and populate the Shamrock Bail Bonds booking form automatically. Click the bookmarklet while viewing an arrest detail page to instantly open a pre-filled form.

**Canonical GAS factory (source of truth):** see repo-root [`.gas-config.json`](../.gas-config.json). County bookmarklets below already use that deployment ID — do **not** mint a new deployment or re-point these URLs without Brendan.

### Runtime secrets policy

- Runtime / Wix / Netlify secrets that reference the GAS web app **must match** `.gas-config.json` only.
- Do **not** rotate GAS deployment IDs, web app URLs, or related secrets without Brendan approval.
- Canonical factory deployment ID: `AKfycbyCIDPzA_EA1B1SGsfhYiXRGKM8z61EgACZdDPILT_MjjXee0wSDEI0RRYthE0CvP-Z`
- Canonical factory URL: `https://script.google.com/macros/s/AKfycbyCIDPzA_EA1B1SGsfhYiXRGKM8z61EgACZdDPILT_MjjXee0wSDEI0RRYthE0CvP-Z/exec`
- School uses a **separate** deployment (documented in `.gas-config.json` as `schoolDeploymentId`) — leave it alone.

---

## ⛔ RETIRED — Universal AI Bookmarklet

**Status: RETIRED / REMOVED (deployments 404).** Do not install or use.

| Variant | Historical dead deployment ID (do not revive) |
|---|---|
| Universal AI (“Shamrock AI Import”) | `AKfycbybvb6EpI6Aop5RSDvweHceD1LQpjMoomEHro5zH9fNbR_-OVCqISX5lTa4lMuNR6EXYw` |
| UniversalBookmarklet_Minified | `AKfycbxdKuWmcBo7Cu0RXsBgongINERqFoPE8CmfcdxtLdnJoM3SxuqBHGJY-pIrMbRi72_rnQ` |

Staff should use the **county/canonical bookmarklets** in this file only (they already point at the canonical factory ID). Do **not** re-point these dead Universal variants at the factory ID — that would be a forbidden GAS URL change in retired bookmarklets.

---

## County Site-Specific Bookmarklets

*(Preferred path — use these.)*

---

## 1. Lee County Bookmarklet

**Website**: https://www.sheriffleefl.org/  
**Proven**: ✅ Already working

```javascript
javascript:(function(){
  const formUrl = 'https://script.google.com/macros/s/AKfycbyCIDPzA_EA1B1SGsfhYiXRGKM8z61EgACZdDPILT_MjjXee0wSDEI0RRYthE0CvP-Z/exec';
  
  // Extract data from Lee County booking page
  const bookingNumber = document.querySelector('.booking-number, [class*="booking"], [id*="booking"]')?.textContent?.trim() || '';
  const fullName = document.querySelector('.inmate-name, [class*="name"], h1, h2')?.textContent?.trim() || '';
  const dob = document.querySelector('[class*="dob"], [class*="birth"]')?.textContent?.replace(/.*?(\d{1,2}\/\d{1,2}\/\d{4}).*/, '$1') || '';
  const sex = document.querySelector('[class*="sex"], [class*="gender"]')?.textContent?.trim() || '';
  const race = document.querySelector('[class*="race"]')?.textContent?.trim() || '';
  const charges = document.querySelector('[class*="charge"], [class*="offense"]')?.textContent?.trim() || '';
  const bondAmount = document.querySelector('[class*="bond"]')?.textContent?.replace(/[^$\d,.]/g, '') || '';
  const bookingDate = document.querySelector('[class*="booking-date"]')?.textContent?.replace(/.*?(\d{1,2}\/\d{1,2}\/\d{4}).*/, '$1') || '';
  const address = document.querySelector('[class*="address"]')?.textContent?.trim() || '';
  
  // Parse name
  const nameParts = fullName.split(',').map(s => s.trim());
  const lastName = nameParts[0] || '';
  const firstName = nameParts[1]?.split(' ')[0] || '';
  
  // Build URL with parameters
  const params = new URLSearchParams({
    bookingNumber,
    firstName,
    lastName,
    dob,
    sex,
    race,
    charges,
    bondAmount,
    bookingDate,
    address
  });
  
  // Open form in new window
  window.open(`${formUrl}?${params.toString()}`, 'BookingForm', 'width=900,height=700,scrollbars=yes');
})();
```

---

## 2. Collier County Bookmarklet

**Website**: https://www.collierso.com/

```javascript
javascript:(function(){
  const formUrl = 'https://script.google.com/macros/s/AKfycbyCIDPzA_EA1B1SGsfhYiXRGKM8z61EgACZdDPILT_MjjXee0wSDEI0RRYthE0CvP-Z/exec';
  
  // Extract data from Collier County booking page
  const bookingNumber = document.querySelector('[class*="booking"], [id*="booking"]')?.textContent?.trim() || '';
  const fullName = document.querySelector('[class*="name"], h1, h2')?.textContent?.trim() || '';
  const dob = document.querySelector('[class*="dob"], [class*="birth"]')?.textContent?.replace(/.*?(\d{1,2}\/\d{1,2}\/\d{4}).*/, '$1') || '';
  const sex = document.querySelector('[class*="sex"]')?.textContent?.trim() || '';
  const race = document.querySelector('[class*="race"]')?.textContent?.trim() || '';
  const charges = document.querySelector('[class*="charge"]')?.textContent?.trim() || '';
  const bondAmount = document.querySelector('[class*="bond"]')?.textContent?.replace(/[^$\d,.]/g, '') || '';
  const bookingDate = document.querySelector('[class*="booking-date"]')?.textContent?.replace(/.*?(\d{1,2}\/\d{1,2}\/\d{4}).*/, '$1') || '';
  
  // Parse name
  const nameParts = fullName.split(',').map(s => s.trim());
  const lastName = nameParts[0] || '';
  const firstName = nameParts[1]?.split(' ')[0] || '';
  
  const params = new URLSearchParams({
    bookingNumber,
    firstName,
    lastName,
    dob,
    sex,
    race,
    charges,
    bondAmount,
    bookingDate
  });
  
  window.open(`${formUrl}?${params.toString()}`, 'BookingForm', 'width=900,height=700,scrollbars=yes');
})();
```

---

## 3. Hendry County Bookmarklet

**Website**: https://www.hendrysheriff.org/inmateSearch

```javascript
javascript:(function(){
  const formUrl = 'https://script.google.com/macros/s/AKfycbyCIDPzA_EA1B1SGsfhYiXRGKM8z61EgACZdDPILT_MjjXee0wSDEI0RRYthE0CvP-Z/exec';
  
  // Extract data from Hendry County inmate detail page
  const bookingNumber = document.querySelector('.inmate-id, [class*="id"]')?.textContent?.trim() || '';
  const fullName = document.querySelector('.inmate-name, h2')?.textContent?.trim() || '';
  const dob = document.querySelector('[class*="dob"]')?.textContent?.replace(/.*?(\d{1,2}\/\d{1,2}\/\d{4}).*/, '$1') || '';
  const sex = document.querySelector('[class*="sex"]')?.textContent?.trim() || '';
  const race = document.querySelector('[class*="race"]')?.textContent?.trim() || '';
  const bookingDate = document.querySelector('[class*="booking-date"]')?.textContent?.replace(/.*?(\d{1,2}\/\d{1,2}\/\d{4}).*/, '$1') || '';
  const address = document.querySelector('[class*="address"]')?.textContent?.trim() || '';
  
  // Extract charges (may be in a list)
  const chargeElements = document.querySelectorAll('[class*="charge"], [class*="offense"]');
  const charges = Array.from(chargeElements).map(el => el.textContent?.trim()).join('; ') || '';
  
  // Extract bond amount
  const bondAmount = document.querySelector('[class*="bond"]')?.textContent?.replace(/[^$\d,.]/g, '') || '';
  
  // Parse name
  const nameParts = fullName.split(',').map(s => s.trim());
  const lastName = nameParts[0] || '';
  const firstName = nameParts[1]?.split(' ')[0] || '';
  
  const params = new URLSearchParams({
    bookingNumber,
    firstName,
    lastName,
    dob,
    sex,
    race,
    charges,
    bondAmount,
    bookingDate,
    address
  });
  
  window.open(`${formUrl}?${params.toString()}`, 'BookingForm', 'width=900,height=700,scrollbars=yes');
})();
```

---

## 4. Charlotte County Bookmarklet (Revize)

**Website**: https://inmates.charlottecountyfl.revize.com/bookings

```javascript
javascript:(function(){
  const formUrl = 'https://script.google.com/macros/s/AKfycbyCIDPzA_EA1B1SGsfhYiXRGKM8z61EgACZdDPILT_MjjXee0wSDEI0RRYthE0CvP-Z/exec';
  
  // Extract data from Charlotte County Revize booking page
  const bookingNumber = document.querySelector('td:contains("Booking Number") + td, [class*="booking"]')?.textContent?.trim() || '';
  const fullName = document.querySelector('h1, h2, [class*="name"]')?.textContent?.trim() || '';
  const dob = document.querySelector('td:contains("DOB") + td, [class*="dob"]')?.textContent?.replace(/.*?(\d{1,2}\/\d{1,2}\/\d{4}).*/, '$1') || '';
  const sex = document.querySelector('td:contains("Sex") + td, [class*="sex"]')?.textContent?.trim() || '';
  const race = document.querySelector('td:contains("Race") + td, [class*="race"]')?.textContent?.trim() || '';
  const bookingDate = document.querySelector('td:contains("Booking Date") + td')?.textContent?.replace(/.*?(\d{1,2}\/\d{1,2}\/\d{4}).*/, '$1') || '';
  
  // Extract charges from table
  const chargeRows = document.querySelectorAll('table tr');
  let charges = '';
  let bondAmount = '';
  
  chargeRows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 2) {
      const charge = cells[0]?.textContent?.trim();
      const bond = cells[1]?.textContent?.trim();
      if (charge && charge.length > 3) {
        charges += (charges ? '; ' : '') + charge;
        if (bond && bond.includes('$')) {
          bondAmount = bond.replace(/[^$\d,.]/g, '');
        }
      }
    }
  });
  
  // Parse name
  const nameParts = fullName.split(',').map(s => s.trim());
  const lastName = nameParts[0] || '';
  const firstName = nameParts[1]?.split(' ')[0] || '';
  
  const params = new URLSearchParams({
    bookingNumber,
    firstName,
    lastName,
    dob,
    sex,
    race,
    charges,
    bondAmount,
    bookingDate
  });
  
  window.open(`${formUrl}?${params.toString()}`, 'BookingForm', 'width=900,height=700,scrollbars=yes');
})();
```

---

## 5. Manatee County Bookmarklet (Revize)

**Website**: https://manatee-sheriff.revize.com/bookings

```javascript
javascript:(function(){
  const formUrl = 'https://script.google.com/macros/s/AKfycbyCIDPzA_EA1B1SGsfhYiXRGKM8z61EgACZdDPILT_MjjXee0wSDEI0RRYthE0CvP-Z/exec';
  
  // Extract data from Manatee County Revize booking page (same structure as Charlotte)
  const bookingNumber = document.querySelector('td:contains("Booking Number") + td, [class*="booking"]')?.textContent?.trim() || '';
  const fullName = document.querySelector('h1, h2, [class*="name"]')?.textContent?.trim() || '';
  const dob = document.querySelector('td:contains("DOB") + td, [class*="dob"]')?.textContent?.replace(/.*?(\d{1,2}\/\d{1,2}\/\d{4}).*/, '$1') || '';
  const sex = document.querySelector('td:contains("Sex") + td, [class*="sex"]')?.textContent?.trim() || '';
  const race = document.querySelector('td:contains("Race") + td, [class*="race"]')?.textContent?.trim() || '';
  const bookingDate = document.querySelector('td:contains("Booking Date") + td')?.textContent?.replace(/.*?(\d{1,2}\/\d{1,2}\/\d{4}).*/, '$1') || '';
  
  // Extract charges
  const chargeRows = document.querySelectorAll('table tr');
  let charges = '';
  let bondAmount = '';
  
  chargeRows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 2) {
      const charge = cells[0]?.textContent?.trim();
      const bond = cells[1]?.textContent?.trim();
      if (charge && charge.length > 3) {
        charges += (charges ? '; ' : '') + charge;
        if (bond && bond.includes('$')) {
          bondAmount = bond.replace(/[^$\d,.]/g, '');
        }
      }
    }
  });
  
  // Parse name
  const nameParts = fullName.split(',').map(s => s.trim());
  const lastName = nameParts[0] || '';
  const firstName = nameParts[1]?.split(' ')[0] || '';
  
  const params = new URLSearchParams({
    bookingNumber,
    firstName,
    lastName,
    dob,
    sex,
    race,
    charges,
    bondAmount,
    bookingDate
  });
  
  window.open(`${formUrl}?${params.toString()}`, 'BookingForm', 'width=900,height=700,scrollbars=yes');
})();
```

---

## 6. Sarasota County Bookmarklet (Revize iframe)

**Website**: https://cms.revize.com/revize/apps/sarasota/index.php

```javascript
javascript:(function(){
  const formUrl = 'https://script.google.com/macros/s/AKfycbyCIDPzA_EA1B1SGsfhYiXRGKM8z61EgACZdDPILT_MjjXee0wSDEI0RRYthE0CvP-Z/exec';
  
  // Extract data from Sarasota County Revize page (same structure as Charlotte/Manatee)
  const bookingNumber = document.querySelector('td:contains("Booking Number") + td, [class*="booking"]')?.textContent?.trim() || '';
  const fullName = document.querySelector('h1, h2, [class*="name"]')?.textContent?.trim() || '';
  const dob = document.querySelector('td:contains("DOB") + td, [class*="dob"]')?.textContent?.replace(/.*?(\d{1,2}\/\d{1,2}\/\d{4}).*/, '$1') || '';
  const sex = document.querySelector('td:contains("Sex") + td, [class*="sex"]')?.textContent?.trim() || '';
  const race = document.querySelector('td:contains("Race") + td, [class*="race"]')?.textContent?.trim() || '';
  const arrestDate = document.querySelector('td:contains("Arrest Date") + td')?.textContent?.replace(/.*?(\d{1,2}\/\d{1,2}\/\d{4}).*/, '$1') || '';
  
  // Extract charges
  const chargeRows = document.querySelectorAll('table tr');
  let charges = '';
  let bondAmount = '';
  
  chargeRows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 2) {
      const charge = cells[0]?.textContent?.trim();
      const bond = cells[1]?.textContent?.trim();
      if (charge && charge.length > 3) {
        charges += (charges ? '; ' : '') + charge;
        if (bond && bond.includes('$')) {
          bondAmount = bond.replace(/[^$\d,.]/g, '');
        }
      }
    }
  });
  
  // Parse name
  const nameParts = fullName.split(',').map(s => s.trim());
  const lastName = nameParts[0] || '';
  const firstName = nameParts[1]?.split(' ')[0] || '';
  
  const params = new URLSearchParams({
    bookingNumber,
    firstName,
    lastName,
    dob,
    sex,
    race,
    charges,
    bondAmount,
    arrestDate
  });
  
  window.open(`${formUrl}?${params.toString()}`, 'BookingForm', 'width=900,height=700,scrollbars=yes');
})();
```

---

## 7. Hillsborough County Bookmarklet (HCSO)

**Website**: https://webapps.hcso.tampa.fl.us/arrestinquiry

```javascript
javascript:(function(){
  const formUrl = 'https://script.google.com/macros/s/AKfycbyCIDPzA_EA1B1SGsfhYiXRGKM8z61EgACZdDPILT_MjjXee0wSDEI0RRYthE0CvP-Z/exec';
  
  // Extract data from Hillsborough County arrest inquiry page
  const bookingNumber = document.querySelector('[class*="booking"], [id*="booking"]')?.textContent?.trim() || '';
  const fullName = document.querySelector('[class*="name"], h2, h3')?.textContent?.trim() || '';
  const dob = document.querySelector('[class*="dob"], [class*="birth"]')?.textContent?.replace(/.*?(\d{1,2}\/\d{1,2}\/\d{4}).*/, '$1') || '';
  const sex = document.querySelector('[class*="sex"]')?.textContent?.trim() || '';
  const race = document.querySelector('[class*="race"]')?.textContent?.trim() || '';
  const bookingDate = document.querySelector('[class*="booking-date"]')?.textContent?.replace(/.*?(\d{1,2}\/\d{1,2}\/\d{4}).*/, '$1') || '';
  const charges = document.querySelector('[class*="charge"], [class*="offense"]')?.textContent?.trim() || '';
  const bondAmount = document.querySelector('[class*="bond"]')?.textContent?.replace(/[^$\d,.]/g, '') || '';
  
  // Parse name
  const nameParts = fullName.split(',').map(s => s.trim());
  const lastName = nameParts[0] || '';
  const firstName = nameParts[1]?.split(' ')[0] || '';
  
  const params = new URLSearchParams({
    bookingNumber,
    firstName,
    lastName,
    dob,
    sex,
    race,
    charges,
    bondAmount,
    bookingDate
  });
  
  window.open(`${formUrl}?${params.toString()}`, 'BookingForm', 'width=900,height=700,scrollbars=yes');
})();
```

---

## Testing & Troubleshooting

### Testing a Bookmarklet

1. Navigate to an arrest detail page
2. Open browser console (F12)
3. Paste the bookmarklet code (without `javascript:` prefix)
4. Press Enter
5. Check if form opens with data

### Common Issues

**Issue**: Bookmarklet doesn't work  
**Solution**: Check browser console for errors, verify selectors match page structure

**Issue**: No data extracted  
**Solution**: Inspect page HTML, update CSS selectors to match actual structure

**Issue**: Form doesn't open  
**Solution**: Verify deployment ID is correct, check if web app is deployed as "Anyone"

### Updating Selectors

If a county website changes its structure:

1. Right-click on the data element → "Inspect"
2. Note the class name or ID
3. Update the `querySelector()` in the bookmarklet
4. Test again

---

## Deployment ID (canonical — do not mint)

Source of truth: repo-root [`.gas-config.json`](../.gas-config.json).

**Canonical factory URL:**
```
https://script.google.com/macros/s/AKfycbyCIDPzA_EA1B1SGsfhYiXRGKM8z61EgACZdDPILT_MjjXee0wSDEI0RRYthE0CvP-Z/exec
```

**Canonical factory deployment ID:**
```
AKfycbyCIDPzA_EA1B1SGsfhYiXRGKM8z61EgACZdDPILT_MjjXee0wSDEI0RRYthE0CvP-Z
```

Do **not** create a "New deployment" for bookmarklets. County bookmarklets above already use this ID. If a surface mismatches `.gas-config.json`, document it and escalate to Brendan — do not rotate secrets or re-point dead Universal IDs.

---

## Browser Compatibility

✅ **Chrome** - Fully supported  
✅ **Firefox** - Fully supported  
✅ **Edge** - Fully supported  
✅ **Safari** - Fully supported  
⚠️ **Mobile browsers** - Limited support (use menu button instead)

---

## Security Notes

- Bookmarklets run in the context of the current page
- They only extract visible data (no authentication bypass)
- Data is sent via URL parameters (visible in browser history)
- For sensitive data, use HTTPS and clear browser history regularly
- The web app should validate all input data

---

## Next Steps

1. Install **county** bookmarklets from this file (canonical factory ID already embedded)
2. Do **not** install retired Universal AI / UniversalBookmarklet_Minified variants
3. Test with each county
4. Train staff on dual workflow (county bookmarklet + menu button)
