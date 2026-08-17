# Wix Editor: Paperwork Popup Setup

Follow this in the **Wix Editor** (not the Dashboard). The popup UI now lives on Netlify:

`https://shamrock-telegram.netlify.app/paperwork/`

Wix only has to **open a lightbox** and **iframe that URL**. Do not rebuild PIN / ID / signing inside Wix.

The Velo code is already in the repo:

- `src/lightboxes/SigningLightbox.js`
- `src/pages/SigningLightbox.sjr0i.js`
- `src/pages/portal-indemnitor.k53on.js`
- `src/public/portal-config.js` (`PAPERWORK_APP_URL`)

You still have to make the **Editor elements** match the IDs below, then publish.

---

## 1. Publish Netlify first

1. Push / deploy `shamrock-telegram-app` so `/paperwork/` is live.
2. In a private window open:

   `https://shamrock-telegram.netlify.app/paperwork/`

3. Confirm you see **Unlock your packet** (phone + PIN). If that page 404s, stop — Wix has nothing to iframe yet.
4. Optional Netlify env (already defaults if omitted):

   | Variable | Value |
   |---|---|
   | `LEADS_API_URL` | `https://leads.shamrockbailbonds.biz` |

---

## 2. Open the Signing lightbox

1. Wix Editor → **Layers** / **Lightboxes**.
2. Open **`SigningLightbox`** (the existing paperwork / signing popup).
3. If you do not have one, **Add** → **Lightbox** → name it exactly `SigningLightbox`.

Keep these elements. Create any that are missing. IDs are case-sensitive.

| Element | Type | ID | What to do |
|---|---|---|---|
| Title | Text | `#signingTitle` | Leave placeholder text; code overwrites it. |
| Instructions | Text | `#signingInstructions` | Same. Keep it visible. |
| Loading | Text or box | `#loadingIndicator` | Code hides this on load. |
| Error | Text | `#errorMessage` | Code hides this on load. |
| **Paperwork iframe** | **HTML iframe** | **`#signingFrame`** | This is the important one. See step 3. |
| Close | Button | `#cancelBtn` | Closes the lightbox. |
| Help (optional) | Button | `#helpBtn` | Optional. |

Do **not** rename `#signingFrame`.

---

## 3. Paste the HTML into `#signingFrame`

You already have the right element: **`#signingFrame`** with **HTML Settings** open.

1. Leave **Code** selected (not Website address).
2. Replace the old SignNow placeholder. Change **What's in the embed?** to: `Shamrock Paperwork Popup`
3. Paste the HTML below into **Add your code here**, then **Apply**.
4. Stretch `#signingFrame` to at least **620px** tall.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    html, body { margin: 0; height: 100%; background: #0b1120; }
    iframe { border: 0; width: 100%; height: 100%; display: block; }
  </style>
</head>
<body>
  <iframe
    id="app"
    src="https://shamrock-telegram.netlify.app/paperwork/?embed=1"
    allow="camera; microphone; clipboard-read; clipboard-write; fullscreen"
    allowfullscreen></iframe>
  <script>
    var BASE = 'https://shamrock-telegram.netlify.app/paperwork/';
    var frame = document.getElementById('app');
    function openPaperwork(data) {
      data = data || {};
      try {
        var parsed = new URL(data.url || BASE, BASE);
        parsed.searchParams.set('embed', '1');
        if (data.phone) parsed.searchParams.set('phone', String(data.phone).replace(/\D/g, ''));
        if (data.sessionToken || data.st) parsed.searchParams.set('st', data.sessionToken || data.st);
        if (data.signUrl) parsed.searchParams.set('link', data.signUrl);
        frame.src = parsed.toString();
      } catch (e) {
        frame.src = BASE + '?embed=1';
      }
    }
    window.onmessage = function (event) {
      var data = event && event.data;
      if (!data) return;
      if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) { return; } }
      if (data.type === 'shamrock-paperwork-open' || data.phone || data.sessionToken || data.url) {
        openPaperwork(data); return;
      }
      if (data.type === 'shamrock-paperwork-complete' || data.type === 'shamrock-paperwork-close') {
        if (window.parent !== window) window.parent.postMessage(data, '*');
      }
    };
  </script>
</body>
</html>
```

The SignNow “Still Connecting…” card should disappear after Apply. You should see the Netlify **Unlock your packet** screen.

Same file in the repo: `src/custom-embeds/signing-frame.html`.

---

## 4. Point the indemnitor portal at this lightbox

Page: **`/portal-indemnitor`** (`portal-indemnitor.k53on.js`).

1. Keep `#bannerPaperworkRequired` and `#boxActionRequired`.
2. The trigger `#startPaperworkBtn` (or the auto-open on `?autoPaperwork=1`) should open **`SigningLightbox`**, not a rebuilt Wix form.
3. Repo code already tries `LightboxController.show('signing', …)` and falls back to `IdUploadLightbox`.
4. In Editor, confirm the lightbox **name** is exactly `SigningLightbox` (LightboxController maps `signing` → `SigningLightbox`).
5. Do **not** delete `#indemnitorWizard`. It stays as the intake wizard fallback when there is no case yet.

