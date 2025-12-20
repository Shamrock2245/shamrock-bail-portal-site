# Shamrock Bail Bonds - Pages to Delete

This document lists the pages that should be deleted from the current Wix site to align with the new redesigned structure.

## How to Delete Pages in Wix

1. Go to your Wix Dashboard
2. Click on **Site & Mobile App** in the left sidebar
3. Click on **Website** → **Site Pages**
4. Find the page you want to delete
5. Click the **three dots (⋮)** next to the page name
6. Select **Delete**
7. Confirm the deletion

**Important:** Before deleting any page, ensure you have:
- Backed up any content you want to preserve
- Set up proper redirects for SEO (if the page had traffic)
- Updated any internal links pointing to that page

---

## Pages to DELETE

Based on the master plan and new site architecture, the following pages should be removed:

### Duplicate/Redundant Pages
These pages are being consolidated or replaced:

| Page Name | Reason for Deletion | Replacement |
|-----------|---------------------|-------------|
| Old Home Page (if duplicate exists) | Replaced by new Home | `/` (new Home) |
| Duplicate county pages | Consolidated into new county template | `/bail-bonds/{county}-county` |
| Old contact forms | Replaced by new Contact page | `/contact` |

### Outdated Content Pages
These pages contain outdated information:

| Page Name | Reason for Deletion | Action |
|-----------|---------------------|--------|
| Old FAQ page (if separate) | Integrated into How Bail Works | Content moved to `/how-bail-works` |
| Outdated service pages | Replaced by new structure | N/A |

### Test/Development Pages
Remove any test or development pages:

| Page Name | Reason for Deletion |
|-----------|---------------------|
| Test pages | Development artifacts |
| Draft pages | Unpublished content |
| Copy of... pages | Duplicates |

---

## Pages to KEEP and UPDATE

The following pages should be kept but updated with new design:

| Current Page | New URL | Notes |
|--------------|---------|-------|
| Home | `/` | Complete redesign |
| How Bail Works | `/how-bail-works` | Update content and design |
| Become a Bondsman | `/become-a-bondsman` | Keep and expand |
| Blog | `/blog` | Keep, update design |
| Contact | `/contact` | Update design |
| Privacy Policy | `/privacy-policy` | Keep as-is |
| Terms of Service | `/terms-of-service` | Keep as-is |

---

## New Pages to CREATE

These pages need to be created as part of the redesign:

| Page Name | URL | Priority |
|-----------|-----|----------|
| County Directory | `/bail-bonds` | High |
| 67 County Pages | `/bail-bonds/{county}-county` | High |
| Sheriffs & Clerks Directory | `/florida-sheriffs-clerks-directory` | High |
| Members Login | `/members/login` | High |
| Members Account | `/members/account` | High |
| Start Bail | `/members/start-bail` | High |

---

## URL Redirect Plan

For any deleted pages that had SEO value, set up 301 redirects:

```
# In Wix: Marketing & SEO → SEO Tools → URL Redirect Manager

Old URL → New URL
/old-page → /new-equivalent-page
/county-name-bail-bonds → /bail-bonds/county-name-county
```

---

## Checklist Before Deleting

- [ ] Content backed up
- [ ] Redirects configured (if needed)
- [ ] Internal links updated
- [ ] External links checked (Google Search Console)
- [ ] Analytics reviewed for traffic impact
- [ ] Team notified of changes

---

## Notes

- Always delete pages during low-traffic periods
- Monitor 404 errors after deletion
- Update sitemap after major changes
- Re-submit sitemap to Google Search Console

---

*Last Updated: December 2024*
*Part of Shamrock Bail Bonds Website Redesign Project*
