describe('Read and bookmark state', () => {
  it('starts with every item unread', () => {
    cy.visitHub()
    cy.get('[data-cy=unread-total]').should('contain', '10')
    cy.get('[data-cy=tab-count-all]').should('have.text', '10')
  })

  it('marks an item read, updates the unread counts, and keeps it after a reload', () => {
    cy.visitHub()
    cy.feed().find('[data-id=fx-lenny] [data-cy=toggle-read]').click().should('have.attr', 'aria-pressed', 'true')
    cy.feed().find('[data-id=fx-lenny]').should('have.attr', 'data-read', 'true')
    cy.get('[data-cy=unread-total]').should('contain', '9')
    cy.get('[data-cy=tab-count-pm]').should('have.text', '1')

    cy.reload()
    cy.get('[data-cy=unread-total]').should('contain', '9')
    cy.feed().find('[data-id=fx-lenny]').should('have.attr', 'data-read', 'true')

    cy.feed().find('[data-id=fx-lenny] [data-cy=toggle-read]').click()
    cy.get('[data-cy=unread-total]').should('contain', '10')
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

  it('shows only unread items with the Unread filter, and marks everything shown as read', () => {
    cy.visitHub({ storage: { 'hub:read': JSON.stringify(['fx-haiku', 'fx-old']) } })
    cy.get('[data-cy=show-unread]').click()
    cy.feed().find('[data-cy=item]').should('have.length', 8)
    cy.get('[data-cy=tab-qa]').click()
    cy.get('[data-cy=mark-all-read]').click()
    cy.get('[data-cy=tab-count-qa]').should('have.text', '0')
    cy.get('[data-cy=no-results]').should('be.visible')
  })

  it('bookmarks an item, filters to saved items, and keeps bookmarks after a reload', () => {
    cy.visitHub()
    cy.feed().find('[data-id=fx-playwright] [data-cy=toggle-save]').click().should('have.attr', 'aria-pressed', 'true')
    cy.get('[data-cy=show-saved]').click()
    cy.feed().find('[data-cy=item]').should('have.length', 1).and('contain', 'Playwright v1.60.0')
    cy.reload()
    cy.get('[data-cy=show-saved]').click()
    cy.feed().find('[data-cy=item]').should('have.length', 1)
  })

  it('marks items first seen since the last visit with a "+"', () => {
    cy.visitHub({ lastVisit: '2026-10-30T12:00:00.000Z' })
    cy.get('[data-cy=run-summary]').should('contain', '+5 new since your last visit')
    cy.feed().find('[data-id=fx-simon] .item__gutter').should('have.text', '+')
    cy.feed().find('[data-id=fx-old] .item__gutter').should('have.text', '')
  })
})
