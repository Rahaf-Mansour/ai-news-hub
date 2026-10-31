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

  it('closes the Model watch panel without moving the content, and the text fills the freed width', () => {
    cy.visitHub()
    cy.get('[data-cy=feed-toolbar]').then(($t) => {
      // Distance from the top of the content area to the toolbar: a gap above the content would grow it.
      // (Relative, so it does not depend on Today or fonts finishing layout above the page.)
      const offsetInPage = (el: Element) => el.getBoundingClientRect().top - el.ownerDocument.getElementById('content')!.getBoundingClientRect().top
      const toolbarTop = offsetInPage($t[0])
      cy.feed().then(($f) => {
        const feedBefore = $f[0].getBoundingClientRect().width
        cy.get('[data-cy=feed] [data-cy=item-summary]').first().then(($s) => {
          const summaryBefore = $s[0].getBoundingClientRect().width
          // Open on a wide screen: a small "Hide panel" pill, without the title or description.
          cy.get('[data-cy=rail-toggle] .rail-toggle__state').should('be.visible').and('have.text', 'Hide panel')
          cy.get('[data-cy=rail-toggle] .rail-toggle__title').should('not.be.visible')
          cy.get('[data-cy=rail-toggle]').should('have.attr', 'aria-expanded', 'true').click()
          cy.get('[data-cy=model-watch]').should('not.be.visible')
          // No gap opens above the content: the toolbar stays exactly where it was.
          cy.get('[data-cy=feed-toolbar]').should(($t2) => expect(offsetInPage($t2[0])).to.be.closeTo(toolbarTop, 1))
          cy.feed().should(($g) => expect($g[0].getBoundingClientRect().width).to.be.greaterThan(feedBefore + 200))
          // Summaries drop their reading measure and use the extra width.
          cy.get('[data-cy=feed] [data-cy=item-summary]').first().should(($s2) => expect($s2[0].getBoundingClientRect().width).to.be.greaterThan(summaryBefore + 200))
        })
      })
    })
    // The reopen button is a tab on the right edge of the window, clear of the content.
    cy.window().then((win) => {
      cy.get('[data-cy=rail-toggle]').should(($b) => {
        const r = $b[0].getBoundingClientRect()
        expect(getComputedStyle($b[0]).position).to.eq('fixed')
        expect(r.right).to.be.closeTo(win.document.documentElement.clientWidth, 1)
      })
      cy.feed().then(($g) => cy.get('[data-cy=rail-toggle]').should(($b) => expect($b[0].getBoundingClientRect().left).to.be.at.least($g[0].getBoundingClientRect().right)))
    })
    // Closed: the edge tab names the panel and nothing else.
    cy.get('[data-cy=rail-toggle] .rail-toggle__title').should('be.visible').and('have.text', 'Model watch & sources')
    cy.get('[data-cy=rail-toggle] .rail-toggle__state').should('not.be.visible')
    cy.get('[data-cy=rail-toggle-desc]').should('not.be.visible')
    cy.reload()
    cy.get('[data-cy=rail-toggle]').should('have.attr', 'aria-expanded', 'false').click()
    cy.get('[data-cy=model-watch]').should('be.visible')
  })

  it('keeps the content centered with the panel hidden on a mid-size window', () => {
    cy.viewport(1100, 800)
    cy.visitHub({ storage: { 'hub:rail': 'closed' } })
    cy.get('#content').should(($p) => {
      const el = $p[0]
      const r = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      const vw = el.ownerDocument.documentElement.clientWidth
      const left = r.left + parseFloat(cs.paddingLeft)
      const right = vw - r.right + parseFloat(cs.paddingRight)
      expect(left).to.be.closeTo(right, 1)
    })
    cy.feed().then(($f) => cy.get('[data-cy=rail-toggle]').should(($b) => expect($b[0].getBoundingClientRect().left).to.be.at.least($f[0].getBoundingClientRect().right)))
    // Nor does it cover anything in the bands above the content (hero stats, theme toggle, tabs, Today).
    const clear = (target: string) =>
      cy.get(target).then(($els) =>
        cy.get('[data-cy=rail-toggle]').should(($b) => {
          const tab = $b[0].getBoundingClientRect()
          for (const el of $els) {
            const r = el.getBoundingClientRect()
            const overlaps = r.right > tab.left && r.left < tab.right && r.bottom > tab.top && r.top < tab.bottom
            expect(overlaps, `${target} under the edge tab`).to.eq(false)
          }
        }),
      )
    for (const target of ['[data-cy=stats]', '[data-cy=theme-toggle]', '[data-cy=tabs]']) clear(target)
    cy.get('[data-cy=today]').scrollIntoView()
    clear('[data-cy=today] [data-cy=item]')
  })

  it('lets Learn fill the single column just below the side-panel breakpoint, so it stays centered', () => {
    cy.viewport(1015, 800)
    cy.visitHub({ hash: 'learn', storage: { 'hub:rail': 'closed' } })
    cy.get('[data-cy=panel-learn]').then(($p) => {
      cy.get('[data-cy=track-claude]').should(($t) => {
        const p = $p[0].getBoundingClientRect()
        const t = $t[0].getBoundingClientRect()
        expect(t.left).to.be.closeTo(p.left, 1)
        expect(t.right).to.be.closeTo(p.right, 1)
      })
    })
  })

  it('scrolls a clicked section to just below the sticky bar', () => {
    cy.visitHub()
    // Start far down, so the test fails if the click does not scroll at all.
    cy.scrollTo(0, 2500)
    cy.get('[data-cy=tab-qa]').click()
    cy.get('[data-cy=panel-qa]').should(($panel) => {
      const bar = $panel[0].ownerDocument.querySelector('[data-cy=app-bar]')!.getBoundingClientRect()
      expect(bar.top).to.be.closeTo(0, 1)
      const top = $panel[0].getBoundingClientRect().top
      expect(top).to.be.within(bar.bottom - 2, bar.bottom + 48)
    })
  })
})
