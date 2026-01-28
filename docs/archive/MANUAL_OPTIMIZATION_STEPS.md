# Manual Optimization Steps for Shamrock Bail Bonds

The following performance optimizations **cannot be applied via code** and must be done manually in the Wix Editor to mitigate the largest performance bottleneck (LCP - Largest Contentful Paint).

## 1. Hero Image Optimization (Critical)

The large background image on the homepage is the main cause of the slow load time (30s+ on mobile).

1.  **Open Wix Editor**.
2.  Navigate to the **Home Page**.
3.  Select the **Hero Strip/Section** (the top section with the background image).
4.  **Change the Background Image**:
    *   Upload a compressed version of the image (Target: **< 100KB**).
    *   **Tip**: Use [TinyJPG](https://tinyjpg.com/) to compress the image before uploading.
5.  **Set Fetch Priority** (If available in Wix Editor dev mode, otherwise ensure it's the first element):
    *   Currently, Wix optimizes meaningful images automatically, but ensuring the file size is small is strictly manual.
6.  **Mobile Background**:
    *   Switch to **Mobile View** in the editor.
    *   Consider setting a **different, smaller image** or a **solid color** for the hero background on mobile to load instantly.

## 2. Image Priorities

1.  Select images that are "below the fold" (not visible immediately when the page loads, like Testimonials).
2.  In the image settings, ensure **Lazy Loading** is enabled (usually on by default in modern Wix, but worth checking).

## 3. Font Optimization

1.  Go to **Theme Manager** -> **Typography**.
2.  Ensure you are using **No more than 2 font families**. Loading multiple font files slows down rendering.
3.  If using custom fonts, ensure they are WOFF2 format.

## 4. Mobile Layout Clean-up

1.  Switch to **Mobile View**.
2.  **Hide** any elements that are not strictly necessary for the mobile user (e.g., decorative shapes, complex heavy galleries).
3.  Ensure the "Call Now" and "Start Bail" buttons are visible immediately without scrolling.

## 5. Publish

After making these changes, **Publish** the site to verify the improvements.
