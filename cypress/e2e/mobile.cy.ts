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

  it('hints that more sections are off screen, and the arrow brings them in', () => {
    cy.get('[data-cy=tabs-more]').should('be.visible')
    cy.window().then((win) => {
      const width = win.innerWidth
      cy.get('[data-cy=tab-learn]').then(($l) => expect($l[0].getBoundingClientRect().left).to.be.greaterThan(width))
      // Each tap scrolls most of a screen; keep tapping while the arrow is there.
      const tapUntilEnd = (left: number): void => {
        if (left === 0) return
        cy.get('body').then(($b) => {
          if (!$b.find('[data-cy=tabs-more]').length) return
          cy.get('[data-cy=tabs-more]').click()
          cy.wait(400)
          tapUntilEnd(left - 1)
        })
      }
      tapUntilEnd(5)
      cy.get('[data-cy=tab-learn]').should(($l) => expect($l[0].getBoundingClientRect().right).to.be.at.most(width))
      cy.get('[data-cy=tabs-more]').should('not.exist')
    })
  })

  it('stacks Model watch under the content, with a toggle that hides and shows it', () => {
    cy.get('[data-cy=rail-toggle]').scrollIntoView().should('be.visible').and('have.attr', 'aria-expanded', 'true')
    cy.get('[data-cy=rail-toggle]').should(($b) => {
      // An ordinary button above the panel (not the fixed edge tab used on wide screens), big enough to tap.
      expect(getComputedStyle($b[0]).position).to.eq('static')
      expect($b[0].getBoundingClientRect().height).to.be.at.least(44)
    })
    cy.get('[data-cy=model-watch]').should('be.visible')
    cy.get('[data-cy=rail-toggle]').click().should('have.attr', 'aria-expanded', 'false').and('contain', 'Model watch')
    cy.get('[data-cy=model-watch]').should('not.be.visible')
    cy.get('[data-cy=rail-toggle]').click()
    cy.get('[data-cy=model-watch]').should('be.visible')
  })

  it('shows the open tab in full when the page opens on a tab past the edge, never under the arrow', () => {
    // beforeEach already opened the page: set the hash and reload so it opens on Learn.
    cy.window().then((win) => {
      win.location.hash = 'learn'
    })
    cy.reload()
    cy.get('[data-cy=panel-learn]').should('exist')
    cy.window().then((win) => {
      cy.get('[data-cy=tab-learn]').should(($t) => {
        const r = $t[0].getBoundingClientRect()
        expect(r.left).to.be.at.least(0)
        expect(r.right).to.be.at.most(win.document.documentElement.clientWidth)
      })
      cy.get('body').then(($b) => {
        const arrow = $b.find('[data-cy=tabs-more]')[0]
        if (arrow) cy.get('[data-cy=tab-learn]').should(($t) => expect($t[0].getBoundingClientRect().right).to.be.at.most(arrow.getBoundingClientRect().left))
      })
    })
  })

  it('lets Learn tracks fill the single column on a tablet', () => {
    cy.viewport(900, 1000)
    cy.get('[data-cy=tab-learn]').click()
    cy.get('#content').then(($p) => {
      const inner = $p[0].getBoundingClientRect().width - parseFloat(getComputedStyle($p[0]).paddingLeft) - parseFloat(getComputedStyle($p[0]).paddingRight)
      cy.get('.track').should(($t) => expect($t[0].getBoundingClientRect().width).to.be.closeTo(inner, 2))
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
