---
name: ai-listicle-outreach
description: Find relevant third-party best-tools listicles through observed AI recommendations and competitor backlinks, qualify editorial opportunities, and draft specific pitches. Use for getting a SaaS considered by category publishers or researching sources behind AI recommendations; sending outreach requires an explicit instruction.
metadata:
  author: Fleet
  provenance: Owner-pasted AI recommendation and Ahrefs backlink tactic, adapted 2026-10-23; original author and results were not supplied.
---

# AI listicle outreach

Test this hypothesis: a credible category page recommending competitors may be
a useful place for the product to earn editorial consideration. An email, link
or listicle placement does not guarantee a ChatGPT recommendation.

## Discover from actual answers

1. Read the product truth and identify category, customer, market/language and
   a relevant landing page. Use the specific category the product can serve.
2. Observe buyer questions such as `best <category> tools` on the requested AI
   surface. Retain the exact prompt, engine/model if shown, mode, date, locale
   and original answer reference. Record recommended competitors separately
   from cited URLs. Use fresh sessions; disclose personalization/session context.
3. If consumer ChatGPT is unavailable, use owner-provided captures or a clearly
   labeled alternative. An API-model response or ordinary web SERP is not a
   measured consumer ChatGPT recommendation. Continue discovery if useful but
   leave that measurement unavailable. Never invent recommended competitors.
4. Verify that the named competitors are real and relevant using their official
   pages. Start with a small explicit competitor set; no exhaustive crawl.

Site Health owns persistent AI observations; use its existing capture/brand
evidence workflow rather than creating another collector or dashboard.

## Competitor backlinks to listicles

**Ahrefs UI:** Site Explorer → competitor domain → Backlinks → `Best links` →
sort descending by `Page traffic`. Record the actual Best links configuration,
target scope, export date and any row/export limit. It is a configurable filter,
not an objective quality grade. Traffic is a provider estimate of organic page
traffic, not verified readership, conversion potential or AI influence.

**Connected Ahrefs API/MCP:** read `doc` for `site-explorer-all-backlinks` before
using its current schema. Verify entitlement and authorized units/spend first.
An example starting request, after current-schema confirmation:

```text
target: <competitor domain>
mode: subdomains
history: live
aggregation: 1_per_domain
limit: 25
select: url_from,url_to,title,anchor,traffic,is_spam,is_content,is_lost
order_by: traffic:desc
```

The API does not expose the UI's named Best links preset in this endpoint.
Record explicit filters and do not claim preset parity. One-per-domain sampling
can hide another relevant page; expand only justified candidate domains within
budget. Honor connector-required rendering and reported units. No paid call is
needed simply to save or validate this skill.

Without access or budget, use an existing authorized export or bounded public
searches for the observed competitor + category + `best`, `alternatives`, or
`comparison`. Mark the backlink index, filter and traffic estimates unavailable;
do not fabricate them or require a new subscription.

Inspect the exact referring pages, then:

- Verify the live competitor recommendation and its destination, not a search
  snippet or stale backlink row. A relevant single competitor link can qualify;
  record how much competitor coverage was actually checked.
- Check whether our product is already present, including aliases and existing
  links. If present, evaluate a correction or leave it alone rather than asking
  for a duplicate listing.
- Verify category/audience fit, current editorial quality, ownership, useful
  differentiation and an existing truthful product destination. Do not rank
  prospects solely by traffic or domain authority.
- Record the precise source excerpt and verification date. Keep AI-cited sources
  separate from backlink-discovered pages that have never been observed cited.
- Find a public editorial contact and its source. Flag affiliate, sponsored,
  competitor-owned, paid and unknown conditions. A blocked/403/429 page is
  unverified; do not label it dead or bypass access controls.
- Deduplicate by exact referring page + proposed destination; group referring
  domains separately. Reuse existing prospects/issues in the authorized store.

## Draft, placement and measurement

Return a compact qualified shortlist: source URL, competitor/link evidence,
AI-citation evidence or unknown, estimated traffic/source/date, reader benefit,
destination, verified contact/source, commercial conditions, decision and next
action. Unsupported prospects can be blocked or rejected; no quota requires
inventing a good match.

Draft a short individual pitch tied to the page and the verified reader benefit.
Identify the sender's connection to the product. Never invent product use,
relationships, endorsements or results. Do not offer link exchanges or payment
for ranking credit. Drafting does not authorize sending, negotiating, spending
or following up. Send only on explicit instruction covering the actual scope.

Use `discovered → qualified → draft_ready → approved → sent → live_verified`,
with rejected/blocked/declined outcomes as needed. Preserve existing explicit
authorization rather than repeatedly requesting it. `Sent` requires a send
receipt; an editor's promise is not a live placement. After acceptance, inspect
the published mention, actual href/destination, anchor, rel attributes and date.

Recheck the same versioned buyer prompts on the same engine/surface and record
mentions and citations separately. Exclude failed captures from the observed
no-mention denominator. Measure referral visits and useful conversion events
when available. Report placement, AI observations and conversions as different
outcomes; timing or correlation does not prove the placement caused a change.

## Sources

Owner-supplied tactic, 2026-10-23; original attribution was not provided.
Current primary references:
[Ahrefs backlink research](https://ahrefs.com/blog/find-backlinks/),
[Ahrefs configurable Best links](https://help.ahrefs.com/en/articles/752797-does-ahrefs-provide-an-accurate-way-to-detect-toxic-or-manipulative-backlinks),
[Ahrefs API](https://docs.ahrefs.com/docs/api/reference/introduction),
[qualified outbound links](https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links).
