import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    // 127.0.0.1, not localhost: on Node 18+ "localhost" can resolve to IPv6
    // while the preview server listens on IPv4, which breaks wait-on in CI.
    baseUrl: 'http://127.0.0.1:4173',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    viewportWidth: 1280,
    viewportHeight: 900,
    video: false,
    retries: { runMode: 1, openMode: 0 },
  },
})
