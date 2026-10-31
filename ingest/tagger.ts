import { ROLE_ORDER } from '../src/lib/roles'
import type { Area, Role } from '../src/types'

/**
 * Keyword rules per role. A match in the title places the item on its own;
 * matches in the excerpt need two different keywords, so one passing mention
 * of "test" in a long newsletter blurb does not make it a QA item.
 */
export const RULES: Record<Role, RegExp[]> = {
  claude: [
    /\bclaude\b/i,
    /\banthropic\b/i,
    /\b(opus|sonnet|haiku|fable|mythos) \d/i,
    /\bagent skills?\b/i,
    /\bclaude code\b/i,
  ],
  se: [
    /\bcoding agents?\b/i,
    /\bagentic coding\b/i,
    /\b(sdk|api|cli)s?\b/i,
    /\b(developer|engineer|engineering|programming|software)\b/i,
    /\b(typescript|javascript|python|rust|golang|compiler)\b/i,
    /\b(github|git|pull requests?|code review|refactor\w*)\b/i,
    /\b(ide|vs ?code|cursor|copilot|codex|opencode|gemini cli)\b/i,
    /\b(mcp|model context protocol|tool use|context window|inference|fine-?tun\w*)\b/i,
    /\b(swe-bench|terminal-bench|benchmark\w*)\b/i,
  ],
  pm: [
    /\bproduct (manag\w*|managers?|sense|strategy|discovery|leaders?)\b/i,
    /\bPMs?\b/, // case-sensitive: "3 pm" is a time, "PMs" are people
    /\b(prds?|roadmap\w*|okrs?|go-to-market|gtm|monetiz\w*|product[- ]market fit|pmf)\b/i,
    /\b(user research|customer (discovery|interviews?|feedback)|user interviews?|product analytics|retention|activation)\b/i,
    /\b(product launch\w*|product strategy|product teams?|product leaders?|roadmapping)\b/i,
    /\b(prototyp\w*|vibe coding|ai products?|ai-native products?)\b/i,
  ],
  qa: [
    /\b(qa|quality assurance|quality engineering|tester\w*|testing|test automation|test cases?)\b/i,
    /\b(cypress|playwright|selenium|webdriver(io)?|appium|puppeteer|testcafe|stagehand|vitest|jest|k6)\b/i,
    /\b(e2e|end-to-end|flaky|regression|unit tests?|test coverage)\b/i,
    /\b(evals?|evaluations?|llm-as-a?-judge|red[- ]?team\w*|promptfoo|deepeval)\b/i,
    /\b(self-healing|browser automation|accessibility|visual regression)\b/i,
    /\b(exploratory|test charters?|session-based|test design|test strategy|test plans?|usability testing|acceptance testing|uat)\b/i,
    /\bbugs?\b/i,
  ],
  fs: [
    /\b(full[- ]?stack|frontend|front-end|backend|back-end|web apps?|web development)\b/i,
    /\bReact\b/, // case-sensitive: "how agents react" is a verb
    /\b(next\.?js|vue|nuxt|svelte(kit)?|angular|astro|remix|vite|tailwind|css|html|web components?|design systems?|core web vitals|webgpu|browser apis?|generative ui|v0(?![.\d])|bolt\.new|lovable)\b/i,
    /\b(node\.?js|deno|bun|express|nestjs|fastify|graphql|grpc|rest apis?|api design|serverless|edge functions?|postgres(ql)?|sql|redis|kafka|microservices|kubernetes|docker)\b/i,
    /\b(ai sdk|vercel ai|langchain(\.?js)?|mastra|llamaindex|streaming ui|tool calling|structured outputs?|embeddings|vector (db|database|store)s?|pgvector|rag)\b/i,
  ],
}

/**
 * Facets inside a role, for the sub-toggles (QA: Manual & exploratory ·
 * Automation · Testing AI; Full-stack: Frontend · Backend). Same rule as roles: a title match, or two
 * different matched terms in the excerpt.
 */
export const AREA_RULES: Record<Area, { role: Role; pattern: RegExp }> = {
  manual: {
    role: 'qa',
    pattern:
      /\b(manual testing|exploratory( testing)?|test charters?|session-based|heuristics?|test design|test strategy|test plans?|bug reports?|usability testing|acceptance testing|uat|risk-based testing|test oracles?)\b/gi,
  },
  automation: {
    role: 'qa',
    pattern: /\b(cypress|playwright|selenium|webdriver(io)?|appium|puppeteer|testcafe|vitest|jest|k6|e2e|end-to-end|flaky|ci|test automation)\b/gi,
  },
  'ai-testing': {
    role: 'qa',
    pattern: /\b(evals?|llm-as-a?-judge|red[- ]?team\w*|promptfoo|deepeval|self-healing|agentic testing|test agents?|ai tests?|testing ai)\b/gi,
  },
  frontend: {
    role: 'fs',
    pattern:
      /\b(react|next\.?js|vue|nuxt|svelte(kit)?|angular|astro|remix|vite|tailwind|css|html|dom|web components?|frontend|front-end|ui components?|design systems?|accessibility|core web vitals|v0(?![.\d])|bolt\.new|lovable|generative ui|streaming ui|browser apis?|webgpu)\b/gi,
  },
  backend: {
    role: 'fs',
    pattern:
      /\b(node(\.?js)?|deno|bun|express|nestjs|fastify|backend|back-end|api design|rest apis?|graphql|grpc|serverless|edge functions?|databases?|postgres(ql)?|sql|redis|vector (db|database|store)s?|pgvector|rag|embeddings|queues?|kafka|microservices|kubernetes|docker|observability)\b/gi,
  },
}

const distinctMatches = (pattern: RegExp, text: string) => new Set((text.match(pattern) ?? []).map((m) => m.toLowerCase())).size

/** Areas for an item, only within roles it already has. `defaults` are the source's own areas. */
export function ruleAreas(title: string, excerpt: string, roles: Role[], defaults: Area[] = []): Area[] {
  return (Object.keys(AREA_RULES) as Area[]).filter((area) => {
    const { role, pattern } = AREA_RULES[area]
    if (!roles.includes(role)) return false
    return defaults.includes(area) || distinctMatches(pattern, title) > 0 || distinctMatches(pattern, excerpt) >= 2
  })
}

export function ruleRoles(title: string, excerpt = ''): Role[] {
  const roles: Role[] = []
  for (const role of ROLE_ORDER) {
    const rules = RULES[role]
    const inTitle = rules.some((r) => r.test(title))
    const inExcerpt = rules.filter((r) => r.test(excerpt)).length
    if (inTitle || inExcerpt >= 2) roles.push(role)
  }
  return roles
}

export function sortRoles(roles: Iterable<Role>): Role[] {
  const set = new Set(roles)
  return ROLE_ORDER.filter((r) => set.has(r))
}
