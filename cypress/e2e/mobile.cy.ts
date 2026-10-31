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
