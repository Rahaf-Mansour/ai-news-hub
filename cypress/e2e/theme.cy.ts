const LIGHT_BG = 'rgb(246, 247, 251)'
const DARK_BG = 'rgb(11, 16, 32)'

/** Emulate the OS colour-scheme preference through the Chrome DevTools Protocol (Chromium browsers only). */
const emulateScheme = (value: 'light' | 'dark' | '') =>
  Cypress.automation('remote:debugger:protocol', {
    command: 'Emulation.setEmulatedMedia',
    params: { features: [{ name: 'prefers-color-scheme', value }] },
  })

describe('Dark mode', () => {
  afterEach(() => {
    if (Cypress.isBrowser({ family: 'chromium' })) emulateScheme('')
  })

  it('cycles System → Light → Dark → System with the toggle and remembers the choice', () => {
    if (Cypress.isBrowser({ family: 'chromium' })) emulateScheme('light')
    cy.visitHub()
    cy.get('[data-cy=theme-toggle]').should('contain', 'System')
    cy.get('html').should('not.have.attr', 'data-theme')

    cy.get('[data-cy=theme-toggle]').click().should('contain', 'Light')
    cy.get('html').should('have.attr', 'data-theme', 'light')
    cy.get('body').should('have.css', 'background-color', LIGHT_BG)

    cy.get('[data-cy=theme-toggle]').click().should('contain', 'Dark')
    cy.get('html').should('have.attr', 'data-theme', 'dark')
    cy.get('body').should('have.css', 'background-color', DARK_BG)

    cy.reload()
    cy.get('html').should('have.attr', 'data-theme', 'dark')
    cy.get('[data-cy=theme-toggle]').should('contain', 'Dark')

    cy.get('[data-cy=theme-toggle]').click().should('contain', 'System')
    cy.get('html').should('not.have.attr', 'data-theme')
    cy.window().then((win) => expect(win.localStorage.getItem('hub:theme')).to.be.null)
  })

  it('follows the OS dark preference when set to System, and an explicit Light overrides it', () => {
    if (!Cypress.isBrowser({ family: 'chromium' })) {
      cy.log('OS colour-scheme emulation needs a Chromium browser; skipped.')
      return
    }
    emulateScheme('dark')
    cy.visitHub()
    cy.get('html').should('not.have.attr', 'data-theme')
    cy.get('body').should('have.css', 'background-color', DARK_BG)
    cy.get('[data-cy=theme-toggle]').click()
    cy.get('body').should('have.css', 'background-color', LIGHT_BG)
  })
})
