// The site is tested against fixed fixture data and a fixed clock, so the
// results never depend on what the live feeds published today.

export const NOW = new Date('2026-10-31T08:00:00Z')

interface HubVisitOptions {
  hash?: string
  lastVisit?: string
  storage?: Record<string, string>
  itemsFixture?: string | null
  /** Serve this body for items.json instead of a fixture file. */
  itemsBody?: unknown
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Stub the three data files, freeze Date, seed localStorage, and open the hub. */
      visitHub(options?: HubVisitOptions): Chainable<void>
      /** The main feed (below the section tabs), as opposed to Today. */
      feed(): Chainable<JQuery<HTMLElement>>
    }
  }
}

Cypress.Commands.add('visitHub', (options: HubVisitOptions = {}) => {
  if (options.itemsBody) {
    cy.intercept('GET', '**/data/items.json', { body: options.itemsBody }).as('items')
  } else if (options.itemsFixture === null) {
    cy.intercept('GET', '**/data/items.json', { statusCode: 404, body: 'Not found' }).as('items')
  } else {
    cy.intercept('GET', '**/data/items.json', { fixture: options.itemsFixture ?? 'items.json' }).as('items')
  }
  cy.intercept('GET', '**/data/repos.json', { fixture: 'repos.json' }).as('repos')
  cy.intercept('GET', '**/data/sources-status.json', { fixture: 'sources-status.json' }).as('status')
  cy.clock(NOW, ['Date'])
  cy.visit(`/${options.hash ? `#${options.hash}` : ''}`, {
    onBeforeLoad(win) {
      if (options.lastVisit) win.localStorage.setItem('hub:lastVisit', options.lastVisit)
      for (const [k, v] of Object.entries(options.storage ?? {})) win.localStorage.setItem(k, v)
    },
  })
  cy.wait('@items')
})

Cypress.Commands.add('feed', () => cy.get('[data-cy=feed]'))

export {}
