describe('Search and filters', () => {
  beforeEach(() => cy.visitHub())

  it('searches titles and summaries as you type', () => {
    cy.get('[data-cy=search]').type('self-healing')
    cy.feed().find('[data-cy=item]').should('have.length', 1).and('contain', 'cy.prompt adds self-healing selectors')
    cy.get('[data-cy=result-count]').should('have.text', '1 of 10 items')

    cy.get('[data-cy=search]').clear().type('prompt')
    cy.feed().find('[data-cy=item]').should('have.length', 2)

    cy.get('[data-cy=search]').clear()
    cy.feed().find('[data-cy=item]').should('have.length', 10)
  })

  it('requires every word to match', () => {
    cy.get('[data-cy=search]').type('claude haiku')
    cy.feed().find('[data-cy=item]').should('have.length', 1)
    cy.get('[data-cy=search]').type(' cypress')
    cy.get('[data-cy=no-results]').should('be.visible')
  })

  it('searches within the current tab only', () => {
    cy.get('[data-cy=tab-qa]').click()
    cy.get('[data-cy=search]').type('claude')
    cy.get('[data-cy=no-results]').should('be.visible')
  })

  it('filters by trust tier and type, and combines them', () => {
    cy.get('[data-cy=tier-official]').click().should('have.attr', 'aria-pressed', 'true')
    cy.feed().find('[data-cy=item]').should('have.length', 4)
    cy.get('[data-cy=type-release]').click()
    cy.feed().find('[data-cy=item]').should('have.length', 2)
    cy.get('[data-cy=tier-official]').click()
    cy.get('[data-cy=type-release]').click()
    cy.feed().find('[data-cy=item]').should('have.length', 10)
  })

  it('filters community items so only the HN post remains', () => {
    cy.get('[data-cy=tier-community]').click()
    cy.feed().find('[data-cy=item]').should('have.length', 1).and('contain', 'HN discussion')
  })
})
