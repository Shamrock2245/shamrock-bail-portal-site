# Wix Editor Setup Guide - Simplified Login

**Time Required:** 10 minutes  
**Skill Level:** Beginner  
**Prerequisites:** Access to Wix Editor

---

## 🎯 What You're Building

A clean, professional login page with:
- One input field (email or phone)
- One button ("Get Started")
- Status messages (success/error)
- Optional loading indicator

---

## 📋 Step-by-Step Instructions

### Step 1: Open Portal Landing Page in Wix Editor

1. Go to [Wix Editor](https://manage.wix.com)
2. Open your Shamrock Bail Bonds site
3. Navigate to **Pages** → **Portal Landing**
4. Click **Edit** to open the page

---

### Step 2: Add Input Field

1. Click **Add** (+) button
2. Select **Input** → **Text Input**
3. Drag to center of page
4. **Resize:** Make it wide (400-600px on desktop)
5. **Properties Panel:**
   - **ID:** `emailPhoneInput` (EXACT - case sensitive!)
   - **Placeholder:** "Enter your email or phone number"
   - **Label:** "Email or Phone" (optional)
   - **Required:** Yes
   - **Type:** Text
6. **Design:**
   - Font size: 16px minimum
   - Height: 48px minimum
   - Border: 1px solid #ccc
   - Border radius: 4px
   - Padding: 12px

---

### Step 3: Add Button

1. Click **Add** (+) button
2. Select **Button**
3. Place below input field
4. **Properties Panel:**
   - **ID:** `getStartedBtn` (EXACT - case sensitive!)
   - **Label:** "Get Started"
   - **Link:** None (handled by code)
5. **Design:**
   - Width: Same as input field
   - Height: 56px minimum
   - Background: #1976D2 (blue) or your brand color
   - Text color: White
   - Font size: 18px
   - Font weight: Bold
   - Border radius: 4px

---

### Step 4: Add Status Message

1. Click **Add** (+) button
2. Select **Text**
3. Place below button
4. **Properties Panel:**
   - **ID:** `statusMessage` (EXACT - case sensitive!)
   - **Text:** "Status messages appear here" (placeholder)
   - **Hidden on load:** Yes (check this box!)
5. **Design:**
   - Font size: 14px
   - Text align: Center
   - Color: #1976D2 (will change dynamically)
   - Margin top: 16px

---

### Step 5: Add Loading Indicator (Optional)

1. Click **Add** (+) button
2. Select **Container** or **Box**
3. Place over entire page (full screen overlay)
4. **Properties Panel:**
   - **ID:** `loadingBox` (EXACT - case sensitive!)
   - **Hidden on load:** Yes (check this box!)
5. **Design:**
   - Width: 100%
   - Height: 100vh
   - Background: rgba(0, 0, 0, 0.7) (semi-transparent black)
   - Z-index: 9999
6. **Add to container:**
   - Loading spinner or animated GIF
   - Text: "Logging you in..."

---

### Step 6: Layout & Styling

**Recommended Layout:**
```
┌─────────────────────────────────┐
│                                 │
│         [Logo/Header]           │
│                                 │
│    "Fast, Secure Portal Access" │
│                                 │
│  ┌───────────────────────────┐  │
│  │ Enter email or phone...   │  │ ← #emailPhoneInput
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │      Get Started          │  │ ← #getStartedBtn
│  └───────────────────────────┘  │
│                                 │
│     [Status message here]       │ ← #statusMessage
│                                 │
│  "Available 24/7 • 239-332-2245"│
│                                 │
└─────────────────────────────────┘
```

**Mobile Considerations:**
- Stack elements vertically
- Full-width input and button
- Large touch targets (48px minimum)
- No horizontal scrolling

---

### Step 7: Verify Element IDs

**CRITICAL:** Element IDs must match EXACTLY (case-sensitive)

1. Click on input field
2. Check Properties Panel → ID = `emailPhoneInput`
3. Click on button
4. Check Properties Panel → ID = `getStartedBtn`
5. Click on status message
6. Check Properties Panel → ID = `statusMessage`

**If IDs don't match, the code won't work!**

---

### Step 8: Test in Preview

1. Click **Preview** button (top right)
2. Try entering an email
3. Click "Get Started"
4. Check console (F12) for debug messages
5. Verify status message appears

**Expected Console Output:**
```
🚀 Portal Landing v2.0: Simplified Fortune 50 Grade UX
🎨 Setting up simplified login UI...
✅ UI elements found, attaching handlers
✅ Simplified login ready!
```

---

### Step 9: Publish

1. Click **Publish** button (top right)
2. Wait for deployment (1-2 minutes)
3. Test on live site
4. Test on mobile device

---

## 🎨 Design Recommendations

### Colors (Professional)
- **Primary Button:** #1976D2 (Material Blue 700)
- **Success Message:** #388E3C (Material Green 700)
- **Error Message:** #D32F2F (Material Red 700)
- **Info Message:** #1976D2 (Material Blue 700)
- **Background:** #FFFFFF (White)
- **Input Border:** #CCCCCC (Light Gray)

### Typography
- **Heading:** 32px, Bold, #1a5490 (Brand Blue)
- **Subheading:** 18px, Regular, #666666
- **Input:** 16px, Regular, #333333
- **Button:** 18px, Bold, #FFFFFF
- **Message:** 14px, Regular, (dynamic color)

### Spacing
- **Section padding:** 40px
- **Element spacing:** 20px
- **Input padding:** 12px
- **Button padding:** 16px 24px

---

## ✅ Verification Checklist

Before publishing, verify:

- [ ] Input field has ID `emailPhoneInput`
- [ ] Button has ID `getStartedBtn`
- [ ] Status message has ID `statusMessage`
- [ ] Status message is hidden on load
- [ ] Input placeholder text is clear
- [ ] Button label is "Get Started"
- [ ] Layout looks good on mobile
- [ ] Layout looks good on desktop
- [ ] Colors match brand guidelines
- [ ] Font sizes are readable
- [ ] Touch targets are large enough (48px+)
- [ ] No console errors in Preview

---

## 🚨 Common Mistakes

### ❌ Wrong: `emailphoneinput` (lowercase)
### ✅ Correct: `emailPhoneInput` (camelCase)

### ❌ Wrong: Status message visible on load
### ✅ Correct: Status message hidden on load

### ❌ Wrong: Button linked to another page
### ✅ Correct: Button has no link (code handles it)

### ❌ Wrong: Input field too small (< 48px height)
### ✅ Correct: Input field large (48px+ height)

---

## 📱 Mobile Testing

Test on real devices:
1. iPhone (Safari)
2. Android (Chrome)
3. iPad (Safari)

**Check:**
- Input auto-focuses
- Keyboard doesn't cover button
- Button is easy to tap
- Text is readable
- No horizontal scrolling

---

## 🆘 Troubleshooting

### "Configuration error" message
**Problem:** Element IDs don't match  
**Solution:** Check IDs are EXACTLY `emailPhoneInput`, `getStartedBtn`, `statusMessage`

### Button doesn't do anything
**Problem:** Button click not firing  
**Solution:** Check console for errors, verify ID is `getStartedBtn`

### Status message doesn't appear
**Problem:** Element not found or not visible  
**Solution:** Verify ID is `statusMessage`, check it's not hidden by CSS

### Input doesn't auto-focus
**Problem:** Browser security or element not ready  
**Solution:** This is optional, doesn't affect functionality

---

## 🎓 Next Steps

After setup:
1. Pull latest code from GitHub
2. Restart Wix Dev Server (`wix dev`)
3. Test in Preview mode
4. Test magic link email delivery
5. Publish to production
6. Monitor for errors

---

## 📞 Support

**Questions?**
- Check console (F12) for debug messages
- Review code in `src/pages/portal-landing.bagfn.js`
- Contact development team

**Emergency?**
- Call 239-332-2245
- Email admin@shamrockbailbonds.biz

---

**Estimated Time:** 10 minutes  
**Difficulty:** ⭐☆☆☆☆ (Beginner)  
**Result:** Fortune 50-grade login experience
