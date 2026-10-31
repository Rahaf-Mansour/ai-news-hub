describe('Read and bookmark state', () => {
  it('starts with every item unread', () => {
    cy.visitHub()
    cy.get('[data-cy=unread-total]').should('contain', '13')
    cy.get('[data-cy=tab-count-all]').should('have.text', '13')
  })

  it('marks an item read, updates the unread counts, and keeps it after a reload', () => {
    cy.visitHub()
    cy.feed().find('[data-id=fx-lenny] [data-cy=toggle-read]').click().should('have.attr', 'aria-pressed', 'true')
    cy.feed().find('[data-id=fx-lenny]').should('have.attr', 'data-read', 'true')
    cy.get('[data-cy=unread-total]').should('contain', '12')
    cy.get('[data-cy=tab-count-pm]').should('have.text', '1')

    cy.reload()
    cy.get('[data-cy=unread-total]').should('contain', '12')
    cy.feed().find('[data-id=fx-lenny]').should('have.attr', 'data-read', 'true')

    cy.feed().find('[data-id=fx-lenny] [data-cy=toggle-read]').click()
    cy.get('[data-cy=unread-total]').should('contain', '13')
  })

  it('marks an item read when its link is opened', () => {
    cy.visitHub()
    // Keep the test on this page: the link opens a new tab in real use.
    cy.feed()
      .find('[data-id=fx-simon] [data-cy=item-link]')
      .then(($a) => $a.on('click', (e) => e.preventDefault()))
      .click()
    cy.feed().find('[data-id=fx-simon]').should('have.attr', 'data-read', 'true')
  })

  it('reads the same state in Today and the feed', () => {
    cy.visitHub()
    cy.get('[data-cy=today] [data-id=fx-cyprompt] [data-cy=toggle-read]').click()
    cy.feed().find('[data-id=fx-cyprompt]').should('have.attr', 'data-read', 'true')
  })

  it('shows a Read pill and a tooltip that explains Mark read', () => {
    cy.visitHub()
    cy.feed().find('[data-id=fx-lenny] [data-cy=toggle-read]')
      .should('have.attr', 'title', 'Marks this as read and removes it from the unread counts')
      .click()
    cy.feed().find('[data-id=fx-lenny] [data-cy=read-pill]').should('have.text', 'Read')
  })

  it('hides read items with "Hide read", and marks everything shown as read', () => {
    cy.visitHub({ storage: { 'hub:read': JSON.stringify(['fx-haiku', 'fx-old']) } })
    cy.get('[data-cy=hide-read]').check({ force: true })
    cy.feed().find('[data-cy=item]').should('have.length', 11)
    cy.get('[data-cy=tab-qa]').click()
    cy.get('[data-cy=mark-all-read]').click()
    cy.get('[data-cy=tab-count-qa]').should('have.text', '0')
    cy.get('[data-cy=no-results]').should('be.visible')
  })

  it('saves an item, shows a toast with a View link, and lists it in the Saved tab after a reload', () => {
    cy.visitHub()
    cy.feed().find('[data-id=fx-playwright] [data-cy=toggle-save]').click().should('have.attr', 'aria-pressed', 'true')
    cy.get('[data-cy=toast]').should('contain', 'Saved')
    cy.get('[data-cy=tab-count-saved]').should('have.text', '1')
    cy.get('[data-cy=stat-saved]').should('contain', '1')
    cy.get('[data-cy=toast-view]').click()
    cy.location('hash').should('eq', '#saved')
    cy.get('[data-cy=saved-items] [data-cy=item]').should('have.length', 1).and('contain', 'Playwright v1.60.0')
    cy.reload()
    cy.get('[data-cy=saved-items] [data-cy=item]').should('have.length', 1)
  })

  it('hides the toast by itself after a few seconds', () => {
    cy.visitHub()
    cy.feed().find('[data-id=fx-lenny] [data-cy=toggle-save]').click()
    cy.get('[data-cy=toast]').should('be.visible')
    cy.get('[data-cy=toast]', { timeout: 6000 }).should('not.exist')
  })

  it('keeps "Saved only" as a feed filter', () => {
    cy.visitHub()
    cy.feed().find('[data-id=fx-playwright] [data-cy=toggle-save]').click()
    cy.get('[data-cy=saved-only]').click().should('have.attr', 'aria-pressed', 'true')
    cy.feed().find('[data-cy=item]').should('have.length', 1).and('contain', 'Playwright v1.60.0')
  })

  it('saves repos and learning steps too, grouped in the Saved tab', () => {
    cy.visitHub({ hash: 'repos' })
    cy.get('[data-repo="anthropics/claude-code"] [data-cy=repo-save]').click().should('have.attr', 'aria-pressed', 'true')
    cy.get('[data-cy=tab-learn]').click()
    cy.get('[data-cy=step-save]').first().click().should('have.attr', 'aria-pressed', 'true')
    cy.get('[data-cy=tab-saved]').click()
    cy.get('[data-cy=saved-repos]').should('contain', 'anthropics/claude-code')
    cy.get('[data-cy=saved-steps] li').should('have.length', 1)
    cy.get('[data-cy=tab-count-saved]').should('have.text', '2')
  })

  it('keeps a saved item after it leaves the feed, and migrates the old saved format', () => {
    // Old format: an array of ids. fx-lenny is in today's data, so it migrates with its snapshot.
    cy.visitHub({ storage: { 'hub:saved': JSON.stringify(['fx-lenny']) } })
    cy.get('[data-cy=tab-count-saved]').should('have.text', '1')
    cy.window().then((win) => expect(win.localStorage.getItem('hub:saved')).to.be.null)
    // Next day the item is gone from items.json, but the Saved tab still shows it.
    cy.fixture('items.json').then((items) => {
      cy.intercept('GET', '**/data/items.json', { body: { ...items, items: items.items.filter((i: { id: string }) => i.id !== 'fx-lenny') } }).as('itemsLater')
    })
    cy.reload()
    cy.wait('@itemsLater')
    cy.feed().find('[data-id=fx-lenny]').should('not.exist')
    cy.get('[data-cy=tab-saved]').click()
    cy.get('[data-cy=saved-items] [data-cy=item]').should('have.length', 1).and('contain', 'Building AI product sense')
  })

  it('copies saved links as Markdown and clears everything after confirming', () => {
    cy.visitHub()
    cy.feed().find('[data-id=fx-haiku] [data-cy=toggle-save]').click()
    cy.get('[data-cy=tab-saved]').click()
    cy.window().then((win) => cy.stub(win.navigator.clipboard, 'writeText').as('copy').resolves())
    cy.get('[data-cy=copy-links]').click()
    cy.get('@copy').should('have.been.calledOnce').its('firstCall.args.0').should('contain', '- [Introducing Claude Haiku 5.5](https://example.com/fixture/haiku)')
    cy.get('[data-cy=toast]').should('contain', 'Copied 1 links')

    cy.get('[data-cy=clear-saved]').click()
    cy.get('[data-cy=clear-no]').click()
    cy.get('[data-cy=saved-items]').should('exist')
    cy.get('[data-cy=clear-saved]').click()
    cy.get('[data-cy=clear-yes]').click()
    cy.get('[data-cy=saved-empty]').should('contain', 'Nothing saved yet')
    cy.get('[data-cy=tab-count-saved]').should('have.text', '0')
  })

  it('marks items first seen since the last visit with a "+"', () => {
    cy.visitHub({ lastVisit: '2026-10-30T12:00:00.000Z' })
    cy.get('[data-cy=run-summary]').should('contain', '+6 new since your last visit')
    cy.feed().find('[data-id=fx-simon] .item__gutter').should('have.text', '+')
    cy.feed().find('[data-id=fx-old] .item__gutter').should('have.text', '')
  })
})
