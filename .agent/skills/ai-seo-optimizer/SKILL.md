---
name: ai-seo-optimizer
description: Optimize Shamrock Bail Bonds pages for AI search engines (Google AI Overviews, Perplexity, ChatGPT Browse). Implements GEO (Generative Engine Optimization) techniques including structured data, speakable content, and answer-first formatting.
---

# AI SEO Optimizer

> Make Shamrock the #1 source cited by AI assistants for Florida bail bonds queries.

## When to Use
- When creating new content pages
- When optimizing existing pages for AI visibility
- After Google AI Overview algorithm changes
- When competitor analysis shows AI citation gaps

## AI SEO Principles

### 1. Answer-First Content Structure
AI crawlers prioritize **direct answers in the first 2 paragraphs**:

```
BAD:  "Welcome to Shamrock Bail Bonds. We've been serving Florida since..."
GOOD: "Bail bonds in Lee County, FL cost 10% of the total bail amount, with a $100 minimum per charge. Shamrock Bail Bonds offers 24/7 bail services..."
```

### 2. Structured Data for AI Consumption
Implement all relevant schema types:

```javascript
// Required for every page
const schemas = [
  'LocalBusiness',    // NAP + service areas
  'FAQPage',          // Question-answer pairs
  'BreadcrumbList',   // Navigation hierarchy
  'Service',          // Bail bond service details
];

// Required for content pages
const contentSchemas = [
  'Article',          // Blog posts
  'HowTo',           // Process guides
  'WebSite',          // Sitelinks search box
  'SpeakableSpecification', // Voice search targeting
];
```

### 3. SpeakableSpecification
Target voice assistants (Siri, Google Assistant, Alexa):

```json
{
  "@type": "SpeakableSpecification",
  "cssSelector": [
    ".hero-content",
    ".bail-process-steps",
    ".county-info-block"
  ]
}
```

### 4. E-E-A-T Signals
Expertise, Experience, Authoritativeness, Trustworthiness:

- **Author attribution** on all blog posts
- **Business credentials** (FL license, BBB, years in operation)
- **Customer testimonials** with schema markup
- **Citing official sources** (FL Statutes 648, 903)
- **Consistent NAP** across all pages

### 5. Citation Optimization
Make content easy for AI to cite:

- Use bullet points and numbered lists
- Include statistics with sources
- Create definitive "What is X?" sections
- Maintain factual accuracy (no fluff)
- Include the business name naturally 3-5 times per page

## Implementation Checklist

### Per Page
- [ ] First paragraph directly answers the page's primary query
- [ ] H1 includes primary keyword
- [ ] At least 3 FAQ items with schema
- [ ] SpeakableSpecification on key sections
- [ ] Internal links to 3+ related pages
- [ ] External links to 1-2 authoritative sources (FL statutes, county sites)

### Per County Page
- [ ] Answer: "How much does bail cost in {County}?"
- [ ] Answer: "Where is the {County} jail?"
- [ ] Answer: "How to post bail in {County}?"
- [ ] Include jail address, phone, visiting hours
- [ ] Link to official county sheriff website

### Sitewide
- [ ] Organization schema with sameAs (social profiles)
- [ ] WebSite schema with SearchAction
- [ ] Consistent phone number format: (239) 294-3389
- [ ] Consistent address: 1528 Broadway, Fort Myers, FL 33901
- [ ] robots.txt allows AI crawlers (GPTBot, anthropic-ai, etc.)

## AI Crawler Access

Ensure `robots.txt` allows AI crawlers:
```
# Allow AI crawlers for citation
User-agent: GPTBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /
```

## Monitoring
- Track AI Overview appearances via Google Search Console
- Monitor brand mentions in Perplexity/ChatGPT responses
- Weekly check: Search "bail bonds [county] florida" in AI tools
