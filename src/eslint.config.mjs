// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    files: ['app/**/*.{js,ts,vue}'],
    ignores: ['app/components/ui/**'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [{
          name: 'reka-ui',
          message: 'Use the shadcn wrappers from app/components/ui instead of importing reka-ui directly in feature code.',
        }],
      }],
    },
  },
)
