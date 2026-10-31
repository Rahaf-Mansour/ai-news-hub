describe('Search and filters', () => {
  beforeEach(() => cy.visitHub())

  it('searches titles and summaries as you type', () => {
    cy.get('[data-cy=search]').type('self-healing')
    cy.feed().find('[data-cy=item]').should('have.length', 1).and('contain', 'cy.prompt adds self-healing selectors')
    cy.get('[data-cy=result-count]').should('have.text', '1 of 13 items')

    cy.get('[data-cy=search]').clear().type('prompt')
    cy.feed().find('[data-cy=item]').should('have.length', 2)

    cy.get('[data-cy=search]').clear()
    cy.feed().find('[data-cy=item]').should('have.length', 13)
  })

  it('hides Today while searching so results come first', () => {
    cy.get('[data-cy=today]').should('be.visible')
    cy.get('[data-cy=search]').type('haiku')
    cy.get('[data-cy=today]').should('not.exist')
    cy.get('[data-cy=search]').clear()
    cy.get('[data-cy=today]').should('be.visible')
  })

  it('requires every word to match', () => {
    cy.get('[data-cy=search]').type('claude haiku')
    cy.feed().find('[data-cy=item]').should('have.length', 1)
    cy.get('[data-cy=search]').type(' cypress')
    cy.get('[data-cy=no-results]').should('be.visible')
  })

  it('searches within the current tab only, and keeps the query when switching tabs', () => {
    cy.get('[data-cy=tab-qa]').click()
    cy.get('[data-cy=search]').type('claude')
    cy.get('[data-cy=no-results]').should('be.visible')
    cy.get('[data-cy=tab-claude]').click()
    cy.get('[data-cy=search]').should('have.value', 'claude')
    cy.feed().find('[data-cy=item]').should('have.length', 2)
  })

  it('focuses search with "/", clears with Esc and with the × button', () => {
    cy.get('body').type('/')
    cy.focused().should('have.attr', 'data-cy', 'search')
    cy.focused().type('haiku')
    cy.feed().find('[data-cy=item]').should('have.length', 1)
    cy.focused().type('{esc}')
    cy.get('[data-cy=search]').should('have.value', '')

    cy.get('[data-cy=search]').type('prompt')
    cy.get('[data-cy=search-clear]').click()
    cy.get('[data-cy=search]').should('have.value', '').and('be.focused')
    cy.feed().find('[data-cy=item]').should('have.length', 13)
  })

  it('changes the placeholder per tab', () => {
    cy.get('[data-cy=search]').should('have.attr', 'placeholder', 'Search all news…')
    cy.get('[data-cy=tab-repos]').click()
    cy.get('[data-cy=search]').should('have.attr', 'placeholder', 'Search repos…')
    cy.get('[data-cy=tab-learn]').click()
    cy.get('[data-cy=search]').should('have.attr', 'placeholder', 'Search learning steps…')
  })

  it('searches repos by name, why line and role, combined with the role filter', () => {
    cy.get('[data-cy=tab-repos]').click()
    cy.get('[data-cy=repos-count]').should('have.text', '3 of 3 repos')
    cy.get('[data-cy=search]').type('browser')
    cy.get('[data-cy=repo-row]').should('have.length', 1).and('contain', 'playwright-mcp')
    cy.get('[data-cy=repos-count]').should('have.text', '1 of 3 repos')
    cy.get('[data-cy=search]').clear().type('anthropics')
    cy.get('[data-cy=repo-row]').should('have.length', 2)
    cy.get('[data-cy=repos-role-qa]').click()
    cy.get('[data-cy=no-results]').should('be.visible')
  })

  it('searches learning steps and hides tracks with no match', () => {
    cy.get('[data-cy=tab-learn]').click()
    cy.get('[data-cy=search]').type('stagehand')
    cy.get('[data-cy=learn-step]').should('have.length', 1).and('contain', 'Stagehand')
    cy.get('[data-cy=track-producer]').should('not.exist')
    cy.get('[data-cy=search]').clear().type('nothing-matches-this')
    cy.get('[data-cy=no-results]').should('contain', 'No steps match')
  })

  it('filters the Claude timeline by the search', () => {
    cy.get('[data-cy=tab-claude]').click()
    cy.get('[data-cy=search]').type('haiku')
    cy.get('[data-cy=timeline-count]').should('contain', '1 of')
    cy.get('[data-cy=claude-timeline] li').should('have.length', 1)
  })

  it('filters the QA tab by area: manual & exploratory, automation, testing AI', () => {
    cy.get('[data-cy=tab-qa]').click()
    cy.get('[data-cy=facet-all]').should('have.attr', 'aria-pressed', 'true').and('contain', '4')
    cy.get('[data-cy=facet-manual]').click()
    cy.feed().find('[data-cy=item]').should('have.length', 1).and('contain', 'Exploratory test charters')
    cy.get('[data-cy=facet-automation]').click()
    cy.feed().find('[data-cy=item]').should('have.length', 2)
    cy.get('[data-cy=facet-ai-testing]').click()
    cy.feed().find('[data-cy=item]').should('have.length', 2)
    cy.get('[data-cy=facet-all]').click()
    cy.feed().find('[data-cy=item]').should('have.length', 4)
    cy.get('[data-cy=tab-pm]').click()
    cy.get('[data-cy=facets]').should('not.exist')
  })

  it('filters the Full-stack tab by frontend and backend', () => {
    cy.get('[data-cy=tab-fs]').click()
    cy.get('[data-cy=search]').should('have.attr', 'placeholder', 'Search full-stack news…')
    cy.get('[data-cy=facet-all]').should('contain', '2')
    cy.get('[data-cy=facet-frontend]').click()
    cy.feed().find('[data-cy=item]').should('have.length', 1).and('contain', 'React 19.3')
    cy.get('[data-cy=facet-backend]').click()
    cy.feed().find('[data-cy=item]').should('have.length', 1).and('contain', 'pgvector')
    // An item can sit in both Full-stack and AI dev tools.
    cy.get('[data-cy=tab-se]').click()
    cy.feed().find('[data-id=fx-pgvector]').should('exist')
  })

  it('shows one learning track at a time, with a picker, and every track while searching', () => {
    cy.get('[data-cy=tab-learn]').click()
    cy.get('[data-cy=learn]').should('contain', 'Three tracks')
    cy.get('[data-cy=track-picker] button').should('have.length', 3)
    cy.get('[data-cy=track-producer]').should('exist')
    cy.get('[data-cy=track-pick-fullstack]').click().should('have.attr', 'aria-pressed', 'true')
    cy.get('[data-cy=track-fullstack]').should('contain', 'AI for full-stack engineers')
    cy.get('[data-cy=track-producer]').should('not.exist')
    cy.reload()
    cy.get('[data-cy=track-fullstack]').should('exist')
    cy.get('[data-cy=search]').type('evals')
    cy.get('[data-cy=track-picker]').should('not.exist')
    cy.get('[data-cy=track-qa]').should('exist')
    cy.get('[data-cy=track-fullstack]').should('exist')
  })

  it('groups the QA learning track into labelled sections', () => {
    cy.get('[data-cy=tab-learn]').click()
    cy.get('[data-cy=track-pick-qa]').click()
    cy.get('[data-cy=track-qa]').should('contain', 'QA in the AI era')
    cy.get('[data-cy=track-qa] [data-cy=step-section]').first().should('have.text', 'AI for manual & exploratory testers')
    cy.get('[data-cy=track-qa] [data-cy=step-section]').should('contain', 'Playwright + AI').and('contain', 'Testing AI features')
  })

  it('filters by trust tier and type, and combines them', () => {
    cy.get('[data-cy=tier-official]').click().should('have.attr', 'aria-pressed', 'true')
    cy.feed().find('[data-cy=item]').should('have.length', 5)
    cy.get('[data-cy=type-release]').click()
    cy.feed().find('[data-cy=item]').should('have.length', 2)
    cy.get('[data-cy=tier-official]').click()
    cy.get('[data-cy=type-release]').click()
    cy.feed().find('[data-cy=item]').should('have.length', 13)
  })

  it('filters community items so only the HN post remains', () => {
    cy.get('[data-cy=tier-community]').click()
    cy.feed().find('[data-cy=item]').should('have.length', 1).and('contain', 'HN discussion')
  })
})
