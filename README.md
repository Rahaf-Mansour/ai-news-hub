# AI News & Learning Hub

A daily, role-tagged digest of AI news, Claude releases and learning resources, read through four lenses: **Claude**, **QA**, **product management** and **software engineering**. Built for one reader (a Producer with a QA automation background) to open every morning.

- **Today**: the 5–8 most important items from the last 48 hours, one lead story plus role groups.
- **Tabs**: All · Claude · SE · PM · QA · Repos · Learn, with unread counts, search and filters.
- **Claude**: a release timeline checked against Anthropic's own pages, plus the Claude feed.
- **Repos**: 27 repos with stars and last push from the GitHub API, or "not verified".
- **Learn**: two ordered tracks, *AI-enabled Producer* and *QA to AI testing*, with progress you can tick off.
- **Model watch**: links out to Arena, Artificial Analysis and Epoch AI (no scraped numbers).

Static site (Vite + React + TypeScript). Data refreshes once a day through GitHub Actions. No server, no database, no analytics.

## Setup

Requires Node 20 or later (22 recommended).

```bash
npm install
npm run ingest   # fetch all sources now (about 30 seconds); writes data/ and public/data/
npm run dev      # http://localhost:5173
```

Other scripts:

| Script | What it does |
|---|---|
| `npm test` | Vitest unit tests for ingestion, tagging, dedupe, scoring, Today selection and filters |
| `npm run cy:run` | Serves the built site from `dist/` on :4173 and runs the Cypress E2E suite headless (run `npm run build` first) |
| `npm run cy:open` | Cypress in interactive mode (start `npm run preview` first) |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run ci` | Lint, unit tests, build and Cypress, the same order the workflow uses |

## How the daily job works

`.github/workflows/daily.yml` runs at **05:30 UTC** every day (and on demand from the Actions tab):

1. **Fetch.** `ingest/run.ts` fetches the 23 sources in `ingest/sources.ts`, six at a time, each with a 20-second timeout. A source that fails is logged, recorded in `public/data/sources-status.json` with its error and last success, and skipped. The run fails only if *every* source fails, and then it leaves the published data untouched.
2. **Normalize.** URLs are canonicalized (https, no `www.`, tracking params removed, sorted query). Feed text is cut to a 180-character summary; article bodies are never stored.
3. **Tag.** Keyword rules in `ingest/tagger.ts` assign Claude / SE / PM / QA. Focused sources (the Cypress blog, Claude Code releases) always carry their own roles; general newsletters only fall back to a default role when no rule matches, and those items are marked for the LLM.
4. **Dedupe.** The same canonical URL, or near-identical titles (token Jaccard ≥ 0.85) from different sources within three days, merge into one item. The higher trust tier wins; roles are combined and a Hacker News discussion link is kept.
5. **LLM (optional).** See below.
6. **Score and write.** Items are scored by trust tier, recency, Claude relevance and launches (routine patch releases score lower) and written to:
   - `data/archive/YYYY-MM.json`: the full history, one file per month, committed to git.
   - `public/data/items.json`: the last 30 days, which the site loads.
   - `public/data/repos.json` and `public/data/sources-status.json`.
7. **Test, then commit.** Lint, typecheck, Vitest, build and Cypress must pass before the day's data is committed back to `main`.

## Add a source

1. Confirm the feed exists and returns entries (`curl -sL <url> | head`). Only add official or well-regarded, active sources.
2. Add an entry to `SOURCES` in `ingest/sources.ts`:

```ts
{
  id: 'vitest-releases',            // unique, kebab-case
  name: 'Vitest releases',          // shown on every item
  url: 'https://github.com/vitest-dev/vitest/releases',   // human page
  feedUrl: 'https://github.com/vitest-dev/vitest/releases.atom',
  type: 'release',                  // news | release | article | repo
  roles: ['qa'],                    // always applied; use [] + fallbackRoles for general newsletters
  tier: 'official',                 // official | editorial | community (rules in DECISIONS.md)
  kind: 'github-releases',          // rss | github-releases | anthropic-cards | claude-release-notes | hn
  maxItems: 5,                      // optional, default 15
}
```

3. Run `npm run ingest` and check the new line in the output and in `public/data/sources-status.json`.
4. Commit. The next daily run picks it up.

For a repo in the **Repos** tab, add `{ fullName, why, roles, note? }` to `ingest/repos.config.ts`.

## Turn on the LLM summaries

The site builds and works without a key. With the LLM on, each run sends up to 60 new items (title, source and a 300-character excerpt) to **Claude Haiku 5.5** in batches of 20. It uses structured output and `effort: low`, and the response adds:

- a one-sentence summary in its own words (replacing the feed excerpt),
- a "Why it matters" line written for this reader,
- roles for items the keyword rules could not place.

Items keep their LLM text in the archive, so each item is processed once. If a call fails or is declined, those items stay as they were. At Haiku 5.5's list price this is well under a cent a day.

**Locally:**

```bash
ENABLE_LLM=true ANTHROPIC_API_KEY=sk-ant-... npm run ingest
```

**In GitHub Actions** (both are needed):
1. Settings → Secrets and variables → Actions → *Secrets*: add `ANTHROPIC_API_KEY`.
2. Same page → *Variables*: add `ENABLE_LLM` = `true`.

## Deploy to GitHub Pages

Deployment is **off** until you turn it on:
1. Settings → Pages → Source: **GitHub Actions**.
2. Settings → Secrets and variables → Actions → *Variables*: add `ENABLE_PAGES_DEPLOY` = `true`.

The next run (or a manual "Run workflow") builds and deploys. The site uses relative paths and hash links (`#qa`, `#repos`), so it works at `https://<user>.github.io/<repo>/` with no extra configuration.

