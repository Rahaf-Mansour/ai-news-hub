// Hand-curated learning tracks. Every link was checked to respond on
// 2026-10-31. Steps are in the order to do them.

export interface LearnStep {
  id: string
  title: string
  url: string
  source: string
  minutes: number
  why: string
  note?: string
}

export interface LearnTrack {
  id: string
  name: string
  for: string
  outcome: string
  steps: LearnStep[]
}

export const TRACKS: LearnTrack[] = [
  {
    id: 'producer',
    name: 'AI-enabled Producer',
    for: 'For a Producer or PM who wants to use Claude in day-to-day product work.',
    outcome: 'You can write prompts that hold up, run PM workflows as Claude skills, and judge an AI feature with evals.',
    steps: [
      {
        id: 'producer-prompting',
        title: 'Prompt engineering interactive tutorial',
        url: 'https://github.com/anthropics/prompt-eng-interactive-tutorial',
        source: 'Anthropic',
        minutes: 240,
        why: 'Nine short chapters with exercises. The foundation for everything after it.',
      },
      {
        id: 'producer-claude-code',
        title: 'Best practices for Claude Code',
        url: 'https://code.claude.com/docs/en/best-practices',
        source: 'Claude Code docs',
        minutes: 30,
        why: 'The core rule: keep each task and its context small. It applies to any Claude workflow, not only code.',
      },
      {
        id: 'producer-trends',
        title: '2026 Agentic Coding Trends Report',
        url: 'https://resources.anthropic.com/2026-agentic-coding-trends-report',
        source: 'Anthropic',
        minutes: 45,
        why: 'What engineering teams actually delegate to agents. Useful context for planning and estimates.',
      },
      {
        id: 'producer-pm-skills',
        title: 'PM skills for Claude (PRDs, discovery, OKRs, launch)',
        url: 'https://github.com/phuryn/pm-skills',
        source: 'phuryn/pm-skills',
        minutes: 60,
        why: 'Install two or three skills and run them on a real feature brief to see where they help and where they need your judgment.',
      },
      {
        id: 'producer-pm-coach',
        title: 'Product Manager Skills (coaching on the frameworks)',
        url: 'https://github.com/deanpeters/Product-Manager-Skills',
        source: 'deanpeters/Product-Manager-Skills',
        minutes: 60,
        why: 'Skills that explain the framework while doing the work. Good for learning, not only output.',
        note: 'CC BY-NC-SA 4.0: personal learning is fine; check before using it in paid work.',
      },
      {
        id: 'producer-agents',
        title: 'AI agents for product managers',
        url: 'https://www.news.aakashg.com/p/ai-agents-pms',
        source: 'Product Growth (Aakash Gupta)',
        minutes: 25,
        why: 'A framework for which agents a PM should use and which to build.',
        note: 'Partly paywalled.',
      },
      {
        id: 'producer-evals',
        title: 'Demystifying evals for AI agents',
        url: 'https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents',
        source: 'Anthropic Engineering',
        minutes: 30,
        why: 'How to tell whether an AI feature works. The acceptance criteria of AI products.',
      },
    ],
  },
  {
    id: 'qa',
    name: 'QA to AI testing',
    for: 'For a Cypress-strong QA engineer moving into AI-assisted testing and testing AI features.',
    outcome: 'You can use AI inside Cypress, drive a browser from an agent, and write evals for LLM features.',
    steps: [
      {
        id: 'qa-cypress-ai',
        title: 'AI in Cypress overview',
        url: 'https://docs.cypress.io/app/ai/overview',
        source: 'Cypress docs',
        minutes: 20,
        why: 'The map: AI that writes tests (Studio, cy.prompt) versus agents that use Cypress context (skills, Cloud MCP).',
      },
      {
        id: 'qa-cy-prompt',
        title: 'cy.prompt: write Cypress tests in plain English',
        url: 'https://www.cypress.io/blog/write-cypress-tests-in-plain-english-ai-powered-test-automation-is-now-in-beta',
        source: 'Cypress blog',
        minutes: 15,
        why: 'Natural-language steps compile to real Cypress commands you can read and export. Try it on one existing spec.',
      },
      {
        id: 'qa-cloud-mcp',
        title: 'Cypress AI features and Cloud MCP',
        url: 'https://docs.cypress.io/cloud/features/cypress-ai-features',
        source: 'Cypress docs',
        minutes: 20,
        why: 'Lets Claude Code read your Cypress Cloud runs, so it can triage a flaky test with real data.',
      },
      {
        id: 'qa-playwright-mcp',
        title: 'Playwright MCP and Playwright CLI',
        url: 'https://github.com/microsoft/playwright-mcp',
        source: 'Microsoft',
        minutes: 45,
        why: 'The standard way to give an agent a browser. Compare it with playwright-cli, which uses far fewer tokens.',
      },
      {
        id: 'qa-stagehand',
        title: 'Stagehand: act, extract, observe in TypeScript',
        url: 'https://github.com/browserbase/stagehand',
        source: 'Browserbase',
        minutes: 45,
        why: 'AI browser steps in TypeScript. Closest to how you already think in Cypress.',
      },
      {
        id: 'qa-evals',
        title: 'Demystifying evals for AI agents',
        url: 'https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents',
        source: 'Anthropic Engineering',
        minutes: 30,
        why: 'Testing AI behaviour, not just testing with AI. This is where QA skills transfer most.',
      },
      {
        id: 'qa-promptfoo',
        title: 'promptfoo: evals and red-teaming for LLM apps',
        url: 'https://github.com/promptfoo/promptfoo',
        source: 'promptfoo',
        minutes: 60,
        why: 'YAML test cases for prompts and LLM features. Write one suite for a feature your team ships.',
      },
      {
        id: 'qa-landscape',
        title: 'Awesome AI testing',
        url: 'https://github.com/tugkanboz/awesome-ai-testing',
        source: 'tugkanboz/awesome-ai-testing',
        minutes: 30,
        why: 'A map of the tools by category: self-healing, NL authoring, LLM-as-judge, visual AI.',
      },
      {
        id: 'qa-state',
        title: 'State of AI in Software Testing 2026',
        url: 'https://www.browserstack.com/state-of-art-software-testing-report',
        source: 'BrowserStack',
        minutes: 20,
        why: 'Most teams use AI in testing, few have reached autonomy. Good framing for your own roadmap.',
      },
    ],
  },
]
