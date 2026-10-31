import type { RepoConfig } from '../src/types'

// "why" lines are written for this hub (adapted from the 2026-10-31 landscape
// survey). Stars, last commit, license and archived state come from the GitHub
// API at build time; nothing numeric is hard-coded here.
export const REPOS: RepoConfig[] = [
  // Claude
  { fullName: 'anthropics/claude-code', roles: ['claude', 'se'], why: 'Watch the CHANGELOG and issues: the fastest signal of Claude Code feature changes.' },
  { fullName: 'anthropics/skills', roles: ['claude', 'se', 'pm'], why: 'Official Agent Skills, including docx/pdf/pptx/xlsx: the template for writing your own.' },
  { fullName: 'anthropics/claude-cookbooks', roles: ['claude', 'se'], why: 'Official notebooks for tool use, caching, sub-agents, skills and memory.' },
  { fullName: 'anthropics/claude-code-action', roles: ['claude', 'se', 'qa'], why: 'Official GitHub Action: mention @claude on a PR or issue for reviews and fixes.' },
  { fullName: 'anthropics/prompt-eng-interactive-tutorial', roles: ['claude', 'pm', 'qa'], why: 'Hands-on prompt engineering course from Anthropic; a good first week.' },
  { fullName: 'anthropics/courses', roles: ['claude', 'se'], why: 'API fundamentals through prompt evaluation. Still useful as reference.' },
  { fullName: 'hesreallyhim/awesome-claude-code', roles: ['claude', 'se'], why: 'The main Claude Code resource list: skills, hooks, agents and tooling.' },
  { fullName: 'dair-ai/Prompt-Engineering-Guide', roles: ['se', 'pm', 'qa'], why: 'Neutral encyclopedia of prompting, context engineering, RAG and agents.' },

  // QA and testing
  { fullName: 'microsoft/playwright-mcp', roles: ['qa', 'se'], why: 'De facto way to give an agent a browser through the accessibility tree, not screenshots.' },
  { fullName: 'microsoft/playwright-cli', roles: ['qa', 'se'], why: 'Microsoft now recommends it over MCP for coding agents: far fewer tokens per session.' },
  { fullName: 'browserbase/stagehand', roles: ['qa'], why: 'TypeScript act() / extract() / observe() on a CDP driver; closest to a Cypress mindset.' },
  { fullName: 'browser-use/browser-use', roles: ['qa'], why: 'Most-starred AI browser agent (Python). An autonomous loop, not deterministic tests.' },
  { fullName: 'promptfoo/promptfoo', roles: ['qa', 'se'], why: 'YAML evals and red-teaming for LLM features: QA for the AI you ship.' },
  { fullName: 'confident-ai/deepeval', roles: ['qa'], why: 'pytest-style LLM evaluation with 50+ metrics; compare with promptfoo.' },
  { fullName: 'qodo-ai/qodo-cover', roles: ['qa', 'se'], why: 'AI unit-test generation aimed at raising coverage in CI.', note: 'AGPL-3.0 license' },
  { fullName: 'tugkanboz/awesome-ai-testing', roles: ['qa'], why: 'Best map of AI testing tools: NL authoring, self-healing, LLM-as-judge, visual AI.' },

  // Full-stack: AI features in web apps
  { fullName: 'vercel/ai', roles: ['fs', 'se'], why: 'The AI SDK: streaming, tool calling and structured output in TypeScript, with React hooks for the UI.' },
  { fullName: 'mastra-ai/mastra', roles: ['fs', 'se'], why: 'TypeScript framework for agents, workflows, RAG and evals that fits next to a Node backend.' },
  { fullName: 'langchain-ai/langchainjs', roles: ['fs', 'se'], why: 'LangChain for JS/TS: many integrations; compare its abstractions with the AI SDK before choosing.' },
  { fullName: 'modelcontextprotocol/typescript-sdk', roles: ['fs', 'se', 'claude'], why: 'Official SDK for writing MCP servers and clients in TypeScript, e.g. to expose your API to Claude.' },
  { fullName: 'pgvector/pgvector', roles: ['fs'], why: 'Vector search inside Postgres: RAG without adding a separate vector database.' },

  // Product management
  { fullName: 'phuryn/pm-skills', roles: ['pm'], why: '65+ PM skills and chained workflows (PRDs, discovery, OKRs, launch) as Claude plugins.' },
  { fullName: 'deanpeters/Product-Manager-Skills', roles: ['pm'], why: 'Skills that do PM work and coach you on the frameworks behind it.', note: 'CC BY-NC-SA 4.0: non-commercial use only' },
  { fullName: 'dend/awesome-product-management', roles: ['pm'], why: 'Solid general PM reading list to pair with the AI-specific ones.' },

  // Software engineering agents
  { fullName: 'The-PR-Agent/pr-agent', roles: ['se', 'qa'], why: 'Open-source AI PR reviewer for GitHub, GitLab, Bitbucket and Azure DevOps.' },
  { fullName: 'anomalyco/opencode', roles: ['se'], why: 'Most-starred open terminal agent; model-agnostic, a reference for multi-provider design.' },
  { fullName: 'openai/codex', roles: ['se'], why: "OpenAI's terminal agent; its sandboxing approach is worth comparing." },
  { fullName: 'google-gemini/gemini-cli', roles: ['se'], why: 'Free tier makes it easy to compare against Claude Code.' },
  { fullName: 'cline/cline', roles: ['se'], why: 'VS Code-native agent that asks permission at each step.' },
  { fullName: 'Aider-AI/aider', roles: ['se'], why: 'Best git hygiene: every AI change is its own reviewable commit.' },
  { fullName: 'OpenHands/OpenHands', roles: ['se', 'qa'], why: 'Autonomous issue-to-PR agent in a Docker sandbox: the "agent in CI" pattern.' },
  { fullName: 'Thysrael/Horizon', roles: ['se'], why: 'The open-source news pipeline that inspired this hub (fetch, dedupe, LLM score).' },
]
