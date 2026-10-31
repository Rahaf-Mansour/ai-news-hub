// Claude model and product milestones in 2026, each checked against a
// primary Anthropic or Claude page on 2026-10-31. Newest first.

export interface TimelineEntry {
  date: string
  title: string
  detail: string
  url: string
  kind: 'model' | 'product' | 'access'
  correction?: string
}

const NOTES = 'https://platform.claude.com/docs/en/release-notes/overview'

export const CLAUDE_TIMELINE: TimelineEntry[] = [
  {
    date: '2026-10-22',
    title: 'Agent Skills donated to the Agentic AI Foundation',
    detail: 'The SKILL.md format moves to a neutral foundation, so skills you write are a safer long-term bet.',
    url: 'https://www.anthropic.com/news/donating-agent-skills-to-the-agentic-ai-foundation',
    kind: 'product',
  },
  {
    date: '2026-10-15',
    title: 'Code Review generally available',
    detail: "Claude's automated pull-request review, on Team and Enterprise plans.",
    url: 'https://www.claude.com/product/claude-code',
    kind: 'product',
  },
  {
    date: '2026-10-07',
    title: 'Claude Haiku 5.5',
    detail: 'Fastest 5.5 model, built for summarization, sub-agents and browser use.',
    url: 'https://www.anthropic.com/claude-haiku-5-5',
    kind: 'model',
  },
  {
    date: '2026-09-28',
    title: 'Claude Sonnet 5.5',
    detail: '30%+ faster than Sonnet 5 and up to 30% cheaper for most work.',
    url: 'https://www.anthropic.com/claude-sonnet-5-5',
    kind: 'model',
  },
  {
    date: '2026-09-22',
    title: 'Claude Opus 5.5',
    detail: 'First 5.5 model; about 40% cheaper to run than Opus 5 ($4 / $20 per million tokens).',
    url: 'https://www.anthropic.com/claude-opus-5-5',
    kind: 'model',
  },
  {
    date: '2026-09-01',
    title: 'Claude Fable 5.1 and Mythos 5.1',
    detail: 'Fable 5.1 for all customers; Mythos 5.1 for Project Glasswing participants.',
    url: 'https://www.anthropic.com/claude-fable-and-mythos-5-1',
    kind: 'model',
  },
  {
    date: '2026-07-24',
    title: 'Claude Opus 5',
    detail: 'New Opus flagship with a 1M-token context window, at Opus 4.8 pricing.',
    url: `${NOTES}#july-24-2026`,
    kind: 'model',
  },
  {
    date: '2026-06-30',
    title: 'Claude Sonnet 5',
    detail: 'Next-generation Sonnet, launched at $2 / $10 per million tokens.',
    url: `${NOTES}#june-30-2026`,
    kind: 'model',
  },
  {
    date: '2026-06-12',
    title: 'Fable 5 and Mythos 5 access suspended',
    detail: 'A US export-control directive paused access; Anthropic redeployed Fable 5 on Jun 30.',
    url: 'https://www.anthropic.com/news/fable-mythos-access',
    kind: 'access',
  },
  {
    date: '2026-06-09',
    title: 'Claude Fable 5 and Mythos 5',
    detail: 'First Mythos-class models. Fable 5 for all customers; Mythos 5 for Project Glasswing participants.',
    url: `${NOTES}#june-9-2026`,
    kind: 'model',
  },
  {
    date: '2026-04-30',
    title: 'Claude Security public beta',
    detail: 'Vulnerability scanning and proposed fixes for Claude Enterprise customers.',
    url: 'https://claude.com/resources/articles/claude-security-public-beta',
    kind: 'product',
    correction: 'A secondary October roundup dated this Oct 21. Claude’s own announcement is dated Apr 30.',
  },
]
