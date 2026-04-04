import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  forks: {
    singleFork: true,
  },

  test: {
    hookTimeout: 30_000,

    environmentOptions: {
      nuxt: {
        rootDir: '.',
        domEnvironment: 'happy-dom',
      },
    },

    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'app/**/*.ts',
        'app/**/*.vue',
      ],
      exclude: [
        '**/*.d.ts',
        '**/__tests__/**',
        'app/components/ui/**',
      ],
    },
  },
})
