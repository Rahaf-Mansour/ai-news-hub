import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'
import type { Item, Role } from '../src/types'
import { sortRoles } from './tagger'
import { truncate } from './text'

export const LLM_MODEL = 'claude-haiku-5-5'

/** The LLM step runs only when both are set, so the site always builds without a key. */
export function llmEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.ENABLE_LLM === 'true' && Boolean(env.ANTHROPIC_API_KEY)
}

export interface LlmInput {
  id: string
  title: string
  source: string
  excerpt: string
}

const EnrichmentSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      roles: z.array(z.enum(['claude', 'se', 'pm', 'qa'])),
      summary: z.string(),
      why: z.string(),
    }),
  ),
})
export type LlmOutput = z.infer<typeof EnrichmentSchema>['items'][number]

export type Enricher = (batch: LlmInput[]) => Promise<LlmOutput[]>

const SYSTEM = `You label AI news items for a public daily digest.

Its readers are working software people (engineers, product managers and testers) who want to know what changed in AI for their role. The digest has four lenses:
- claude: Claude models, Claude Code, Anthropic products and API changes
- se: software engineering with AI (coding agents, SDKs, developer tooling)
- pm: product management with AI (discovery, PRDs, strategy, adoption, AI product sense)
- qa: testing and quality (test automation, Cypress/Playwright, evals for LLM features, AI test tools)

For each item you get a title, a source name and a short excerpt. Return, for every item, using its id:
- roles: the lenses it is genuinely useful for (one or more; most items fit one or two).
- summary: one plain sentence, at most 25 words, in your own words. Say what happened or what the piece argues. Don't copy phrases from the excerpt, and don't add facts that aren't in the title or excerpt.
- why: one short sentence, at most 20 words, on why it matters in practice to someone in the item's roles. If it barely matters, say so plainly.`

/** Default enricher: one structured-output call to Claude Haiku 5.5 per batch. */
export function createClaudeEnricher(client = new Anthropic()): Enricher {
  return async (batch) => {
    const response = await client.messages.parse({
      model: LLM_MODEL,
      max_tokens: 8000,
      system: SYSTEM,
      output_config: { effort: 'low', format: zodOutputFormat(EnrichmentSchema) },
      messages: [{ role: 'user', content: JSON.stringify(batch) }],
    })
    if (response.stop_reason === 'refusal') throw new Error('LLM declined this batch (stop_reason: refusal)')
    if (response.stop_reason === 'max_tokens') throw new Error('LLM output was cut off (max_tokens)')
    return response.parsed_output?.items ?? []
  }
}

export interface EnrichOptions {
  /** Upper bound on items sent per run, newest and highest-scored first. */
  maxItems?: number
  batchSize?: number
  log?: (msg: string) => void
}

/**
 * Add an LLM summary and "why it matters" line to items that do not have one
 * yet. Items the keyword rules could not place (`unplaced`) also take the
 * LLM's roles. Any failure leaves the items exactly as they were.
 */
export async function enrichItems(items: Item[], unplaced: Set<string>, enricher: Enricher, opts: EnrichOptions = {}): Promise<Item[]> {
  const { maxItems = 60, batchSize = 20, log = console.log } = opts
  const todo = items
    .filter((i) => i.summaryBy !== 'llm')
    .sort((a, b) => b.score - a.score)
    .slice(0, maxItems)
  if (!todo.length) return items

  const byId = new Map(items.map((i) => [i.id, { ...i }]))
  let enriched = 0
  for (let start = 0; start < todo.length; start += batchSize) {
    const batch = todo.slice(start, start + batchSize).map((i) => ({
      id: i.id,
      title: i.title,
      source: i.sourceName,
      // Only a short excerpt is ever sent; article bodies are not stored or forwarded.
      excerpt: truncate(i.summary, 300),
    }))
    try {
      for (const out of await enricher(batch)) {
        const item = byId.get(out.id)
        if (!item) continue
        if (out.summary.trim()) {
          item.summary = truncate(out.summary.trim(), 220)
          item.summaryBy = 'llm'
        }
        if (out.why.trim()) item.whyItMatters = truncate(out.why.trim(), 160)
        if (unplaced.has(item.id) && out.roles.length) {
          item.roles = sortRoles(out.roles as Role[])
          item.tagMethod = 'llm'
        }
        enriched++
      }
    } catch (err) {
      log(`LLM batch ${start / batchSize + 1} skipped: ${(err as Error).message}`)
    }
  }
  log(`LLM enriched ${enriched} of ${todo.length} items`)
  return items.map((i) => byId.get(i.id)!)
}