## Design choices

- **Concept: a daily run report.** The masthead reads like a test-run summary ("✓ 23 sources passed · 156 items · +12 new since your last visit"), because the reader's background is QA and the data really is a daily run. A diff-style **+** in the gutter marks items first seen since your last visit.
- **Type.** *Bricolage Grotesque* (display; variable width and optical size) for the wordmark and headlines, *Literata* (a reading serif built for screens) for summaries, and *JetBrains Mono* for dates, tiers and counts. All from Google Fonts with system fallbacks.
- **Color.** Cool paper and ink-navy with one cobalt accent, kept for the lead kicker, links on hover and active tabs. Each role has its own muted hue (Claude rust, SE teal, PM ochre, QA green) on chips, group headings and tab underlines. Dark mode is designed separately (deep navy, lifted role hues), not inverted. It follows the OS setting, and a System → Light → Dark toggle overrides it.
- **Trust tier badges** use shape as well as words: filled square for official, half-filled for editorial, dotted circle for community.
- **Motion.** One short staggered rise on Today when the page loads, plus link underline and read-state transitions. All motion is off under `prefers-reduced-motion`.
- **Mobile.** One column, sticky section tabs that scroll sideways, and no horizontal page scroll (covered by a Cypress test).
- Avoided on purpose: dashboard tiles, gradient heroes, and the cream-paper-plus-serif "newspaper" look that most generated editorial sites use.

## Privacy and licensing

- No analytics, cookies or third-party scripts. The only external request is the Google Fonts stylesheet.
- Read state, bookmarks, learning progress and theme live in `localStorage` in your browser only.
- Every item links to its source. The site stores and shows **titles, links and one-line summaries only**, never article bodies. With the LLM on, summaries are written by the model. **With it off, the summary is the publisher's own feed description cut to 180 characters**, which the footer says. To show titles only instead, set `summary: ''` in `toItem()` in `ingest/build.ts`.
- Repo licenses are shown when GitHub reports one. Non-commercial ones are flagged (Product-Manager-Skills is CC BY-NC-SA 4.0; qodo-cover is AGPL-3.0).

## Known limitations

- **Anthropic pages are parsed from HTML.** anthropic.com/news, /engineering and the Claude Platform release notes have no RSS feed. If their markup changes, the parser returns zero items: that source shows as failed in the run log and keeps its older items. Fixture tests in `ingest/adapters/adapters.test.ts` document the expected structure.
- **Release notes are one item per day**, headed by that day's most important change (launches first).
- **Lenny's Newsletter** mixes free and paid posts and the feed doesn't say which; paid ones will hit a paywall.
- **"Last push" is GitHub's `pushed_at`** (any branch), a close proxy for the last commit, at one API call per repo.
- **Ranking is rule-based** (tier, recency, Claude and launch boosts). It does not learn from what you read.
- **Read state is per browser.** It doesn't sync across devices, and clearing site data resets it.
- **HN coverage is narrow by design.** Three searches, each with a title filter and a points threshold, so off-topic stories stay out but some relevant ones will be missed.
- **Fact-checked once.** The Claude timeline and Learn links were checked on 2026-10-31. The timeline is hand-maintained in `src/content/claudeTimeline.ts` and is not updated by the daily job.

## Verification notes (2026-10-31)

The Claude release timeline was checked against primary pages. Two corrections to the secondary sources:
- **Claude Security public beta** is dated **Apr 30, 2026** in Claude's own announcement, not Oct 21 as an October roundup said.
- **Mythos 5 / 5.1** are available to **Project Glasswing participants** (not "vetted organizations" in general).

Live GitHub star counts differed a lot from third-party trackers (for example opencode about 223k, anthropics/skills about 186k). `anthropics/courses` is archived.

## Project layout

```
ingest/            daily pipeline (Node + tsx)
  sources.ts       the 23 feed sources
  repos.config.ts  the 27 watched repos
  adapters/        rss, github-releases, anthropic HTML, release notes, HN
  build.ts         raw → item, dedupe, score
  tagger.ts        keyword rules
  llm.ts           optional Claude Haiku 5.5 step
  run.ts           orchestrator (npm run ingest)
data/archive/      full history by month (committed)
public/data/       what the site loads (committed)
src/               the site (React)
  lib/             Today selection, filters, formatting, storage
  content/         Learn tracks, Claude timeline, model watch links
cypress/           E2E specs and fixtures
```

Inspired by [Thysrael/Horizon](https://github.com/Thysrael/Horizon) (MIT). See [DECISIONS.md](DECISIONS.md) for why this is a separate TypeScript build.
