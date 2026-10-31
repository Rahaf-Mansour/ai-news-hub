import type { Role } from '../src/types'

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
    /\b(prd|roadmap\w*|okrs?|go-to-market|gtm|pricing|monetiz\w*)\b/i,
    /\b(user research|customer\w*|interviews?|adoption|retention|activation|growth)\b/i,
    /\b(launch\w*|strategy|startup\w*|founders?|enterprise\w*|business)\b/i,
    /\b(prototyp\w*|vibe coding|ai product)\b/i,
  ],
  qa: [
    /\b(qa|quality assurance|tester\w*|testing|test automation|test cases?)\b/i,
    /\b(cypress|playwright|selenium|webdriver|puppeteer|stagehand)\b/i,
    /\b(e2e|end-to-end|flaky|regression|unit tests?|test coverage)\b/i,
    /\b(evals?|evaluations?|llm-as-a?-judge|red[- ]?team\w*|promptfoo|deepeval)\b/i,
    /\b(self-healing|browser automation|accessibility|visual regression)\b/i,
    /\bbugs?\b/i,
  ],
}

export const ROLE_ORDER: Role[] = ['claude', 'qa', 'pm', 'se']

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
