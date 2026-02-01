# Booking Form Bookmarklets - All Counties

## Overview

These bookmarklets extract arrest data from county websites and populate the Shamrock Bail Bonds booking form automatically. Click the bookmarklet while viewing an arrest detail page to instantly open a pre-filled form.

**Important**: Replace `AKfycbxdKuWmcBo7Cu0RXsBgongINERqFoPE8CmfcdxtLdnJoM3SxuqBHGJY-pIrMbRi72_rnQ` with your actual Apps Script web app deployment ID.


---

## 🚀 Universal AI Bookmarklet (Recommended)

This single bookmarklet works on **ANY** Sheriff's website or arrest page. It sends the URL to the Shamrock Portal, where "The Clerk" AI Agent will automatically parse it.

**Why use this?**
- Works on every county (Lee, Collier, Charlotte, etc.)
- No need to install different buttons for every county.
- Uses Gemini AI for smarter extraction.

### Installation
1. Create a new bookmark named **"Shamrock AI Import"**.
2. Paste the code below as the URL.
3. Replace `YOUR_DEPLOYMENT_ID` with your actual ID.

```javascript
javascript:(function(){
  const deploymentId = 'AKfycbybvb6EpI6Aop5RSDvweHceD1LQpjMoomEHro5zH9fNbR_-OVCqISX5lTa4lMuNR6EXYw'; // UPDATE THIS IF DEPLOYMENT CHANGES
  const portalUrl = `https://script.google.com/macros/s/${deploymentId}/exec`;
  window.open(`${portalUrl}?agent=clerk&url=${encodeURIComponent(window.location.href)}`, 'ShamrockPortal');
})();
```

---

## Legacy Site-Specific Bookmarklets
*(Use these only if the Universal one fails)*

---


1. **Get your deployment ID:**
   - Open Apps Script project
   - Click "Deploy" → "New deployment"
   - Select "Web app"
   - Set access to "Anyone"
   - Copy the deployment URL
   - Extract the ID from the URL (between `/s/` and `/exec`)

2. **Create bookmarklets:**
   - Create a new bookmark in your browser
   - Name it (e.g., "Lee County → Booking Form")
   - Paste the JavaScript code into the URL field
   - Replace `AKfycbxdKuWmcBo7Cu0RXsBgongINERqFoPE8CmfcdxtLdnJoM3SxuqBHGJY-pIrMbRi72_rnQ` with your actual ID

3. **Use bookmarklets:**
   - Navigate to an arrest detail page
   - Click the bookmarklet in your toolbar
   - Form opens with pre-filled data
   - Review and submit

---

## 1. Lee County Bookmarklet

**Website**: https://www.sheriffleefl.org/  
**Proven**: ✅ Already working

```javascript
javascript:(function(){
  const formUrl = 'https://script.google.com/macros/s/AKfycbw1V0vi6O5iWxv7CTEzHTs_cCe1wMh-nlcxWamR6h6OW9RtssiSk8CR405o3OHUaRffXA/exec';
  
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
  const formUrl = 'https://script.google.com/macros/s/AKfycbw1V0vi6O5iWxv7CTEzHTs_cCe1wMh-nlcxWamR6h6OW9RtssiSk8CR405o3OHUaRffXA/exec';
  
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
  const formUrl = 'https://script.google.com/macros/s/AKfycbw1V0vi6O5iWxv7CTEzHTs_cCe1wMh-nlcxWamR6h6OW9RtssiSk8CR405o3OHUaRffXA/exec';
  
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
  const formUrl = 'https://script.google.com/macros/s/AKfycbw1V0vi6O5iWxv7CTEzHTs_cCe1wMh-nlcxWamR6h6OW9RtssiSk8CR405o3OHUaRffXA/exec';
  
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
  const formUrl = 'https://script.google.com/macros/s/AKfycbw1V0vi6O5iWxv7CTEzHTs_cCe1wMh-nlcxWamR6h6OW9RtssiSk8CR405o3OHUaRffXA/exec';
  
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
  const formUrl = 'https://script.google.com/macros/s/AKfycbw1V0vi6O5iWxv7CTEzHTs_cCe1wMh-nlcxWamR6h6OW9RtssiSk8CR405o3OHUaRffXA/exec';
  
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
  const formUrl = 'https://script.google.com/macros/s/AKfycbw1V0vi6O5iWxv7CTEzHTs_cCe1wMh-nlcxWamR6h6OW9RtssiSk8CR405o3OHUaRffXA/exec';
  
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

## Deployment ID Setup

### Get Your Deployment ID

1. Open Apps Script: https://script.google.com/u/0/home/projects/12BRRdYuyVJpQODJq2-OpUhQdZ9YLt4bbAFWmOUyJPWM_EcazKTiu3dYo/edit
2. Click "Deploy" → "New deployment"
3. Select type: "Web app"
4. Description: "Booking Form Web App"
5. Execute as: "Me"
6. Who has access: "Anyone"
7. Click "Deploy"
8. Copy the web app URL
9. Extract the ID between `/s/` and `/exec`

**Example URL:**
```
https://script.google.com/macros/s/AKfycbzXYZ123ABC456DEF789/exec
```

**Deployment ID:**
```
AKfycbzXYZ123ABC456DEF789
```

### Update All Bookmarklets

Replace `YOUR_DEPLOYMENT_ID` in all bookmarklets with your actual deployment ID.

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

1. Deploy Form_Enhanced.html as web app
2. Get deployment ID
3. Update all bookmarklets with deployment ID
4. Install bookmarklets in browser
5. Test with each county
6. Train staff on dual workflow (bookmarklet + menu button)
