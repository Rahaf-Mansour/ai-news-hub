// Shared data contracts between the ingest pipeline (Node) and the site (browser).

export type Role = 'claude' | 'se' | 'pm' | 'qa'
export const ROLES: readonly Role[] = ['claude', 'se', 'pm', 'qa'] as const

export type SourceType = 'news' | 'release' | 'article' | 'repo'

/**
 * official  – the vendor or maintainer writing about its own product.
 * editorial – a named author or publication with an editorial track record.
 * community – ranked by votes (Hacker News).
 */
export type TrustTier = 'official' | 'editorial' | 'community'

export type FetchKind =
  | 'rss'
  | 'github-releases'
  | 'anthropic-cards'
  | 'claude-release-notes'
  | 'hn'

export interface SourceConfig {
  id: string
  name: string
  /** Human-facing home page of the source. */
  url: string
  /** The URL the pipeline actually fetches. */
  feedUrl: string
  type: SourceType
  /** Roles every item from this source gets (a focused source such as the Cypress blog). */
  roles: Role[]
  /**
   * For general sources (newsletters covering everything): roles to use only
   * when neither the keyword rules nor the LLM could place an item.
   */
  fallbackRoles?: Role[]
  tier: TrustTier
  kind: FetchKind
  /** Keep at most this many of the newest entries per run. */
  maxItems?: number
  /** For 'anthropic-cards': only links whose path matches this pattern. */
  hrefPattern?: string
  /** For 'hn': Algolia query and point threshold. */
  hn?: { query: string; minPoints: number }
  /** For 'github-releases': drop titles matching this pattern, in addition to pre-release/nightly tags (always skipped). */
  skipTitlePattern?: string
  /** Keep only items whose title matches this pattern (case-insensitive). Used to keep HN searches on topic. */
  titleFilter?: string
}

/** What an adapter returns before normalising, dedupe and tagging. */
export interface RawItem {
  title: string
  url: string
  publishedAt: string | null
  excerpt?: string
  discussionUrl?: string
}

/** Sub-areas used for the facet toggles: QA (manual / automation / testing AI) and, later, full-stack. */
export type Area = 'manual' | 'automation' | 'ai-testing' | 'frontend' | 'backend'

export interface Item {
  id: string
  title: string
  url: string
  sourceId: string
  sourceName: string
  tier: TrustTier
  type: SourceType
  publishedAt: string
  firstSeenAt: string
  roles: Role[]
  /** Facets inside a role (keyword rules). Absent on items from before this field existed. */
  areas?: Area[]
  /** How the roles were assigned: keyword rules, the source's defaults, or the LLM. */
  tagMethod: 'rules' | 'source' | 'llm'
  summary: string
  summaryBy: 'feed' | 'llm'
  /** One line on why this matters to the reader; only present when the LLM is enabled. */
  whyItMatters?: string
  discussionUrl?: string
  score: number
}

export interface ItemsFile {
  generatedAt: string
  llmEnabled: boolean
  windowDays: number
  items: Item[]
}

export interface SourceStatus {
  id: string
  name: string
  url: string
  tier: TrustTier
  type: SourceType
  ok: boolean
  lastFetched: string
  lastSuccess: string | null
  count: number
  error?: string
}

export interface SourcesStatusFile {
  generatedAt: string
  sources: SourceStatus[]
}

export interface RepoConfig {
  fullName: string
  why: string
  roles: Role[]
  note?: string
}

export interface Repo extends RepoConfig {
  url: string
  stars: number | null
  lastCommit: string | null
  archived: boolean | null
  license: string | null
  verifiedAt: string | null
}

export interface ReposFile {
  generatedAt: string
  repos: Repo[]
}
