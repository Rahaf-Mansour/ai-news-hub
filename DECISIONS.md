# Decisions

## 1. Build in TypeScript, don't fork Horizon

[Thysrael/Horizon](https://github.com/Thysrael/Horizon) is a healthy project (MIT, about 11k stars, commits this week). It already fetches HN, RSS and GitHub, dedupes, scores items with an LLM and publishes to GitHub Pages.

I built a separate pipeline instead, for four reasons:

- **Language.** Horizon is Python. This hub is maintained by people who work in JavaScript/TypeScript and Cypress every day, and it should be easy for them, and for contributors from the same world, to understand and change. A pipeline in the same language as the site and the tests means one toolchain, one test runner and one set of types (`src/types.ts`, shared by the ingest code and the UI).
- **The hard part is the curation, not the plumbing.** The value here is the role lens (Claude / SE / PM / QA), the trust tiers and the Claude-specific sources. Horizon scores general tech news on one scale and outputs English and Chinese. Adapting it would mean rewriting its prompts, its output and its site, which would leave little of the original.
- **The pipeline is small.** Five adapters, a tagger, dedupe, the LLM step and a runner come to about 1,200 lines of TypeScript plus tests. Owning them costs less than tracking an upstream fork.
- **Deterministic first.** Keyword rules place most items for free, and the brief asked for the LLM only as a fallback behind an environment variable. Horizon's design is LLM-first.

Borrowed from Horizon: dedupe before any LLM call, a cheap model for the bulk step, and GitHub Actions + Pages as the whole infrastructure. Credited in the README.

## 2. Stack: Vite + React + TypeScript (not Astro)

Both would work. I chose Vite + React because:

- **Every interactive requirement is client-side:** search, tier and type filters, tabs, read/bookmark state, unread counts and learning progress. In Astro all of that would be one large React island anyway, so Astro's static-first strength would barely be used.
- **Familiarity.** React is the most widely known UI library for likely contributors, and Vite also runs Vitest, so the app and the unit tests share a config.
- **Simple hosting.** The site is one static page that fetches `data/items.json`. Tabs are hash links (`#qa`), so GitHub Pages needs no 404 fallback, and `base: './'` makes the build work under any repo path.

What we give up: no content in the HTML before JavaScript runs, so search engines and link previews see little of the feed. The page's `<meta>` description and Open Graph tags cover link previews; if search indexing ever matters, pre-rendering Today at build time would be the fix.

## 3. Trust tiers

Each source has exactly one tier, set in `ingest/sources.ts`. The tier is shown on every item and adds weight when ranking.

| Tier | Rule | Examples |
|---|---|---|
| **Official** | The vendor or maintainer, writing about its own product: company news pages, docs release notes, GitHub releases of the project itself. | Anthropic News, Claude Platform release notes, Claude Code releases, Cypress blog, Playwright releases, promptfoo |
| **Editorial** | A named author or publication with a track record of editorial judgment and corrections, active in the last month. Independent of the products covered. | Simon Willison, Latent Space, AINews, Lenny's Newsletter, Import AI, TLDR AI, Ben's Bites, Product Growth |
| **Community** | Ranked by votes rather than by an editor. Only admitted with a points threshold and a title filter. | Hacker News searches (Claude, testing, product) |

Further rules:
- **Admission.** A source must have been checked to return live entries before it is added. Feeds that are mostly pre-release noise (Codex and Gemini CLI nightly tags) stay out of the news feed and appear only in the Repos tab.
- **Dedupe keeps the higher tier.** If HN and Anthropic both report a launch, the Anthropic item stays and gains the HN discussion link.
- **Ranking weight.** Official 3, editorial 2, community 1, before recency and topic boosts. Tiers order items; they never hide any.
- **Model leaderboards are link-only.** Arena, Artificial Analysis and Epoch AI change weekly and disagree with each other, so the site links out and never copies their numbers.
- **Unverifiable numbers are not shown.** Repo stars come from the GitHub API at build time. If that call fails, the site shows "not verified", never a cached or third-party figure.

## 4. Smaller choices

- **Archive by month in git.** `data/archive/YYYY-MM.json` keeps the full history with readable diffs and no database. The site loads only the last 30 days.
- **Scores are not archived.** They depend on "now", so they are computed fresh each run; otherwise every archive file would change daily.
- **No RSS for Anthropic pages: parse the HTML.** The parser walks up from each article link to its card and stops once the container holds a second article, so it never borrows a neighbour's date. If parsing yields zero items, that counts as a failure, so markup changes show up in the run log instead of failing silently.
- **Today caps.** At most one item per source and three per role while other roles have news, so a busy release feed or a Claude launch week can't take over the whole front page.
- **Design direction changed from the first plan.** The plan proposed warm paper with a serif display and a vermilion accent. Before building I moved away from it, because that combination is the most common look for generated editorial sites. The final look is cool paper, a variable grotesque, a reading serif and a dev mono, built on a "daily run report" concept.
