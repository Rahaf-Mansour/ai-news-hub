describe('Navigation and page structure', () => {
  it('shows the masthead run summary and last-updated time', () => {
    cy.visitHub()
    cy.get('[data-cy=run-summary]').should('contain', '2 sources passed').and('contain', '1 failed')
    cy.get('[data-cy=last-updated]').should('have.attr', 'datetime', '2026-10-31T05:30:00.000Z')
  })

  it('shows 8 Today items from the last 48 hours, led by the top story and grouped by role', () => {
    cy.visitHub()
    cy.get('[data-cy=today-window]').should('have.text', '8 that matter from the last 48 hours')
    cy.get('[data-cy=today] [data-cy=item]').should('have.length', 8)
    cy.get('[data-cy=today] .lead').should('contain', 'Introducing Claude Haiku 5.5')
    cy.get('[data-cy=today-group-claude]').should('exist')
    cy.get('[data-cy=today-group-qa] [data-cy=item]').should('have.length', 3)
    cy.get('[data-cy=today]').should('not.contain', 'An older engineering essay')
  })

  it('shows source, trust tier, date, summary, roles and the why-it-matters line on each item', () => {
    cy.visitHub()
    cy.get('[data-cy=today] .lead').within(() => {
      cy.contains('Anthropic News')
      cy.get('[data-cy=tier]').should('have.text', 'Official')
      cy.get('time').should('have.attr', 'datetime', '2026-10-31T04:00:00.000Z')
      cy.get('[data-cy=item-summary]').should('contain', 'sub-agents')
      cy.get('[data-cy=role-chip]').should('have.text', 'Claude')
      cy.get('[data-cy=item-why]').should('contain', 'summary step')
      cy.get('[data-cy=item-link]')
        .should('have.attr', 'href', 'https://example.com/fixture/haiku')
        .and('have.attr', 'target', '_blank')
        .and('have.attr', 'rel', 'noopener noreferrer')
    })
  })

  it('hides "Why it matters" lines when the LLM step did not run', () => {
    cy.fixture('items.json').then((items) => {
      cy.visitHub({ itemsBody: { ...items, llmEnabled: false } })
    })
    cy.get('[data-cy=item-summary]').should('exist')
    cy.get('[data-cy=item-why]').should('not.exist')
  })

  it('reopens the last tab when the address has no hash', () => {
    cy.visitHub()
    cy.get('[data-cy=tab-pm]').click()
    cy.visitHub()
    cy.get('[data-cy=tab-pm]').should('have.attr', 'aria-current', 'page')
    // A hash in the address still wins over the remembered tab.
    cy.window().then((win) => {
      win.location.hash = 'qa'
    })
    cy.reload()
    cy.get('[data-cy=tab-qa]').should('have.attr', 'aria-current', 'page')
  })

  it('switches tabs, updates the URL hash and filters the feed by role', () => {
    cy.visitHub()
    cy.feed().find('[data-cy=item]').should('have.length', 13)

    const expected: Record<string, number> = { claude: 2, fs: 2, se: 6, pm: 2, qa: 4 }
    for (const [tab, count] of Object.entries(expected)) {
      cy.get(`[data-cy=tab-${tab}]`).click()
      cy.location('hash').should('eq', `#${tab}`)
      cy.get(`[data-cy=tab-${tab}]`).should('have.attr', 'aria-current', 'page')
      cy.feed().find('[data-cy=item]').should('have.length', count)
      cy.get(`[data-cy=tab-count-${tab}]`).should('have.text', String(count))
    }
  })

  it('shows Today only on the All tab; other tabs start with their own section', () => {
    cy.visitHub()
    cy.get('[data-cy=today]').should('be.visible')
    for (const tab of ['claude', 'fs', 'qa', 'repos', 'learn']) {
      cy.get(`[data-cy=tab-${tab}]`).click()
      cy.get('[data-cy=today]').should('not.exist')
      cy.get(`[data-cy=panel-${tab}]`).should('be.visible')
    }
    cy.get('[data-cy=tab-all]').click()
    cy.get('[data-cy=today]').should('be.visible')
  })

  it('opens the tab named in the hash on load, and shows the Claude timeline there', () => {
    cy.visitHub({ hash: 'claude' })
    cy.get('[data-cy=tab-claude]').should('have.attr', 'aria-current', 'page')
    cy.get('[data-cy=claude-timeline]').should('contain', 'Claude Haiku 5.5').and('contain', 'Claude Security public beta')
  })

  it('shows repos with verified stars, "not verified" when unknown, and an archived flag', () => {
    cy.visitHub({ hash: 'repos' })
    cy.get('[data-cy=repos-verified]').should('contain', '2 of 3 verified')
    cy.get('[data-repo="anthropics/claude-code"] [data-cy=repo-stars]').should('have.text', '≈154k')
    cy.get('[data-repo="microsoft/playwright-mcp"] [data-cy=repo-stars]').should('have.text', 'not verified')
    cy.get('[data-repo="anthropics/courses"]').should('contain', 'Archived')
    cy.get('[data-cy=repos-role-qa]').click()
    cy.get('[data-cy=repo-row]').should('have.length', 1)
  })

  it('tracks learning progress and keeps it after a reload', () => {
    cy.visitHub({ hash: 'learn' })
    cy.get('[data-cy=track-pick-qa]').click()
    cy.get('[data-cy=track-qa] [data-cy=track-progress]').should('have.text', '0 of 18 done')
    cy.get('#step-qa-cypress-ai').check()
    cy.get('[data-cy=track-pick-qa]').should('contain', '1/18')
    cy.reload()
    cy.get('[data-cy=track-qa] [data-cy=track-progress]').should('have.text', '1 of 18 done')
  })

  it('links out to the three model leaderboards and lists per-source fetch status', () => {
    cy.visitHub()
    cy.get('[data-cy=model-watch] a').should('have.length', 3).each(($a) => expect($a).to.have.attr('target', '_blank'))
    cy.get('[data-cy=run-log]').should('have.attr', 'open')
    cy.get('[data-cy=run-log] [data-cy=source-row]').should('have.length', 3)
    cy.get('[data-cy=run-log]').should('contain', '2/3 fetched')
  })

  it('explains the problem when the feed cannot load', () => {
    cy.visitHub({ itemsFixture: null })
    cy.get('[data-cy=load-error]').should('contain', 'could not load')
  })
})
