const LIGHT_BG = 'rgb(246, 247, 251)'
const DARK_BG = 'rgb(11, 16, 32)'

/** Emulate the OS colour-scheme preference through the Chrome DevTools Protocol (Chromium browsers only). */
const emulateScheme = (value: 'light' | 'dark' | '') =>
  Cypress.automation('remote:debugger:protocol', {
    command: 'Emulation.setEmulatedMedia',
    params: { features: [{ name: 'prefers-color-scheme', value }] },
  })

describe('Light and dark theme', () => {
  afterEach(() => {
    if (Cypress.isBrowser({ family: 'chromium' })) emulateScheme('')
  })

  it('starts on the OS theme, switches Light ↔ Dark, and remembers the choice', () => {
    if (Cypress.isBrowser({ family: 'chromium' })) emulateScheme('light')
    cy.visitHub()
    cy.get('[data-cy=theme-toggle]').should('have.text', 'Light')
    cy.get('html').should('not.have.attr', 'data-theme')
    cy.get('body').should('have.css', 'background-color', LIGHT_BG)

    cy.get('[data-cy=theme-toggle]').click().should('have.text', 'Dark')
    cy.get('html').should('have.attr', 'data-theme', 'dark')
    cy.get('body').should('have.css', 'background-color', DARK_BG)

    cy.reload()
    cy.get('html').should('have.attr', 'data-theme', 'dark')
    cy.get('[data-cy=theme-toggle]').should('have.text', 'Dark')

    cy.get('[data-cy=theme-toggle]').click().should('have.text', 'Light')
    cy.get('body').should('have.css', 'background-color', LIGHT_BG)
    cy.window().then((win) => expect(win.localStorage.getItem('hub:theme')).to.eq('light'))
  })

  it('follows a dark OS until the reader picks Light', () => {
    if (!Cypress.isBrowser({ family: 'chromium' })) {
      cy.log('OS colour-scheme emulation needs a Chromium browser; skipped.')
      return
    }
    emulateScheme('dark')
    cy.visitHub()
    cy.get('html').should('not.have.attr', 'data-theme')
    cy.get('body').should('have.css', 'background-color', DARK_BG)
    cy.get('[data-cy=theme-toggle]').should('have.text', 'Dark').click().should('have.text', 'Light')
    cy.get('body').should('have.css', 'background-color', LIGHT_BG)
  })
})
