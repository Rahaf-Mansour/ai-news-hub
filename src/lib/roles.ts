import type { Role, TrustTier } from '../types'

/** Display and grouping order: Claude first, then the reader's QA and PM lenses, then SE. */
export const ROLE_ORDER: Role[] = ['claude', 'qa', 'pm', 'se']

export const ROLE_LABEL: Record<Role, string> = {
  claude: 'Claude',
  se: 'SE',
  pm: 'PM',
  qa: 'QA',
}

export const ROLE_NAME: Record<Role, string> = {
  claude: 'Claude',
  se: 'Software engineering',
  pm: 'Product management',
  qa: 'QA and testing',
}

export const TIER_LABEL: Record<TrustTier, string> = {
  official: 'Official',
  editorial: 'Editorial',
  community: 'Community',
}

export const TIER_HELP: Record<TrustTier, string> = {
  official: 'Published by the vendor or maintainer about its own product',
  editorial: 'A named author or publication with an editorial track record',
  community: 'Ranked by community votes (Hacker News)',
}

export function primaryRole(roles: Role[]): Role {
  return ROLE_ORDER.find((r) => roles.includes(r)) ?? 'se'
}