### Optional: keep IdUploadLightbox

Leave `IdUploadLightbox` in the site. It is only the fallback if Signing is missing. You do **not** need to rebuild ID capture in Wix — that now happens inside the Netlify popup.

---

## 5. Portal landing / magic links

Page: **`/portal-landing`**.

No new elements required. After login, indemnitors land on `/portal-indemnitor`, which auto-opens the popup when paperwork is still due.

If you send SMS / iMessage links, use one of:

```
https://www.shamrockbailbonds.biz/portal-indemnitor?autoPaperwork=1
https://shamrock-telegram.netlify.app/paperwork/?phone=2395550100
https://shamrock-telegram.netlify.app/paperwork/?embed=1
```

Staff-issued DocuSeal links stay:

```
https://paperwork.shamrockbailbonds.biz/sign/{packet_id}/indemnitor
https://sign.shamrockbailbonds.biz/s/{slug}
```

---

## 6. Custom Code / iframe permissions (once)

1. **Settings** → **Custom Code** → Head (all pages) **or** just portal pages.
2. You do **not** need to paste the paperwork HTML.
3. Confirm the site is allowed to iframe Netlify:
   - Netlify already sends `Content-Security-Policy: frame-ancestors *` and `X-Frame-Options: ALLOWALL`.
4. If Wix blocks the iframe, open **SigningLightbox** → `#signingFrame` → allow **external site embed**.

---

## 7. Publish Wix

1. Editor → **Save**.
2. **Publish** (Velo page code does not go live until Publish).
3. Test on a phone, not only desktop preview.

### Pass / fail

| Step | Expected |
|---|---|
| Open `/portal-indemnitor` as an indemnitor | Signing lightbox opens (or banner + button does). |
| Lightbox visible | Title “Bond Paperwork” and the Netlify unlock screen inside `#signingFrame`. |
| Enter phone, tap **Text me a PIN** | iMessage/SMS PIN from Super CRM. |
| Enter PIN | Identity screen (selfie + ID). |
| Scan ID | Address confirm popup, then remaining-fields popup. |
| If staff already created a DocuSeal packet | **Sign paperwork now** embeds DocuSeal. |
| If staff has **not** created a packet | “Staff is still reviewing” — no forged signing link. |
| After sign | Lightbox can close; portal shows success. |

---

## 8. What you should **not** do in Wix

- Do not add SignNow embed code.
- Do not build PIN / OCR / remaining-fields as Wix inputs. Those are the Netlify popups.
- Do not point `#signingFrame` at `sign.shamrockbailbonds.biz` directly. The Netlify app decides when DocuSeal is allowed.
- Do not create a new lightbox with a different name unless you also change `LightboxController` (`signing` → `SigningLightbox`).
- Do not change `#signingFrame` to a Wix image or text box.

---

## 9. Element checklist (copy into Editor)

```
SigningLightbox
  #signingTitle
  #signingInstructions
  #loadingIndicator
  #errorMessage
  #signingFrame          ← HTML iframe, 620px+ tall
  #cancelBtn
  #helpBtn               ← optional

portal-indemnitor
  #bannerPaperworkRequired
  #boxActionRequired
  #startPaperworkBtn     ← optional extra button; auto-open still works
  #indemnitorWizard      ← keep
```

---

## 10. If something is blank

| Symptom | Fix |
|---|---|
| iframe shows Wix “embed a site” placeholder | Publish after saving Velo; confirm `#signingFrame` is an HTML iframe with ID `signingFrame`. |
| iframe 404 | Deploy `shamrock-telegram-app` `/paperwork/`. |
| PIN send fails | Super CRM `https://leads.shamrockbailbonds.biz/api/portal/send-pin` must be up; Netlify `LEADS_API_URL` set. |
| ID scan fails | CRM `/api/portal/id-ocr` needs a verified PIN session. |
| Sign button missing | Staff must finalize the DocuSeal packet in Super CRM first. That is intentional. |
| Lightbox never opens | Lightbox name must be `SigningLightbox`. Check browser console for `LightboxController`. |
| Camera blocked in iframe | On a real phone, grant camera; desktop preview often cannot scan. |

---

## Pipeline (so the Editor changes make sense)

```
Wix SigningLightbox (#signingFrame)
    → https://shamrock-telegram.netlify.app/paperwork/?embed=1
        → Netlify function /api/paperwork
            → Super CRM /api/portal/*  (PIN, ID OCR, remaining fields)
                → DocuSeal /s/{slug}   (only if a packet already exists)
```

Wix does not talk to DocuSeal. Wix only hosts the popup chrome and the iframe.
