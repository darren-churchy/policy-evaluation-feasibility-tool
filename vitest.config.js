import { defineConfig } from 'vitest/config'

// The engine and the specification are plain Node modules with no React dependency, so
// tests run in a node environment. Component tests (added from phase 5) will need a
// jsdom environment — add it per-file with a `// @vitest-environment jsdom` pragma rather
// than switching the global default.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{js,mjs,jsx}', 'src/**/*.test.{js,mjs,jsx}'],
    coverage: {
      provider: 'v8',
      include: ['scripts/**/*.mjs', 'src/engine/**/*.js'],
      reporter: ['text-summary'],
    },
  },
})
