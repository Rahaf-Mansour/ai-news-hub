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

  it('gives page-level test hooks one element each, and repeated ones a unique key', () => {
    cy.visitHub()
    for (const hook of ['masthead', 'wordmark', 'stats', 'search', 'tabs', 'app-bar', 'feed', 'feed-toolbar', 'feed-list', 'rail', 'footer', 'theme-toggle']) {
      cy.get(`[data-cy=${hook}]`).should('have.length', 1)
    }
    cy.get('[data-cy=feed] [data-cy=item]').then(($items) => {
      const ids = [...$items].map((i) => i.getAttribute('data-id'))
      expect(new Set(ids).size).to.eq(ids.length)
    })
    cy.get('[data-cy=source-row]').then(($rows) => {
      const ids = [...$rows].map((r) => r.getAttribute('data-source'))
      expect(ids.every(Boolean) && new Set(ids).size === ids.length).to.eq(true)
    })
    cy.get('[data-cy=tab-learn]').click()
    cy.get('[data-cy=learn-step]').each(($s) => expect($s.attr('data-step')).to.match(/^[a-z0-9-]+$/))
  })

  it('explains the site to a first-time visitor in the footer', () => {
    cy.visitHub()
    cy.get('[data-cy=about] h2').then(($h) => expect([...$h].map((h) => h.textContent)).to.deep.eq(['How it works', 'Straight to the source', 'Private by design']))
    // Source count comes from the run status (3 in the fixture); the LLM is on in the fixture, so the AI wording shows.
    cy.get('[data-cy=about]').should('contain', 'checks 3 sources').and('contain', 'written by an AI model').and('contain', 'No sign-up, no analytics, no cookies')
    cy.get('[data-cy=about-issues]').should('have.attr', 'href', 'https://github.com/Rahaf-Mansour/ai-news-hub/issues')
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

  it('colours cards by their primary role and fills the active tab pill in that role', () => {
    cy.visitHub({ hash: 'fs' })
    // Full-stack: vivid #2563eb spine, darker #1d4ed8 pill so its white text passes AA.
    cy.feed().find('[data-id=fx-react]').should('have.class', 'role-fs').and('have.css', 'border-left-color', 'rgb(37, 99, 235)')
    cy.get('[data-cy=tab-fs]').should('have.css', 'background-color', 'rgb(29, 78, 216)').and('have.css', 'color', 'rgb(255, 255, 255)')
    cy.get('[data-cy=tier]').first().should('have.css', 'border-radius', '999px')
  })

  it('shows every section tab on one row on a laptop screen, library tabs after a divider', () => {
    cy.visitHub()
    cy.get('[data-cy=tabs-more]').should('not.exist')
    cy.get('.tabs__sep').should('have.length', 1)
    cy.get('[data-cy=app-bar] .tab').then(($tabs) => {
      const tops = new Set([...$tabs].map((t) => Math.round(t.getBoundingClientRect().top)))
      expect(tops.size).to.eq(1)
      for (const t of $tabs) expect(t.getBoundingClientRect().right).to.be.at.most(Cypress.config('viewportWidth'))
    })
    cy.get('[data-cy=tab-learn]').should('be.visible')
  })

  it('closes the Model watch panel so the content fills the full width, and remembers it', () => {
    cy.visitHub()
    cy.feed().then(($f) => {
      const before = $f[0].getBoundingClientRect().width
      cy.get('[data-cy=rail-toggle]').should('have.attr', 'aria-expanded', 'true').click()
      cy.get('[data-cy=model-watch]').should('not.exist')
      cy.feed().should(($g) => expect($g[0].getBoundingClientRect().width).to.be.greaterThan(before + 100))
      // No empty side column: the feed reaches the right edge of the page, where the reopen button sits.
      cy.get('#content').then(($page) => {
        const pageRight = $page[0].getBoundingClientRect().right - parseFloat(getComputedStyle($page[0]).paddingRight)
        cy.feed().should(($g) => expect($g[0].getBoundingClientRect().right).to.be.closeTo(pageRight, 2))
        cy.get('[data-cy=rail-toggle]').should(($b) => expect($b[0].getBoundingClientRect().right).to.be.closeTo(pageRight, 2))
      })
    })
    cy.reload()
    cy.get('[data-cy=rail-toggle]').should('have.attr', 'aria-expanded', 'false').and('contain', 'Model watch').click()
    cy.get('[data-cy=model-watch]').should('be.visible')
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
