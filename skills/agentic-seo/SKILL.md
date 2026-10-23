---
name: agentic-seo
description: Run an owner-scoped SEO content cycle for a Fleet product, from keyword opportunities and briefs through writing, QA, publication, conversion measurement, and evidence-led refreshes. Use for agentic SEO setup, recurring content operations, or checking whether the complete workflow is ready.
metadata:
  author: Fleet
  provenance: Owner-supplied BuildingWaves article dated 2026-10-19, adapted 2026-10-23; linked original skill files and revenue claims were not independently verified.
---

# Agentic SEO

Operate one product's existing search/content workflow. Start with its product
truth, audience, market, content surface, current task queue and useful conversion
(activation, signup, purchase or another owner-defined outcome). A request to set
up skills is not a request to publish articles or start an unattended schedule.

## Readiness before execution

Report each dependency as `verified`, `configured-unverified`, `missing` or
`not-needed`, with evidence and the action needed. File existence is not proof
that an account connection works. Do not read secrets or environment files.

| Capability | Fleet route and practical check |
| --- | --- |
| Product website/blog | Read the owning repo's instructions and content model; identify existing URL, draft, build, preview and publish paths. Do not create a CMS or new blog implicitly. |
| Search Console | Site Health owns collection. Inspect current receipts and scope; when a refresh is authorized, run `node apps/backend/scripts/search-console-collect.mjs --project <id>` from `~/Desktop/fleet/site-health`. Do not add `--discovery-cycle`: it also submits indexing/sitemap changes. |
| SERPs and keyword/backlink metrics | Use existing `seo-research`, public search and authorized connected providers. Ahrefs/OpenSEO/DataForSEO are alternatives, not mandatory subscriptions. Tool availability does not prove paid entitlement; record cost limits before metered calls. |
| Task tracking | Fleet uses the owning repo's GitHub Issues. Reuse matching open work before creating a ticket. Vault uses its existing Linear workflow. Do not build a separate marketing queue. |
| Visual checks | Use the existing browser/screenshot tools and rendered page. ScreenshotOne is optional; no new API subscription is required. |
| Analytics and conversions | Verify the actual event, landing-page/source attribution, date range and denominator in the product's existing analytics. Clarity sessions alone do not establish signups or revenue. PostHog is optional. |
| AI recommendations | Site Health's `apps/backend/docs/ai-visibility-operations.md` owns the measurement procedure. Keep API-model checks, consumer-assistant captures and ordinary SERPs separate. Missing provider answers are unknown, not absence. |
| Recurrence and publishing | Inspect the existing scheduler, publication permissions, quota and rollback path. Create or change a schedule only when requested with a named product, cadence and execution scope. |

Resolve unavailable data narrowly: research can continue without paid metrics;
publication waits for a valid surface and scope; conversion claims wait for
attributed outcomes. Never claim all connections are working from this checklist.

## One cycle

Read the relevant existing skill when needed from
`~/Desktop/fleet/saas-maker/tooling/skills/`; do not load every skill at once.

1. **Review before creating work.** Inspect prior changes, live URLs, awaiting
   observations and open issues. Start with technical/indexing defects if they
   explain the loss. Stay within the current product task and active lever.
2. **Research and prioritize.** Use `seo-research`. Combine first-party query/page
   evidence, customer questions, observed SERPs and product fit. Group intents;
   map them to existing URLs before suggesting new pages. Prefer useful
   conversion proximity over volume. Leave unsupported metrics unavailable.
3. **Write a complete brief.** Each selected issue/draft records product and
   audience, query cluster and intent, target URL or new slug, new/refresh/merge
   rationale, baseline and sources, differentiation, outline, claim ledger,
   internal links, appropriate CTA/event, acceptance criteria and next check.
   Search before creating it; key duplicates by product + intent + target URL.
4. **Draft the article.** Use `content-coverage` for source-backed page content
   and the owning repo's content conventions. Use `marketing` for audience and
   copy questions. Answer the reader's task; add verified examples, limitations,
   relevant product screenshots/images and honest comparisons. Maintain an
   unpublished draft or local preview before publication.
5. **Run a separate QA pass.** Follow [content QA](references/content-qa.md).
   Return specific defects to the writer, revise and recheck the affected
   items. Use a bounded retry count (default two revisions); then park unresolved
   evidence or access gaps instead of looping indefinitely or weakening QA.
6. **Publish within existing authorization.** Respect current owner/repo release
   policy and any explicit campaign boundary; standing authorization need not
   be requested again. Preserve the prior revision and rollback. Run the repo's
   checks, publish through its real path, then read back the canonical live page,
   metadata, links, image and CTA. Inspect before retrying an uncertain write.
   Do not close the delivery task until the authorized live result is verified;
   otherwise record the exact draft/merged/published state and blocker.
7. **Measure and improve.** Site Health remains the collector. Compare complete,
   comparable periods with property, filters, market, date/lag and coverage
   retained. Keep impressions/clicks, AI mentions/citations, visits and useful
   conversions separate. Inspect tracking failures before declaring no demand.
   Create an evidence-backed refresh or technical-fix task, or choose to wait
   or leave the page alone. Never rewrite just to hit a weekly quota.

For third-party listicle opportunities use the separately installed
`ai-listicle-outreach` skill. Keep editorial placement and AI outcomes distinct.

## Recurring run and handoff

For an authorized weekly run: review due outcomes → research → deduplicate the
bounded next batch → draft/QA within scope → publish only if covered → record
live evidence and the next observation window. Existing constraints or missing
facts can yield zero new tickets. Do not promise endless keywords, dozens of
rewrites, first-page rankings, a fixed three-month payoff or automated revenue.

Retain feedback about audience, objections and useful examples in the existing
product context or issues, with provenance. Do not rewrite this skill or its
publication permissions autonomously under the label of self-improvement.

Finish with completed actions, QA result, revision/live URL, measured outcomes
and limitations, blocked connections and the best next action. Raw analytics,
answers, drafts and customer data belong in the authorized private/product store,
never the public shared skill repository.

## Sources

Adapted from the owner-pasted Kourosh Ghaffari / `@BuildingWaves` article dated
2026-10-19. The excerpt omitted the original linked skill files; this is a
Fleet-authored implementation, not an installation of those files or verification
of the author's revenue. Current primary guidance:
[AI content quality](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content),
[AI search features](https://developers.google.com/search/docs/appearance/ai-features).
