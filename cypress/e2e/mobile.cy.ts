describe('Mobile layout', () => {
  beforeEach(() => {
    cy.viewport('iphone-x')
    cy.visitHub()
  })

  it('never scrolls sideways', () => {
    cy.document().then((doc) => {
      expect(doc.documentElement.scrollWidth).to.be.at.most(doc.documentElement.clientWidth)
    })
    cy.get('[data-cy=tab-repos]').click()
    cy.document().then((doc) => {
      expect(doc.documentElement.scrollWidth).to.be.at.most(doc.documentElement.clientWidth)
    })
  })

  it('keeps the app bar short: search row on top, tabs beneath', () => {
    cy.get('[data-cy=app-bar]').then(($bar) => expect($bar[0].getBoundingClientRect().height).to.be.at.most(112))
    cy.get('[data-cy=search]').then(($s) => {
      cy.get('[data-cy=tab-all]').then(($t) => expect($t[0].getBoundingClientRect().top).to.be.greaterThan($s[0].getBoundingClientRect().bottom))
    })
  })

  it('keeps back-to-top reachable: on screen and at least 44px', () => {
    cy.scrollTo(0, 1500)
    cy.get('[data-cy=back-to-top]').should('be.visible').then(($b) => {
      const r = $b[0].getBoundingClientRect()
      expect(r.width).to.be.at.least(44)
      expect(r.bottom).to.be.at.most(Cypress.config('viewportHeight'))
      expect(r.right).to.be.at.most(Cypress.config('viewportWidth'))
    })
  })

  it('stacks Today into a single column', () => {
    cy.get('.today__groups')
      .should('have.css', 'grid-template-columns')
      .and((cols) => expect(String(cols).trim().split(/\s+/)).to.have.length(1))
  })

  it('keeps the section tabs usable: they scroll sideways and switch the feed', () => {
    cy.get('.tabs').then(($tabs) => expect($tabs[0].scrollWidth).to.be.greaterThan($tabs[0].clientWidth - 1))
    cy.get('[data-cy=tab-learn]').scrollIntoView().click()
    cy.location('hash').should('eq', '#learn')
    cy.get('[data-cy=learn]').should('be.visible')
  })

  it('keeps item actions reachable on a phone', () => {
    cy.feed().find('[data-id=fx-lenny] [data-cy=toggle-save]').scrollIntoView().should('be.visible').click()
    cy.feed().find('[data-id=fx-lenny] [data-cy=toggle-save]').should('have.attr', 'aria-pressed', 'true')
  })
})
