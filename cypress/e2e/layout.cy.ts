describe('Page layout: sticky app bar', () => {
  it('shows search and the section tabs near the top on load', () => {
    cy.visitHub()
    cy.get('[data-cy=search]').then(($el) => expect($el[0].getBoundingClientRect().top).to.be.lessThan(300))
    cy.get('[data-cy=app-bar] [data-cy=tab-qa]').should('be.visible')
  })

  it('keeps the app bar pinned to the top while scrolling', () => {
    cy.visitHub()
    cy.scrollTo(0, 2000)
    cy.window().its('scrollY').should('be.greaterThan', 300)
    cy.get('[data-cy=app-bar]').then(($bar) => expect($bar[0].getBoundingClientRect().top).to.be.within(-1, 2))
    cy.get('[data-cy=search]').should('be.visible')
  })

  it('scrolls a clicked section to just below the sticky bar', () => {
    cy.visitHub()
    cy.get('[data-cy=tab-qa]').click()
    cy.get('[data-cy=app-bar]').then(($bar) => {
      const barBottom = $bar[0].getBoundingClientRect().bottom
      cy.get('[data-cy=panel-qa]').should(($panel) => {
        const top = $panel[0].getBoundingClientRect().top
        expect(top).to.be.within(barBottom - 2, barBottom + 48)
      })
    })
  })
})
