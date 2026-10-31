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

  it('shows a back-to-top button after scrolling, which returns to the top and focuses search', () => {
    cy.visitHub()
    cy.get('[data-cy=back-to-top]').should('not.be.visible')
    cy.feed().find('[data-cy=item]').should('have.length', 13)
    cy.scrollTo(0, 1500)
    cy.window().its('scrollY').should('be.greaterThan', 600)
    cy.get('[data-cy=back-to-top]').should('be.visible').and('have.attr', 'aria-label', 'Back to top').click()
    cy.window().its('scrollY').should('be.lessThan', 2)
    cy.focused().should('have.attr', 'data-cy', 'search')
    cy.get('[data-cy=back-to-top]').should('not.be.visible')
  })

  it('credits the author in the footer and the hero, with working profile links', () => {
    cy.visitHub()
    cy.get('[data-cy=author-credit]').should('contain', 'Designed & built by Rahaf Mansour')
    cy.get('[data-cy=author-credit] a[href="https://github.com/Rahaf-Mansour"]').should('have.attr', 'target', '_blank')
    cy.get('[data-cy=author-credit] a[href="https://www.linkedin.com/in/rahafmansour/"]').should('contain', 'LinkedIn')
    cy.get('[data-cy=author-credit] a[href="https://github.com/Rahaf-Mansour/ai-news-hub"]').should('contain', 'View source')
    cy.get('.byline').should('contain', 'by Rahaf Mansour')
  })

  it('shows when the next automatic refresh is, with a countdown', () => {
    cy.visitHub() // clock: Oct 31 08:00 UTC → next run Nov 1 05:30 UTC
    cy.get('[data-cy=next-refresh]')
      .should('contain', 'Next refresh:')
      .and('contain', 'your time')
      .and('contain', '(in 21h 30m)')
      .and('have.attr', 'title')
      .and('contain', 'can be delayed')
    cy.get('[data-cy=next-refresh] time').should('have.attr', 'datetime', '2026-11-01T05:30:00.000Z')
  })

  it('warns when the last refresh is more than 30 hours old', () => {
    cy.fixture('items.json').then((items) => {
      cy.visitHub({ itemsBody: { ...items, generatedAt: '2026-10-29T05:00:00.000Z' } })
    })
    cy.get('[data-cy=next-refresh]').should('contain', 'Last refresh is late').find('a').should('contain', 'check the Actions tab')
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
