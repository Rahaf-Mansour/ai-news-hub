/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' keeps asset and data paths relative, so the build works on any
// GitHub Pages path (user.github.io/<repo>/) without knowing the repo name.
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    include: ['ingest/**/*.test.ts', 'src/**/*.test.ts'],
    environment: 'node',
  },
})
