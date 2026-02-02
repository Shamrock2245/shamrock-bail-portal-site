# OpenAI API Setup Instructions

**Date:** February 2, 2026  
**Purpose:** Configure OpenAI API for AI extraction in Dashboard.html

---

## ✅ Step 1: Run Setup Script in GAS

1. Open the GAS Script Editor:
   https://script.google.com/u/0/home/projects/12BRRdYuyVJpQODJq2-OpUhQdZ9YLt4bbAFWmOUyJPWM_EcazKTiu3dYo/edit

2. Open `OpenAIClient.js`

3. Run the function: `setupOpenAIKey()`
   - Click the function dropdown → Select `setupOpenAIKey`
   - Click the "Run" button
   - **Expected output in logs:**
     ```
     ✅ OPENAI_API_KEY set successfully
     OpenAI Test Result: OK
     ✅ OpenAI connection verified
     ```

4. **Done!** The API key is now stored in Script Properties

---

## 🔍 Step 2: Verify Setup

Run the function: `verifyOpenAIKey()`

**Expected output:**
```
✅ OPENAI_API_KEY is set
   Key starts with: sk-proj-CL...
```

---

## 🧪 Step 3: Test AI Extraction in Dashboard

1. Open `Dashboard.html` in browser
2. Go to **AI Agents** tab → **The Clerk**
3. Paste sample booking text:
   ```
   Booking Report
   Name: DELFORD, ALEXIA LOUISE
   Booking Number: 10150696
   Arrest Date: 2/2/2026 3:00 AM
   Charges: AGGRAV ASSLT - WEAPON (W DEADLY WEAPON WITHOUT INTENT TO KILL)
   Bond: $10,000.00
   ```
4. Click **"Extract Data"**
5. **Expected:** Structured JSON output with defendant data

---

## 🖼️ Step 4: Test Screenshot Extraction

1. Take a screenshot of a Lee County booking page
2. Upload the screenshot in **The Clerk** section
3. Click **"Extract Data"**
4. **Expected:** Structured JSON output extracted from the image

---

## 🔧 Troubleshooting

### Error: "AI Extraction Failed"

**Possible causes:**
1. **OPENAI_API_KEY not set** → Run `setupOpenAIKey()`
2. **API quota exceeded** → Check OpenAI dashboard
3. **Network error** → Check GAS logs for details

### Error: "Unauthorized Access"

**Cause:** Your email is not in the allowed users list

**Fix:** Add your email to `ALLOWED_USERS` in `Code.js`:
```javascript
const ALLOWED_USERS = [
    'admin@shamrockbailbonds.biz',
    'shamrockbailoffice@gmail.com',
    'your-email@example.com'  // ADD YOUR EMAIL HERE
];
```

---

## 📊 API Key Details

**OpenAI API Key:**

The API key is stored in the environment variable `OPENAI_API_KEY`.

To get your own API key:
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Replace `'YOUR_OPENAI_API_KEY_HERE'` in `OpenAIClient.js` → `setupOpenAIKey()` function
4. Run `setupOpenAIKey()` in GAS

**Where it's stored:**
- **GAS Script Properties:** `OPENAI_API_KEY` (set by `setupOpenAIKey()`)
- **Wix Secrets Manager:** Not needed (AI extraction runs in GAS only)

**Model used:**
- `gpt-4o-mini` (fast, cost-effective, supports vision)

---

## 🔄 Migration from Gemini to OpenAI

**Files updated:**
- ✅ `OpenAIClient.js` - New OpenAI client (replaces GeminiClient.js)
- ✅ `AI_BookingParser.js` - Uses `callOpenAI()` instead of `callGemini()`
- ✅ `AI_CheckInMonitor.js` - Uses `callOpenAI()`
- ✅ `AI_FlightRisk.js` - Uses `callOpenAI()`
- ✅ `AI_Investigator.js` - Uses `callOpenAI()`
- ✅ `RAGService.js` - Uses `callOpenAI()`
- ✅ `Dashboard.html` - Updated badge to show "Powered by OpenAI GPT-4o-mini"

**Files deprecated:**
- ❌ `GeminiClient.js` - No longer used (can be deleted)

---

## ✅ Setup Complete

Once `setupOpenAIKey()` runs successfully, all AI features will work:
- 📝 **The Clerk** - Extract booking data from text/URL/screenshot
- 🔎 **The Analyst** - Flight risk analysis
- 👮 **The Monitor** - Check-in sentiment analysis
- 🕵️ **The Investigator** - Deep report analysis

**No additional configuration needed!**
