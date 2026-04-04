---
name: vue-testing-best-practices
description: Use for Vue.js testing. Covers Vitest, Vue Test Utils, component testing, mocking, async behavior, and Playwright for E2E testing. Use this skill when writing or fixing tests, not just when choosing a test runner.
license: MIT
metadata:
  version: "1.0.0"
---

# Vue Testing Best Practices

Use this skill as a testing workflow for Vue applications. Prefer a behavior-first, black-box testing style and load only the references that match the current test problem.

## When to Use

- Writing or fixing Vue component tests
- Testing composables, async UI, Suspense, Teleport, or browser interactions
- Choosing between unit, integration, and end-to-end coverage
- Stabilizing flaky tests or improving weak test design

## Core Principles

- Test observable behavior, not implementation details.
- Start with Vitest and Vue Test Utils for component and composable tests.
- Use Playwright when the behavior depends on real browser semantics or full-app flows.
- Treat async rendering, Suspense, and browser APIs as explicit test boundaries.
- Keep mocks narrow and purposeful.

## 1) Pick the right test layer first (required)

- Component or composable behavior -> Vitest + Vue Test Utils
- Real browser behavior, CSS layout, or end-to-end flow -> Playwright
- If the test exists only to prove implementation details, redesign the test around observable output or interaction

## 2) Load the must-read references for the current test problem (required)

- General Vue test setup -> [testing-vitest-recommended-for-vue](reference/testing-vitest-recommended-for-vue.md)
- Stable, behavior-focused assertions -> [testing-component-blackbox-approach](reference/testing-component-blackbox-approach.md)
- Async rendering and promise flushing -> [testing-async-await-flushpromises](reference/testing-async-await-flushpromises.md)

Load additional references from the index below only when the test requires them.

## 3) Prefer realistic tests over over-mocking (required)

- Render the component through its public props, emits, slots, and visible DOM.
- Mock only the boundary that is irrelevant to the behavior under test.
- Keep store setup minimal.

## 4) Make async and platform boundaries explicit

- Use `await` and `flushPromises()` when async rendering is part of the feature.
- Handle Teleport, Suspense, and async components with the matching test utilities instead of forcing brittle selectors.
- Choose a browser runner when jsdom semantics are not enough.

## 5) Final self-check before finishing

- The chosen test layer matches the behavior being verified.
- Assertions target user-visible behavior.
- Async work is awaited intentionally.
- Mocks do not hide the behavior that actually matters.
- Only the relevant reference files were loaded.

### Testing
- Setting up test infrastructure for Vue 3 projects → See [testing-vitest-recommended-for-vue](reference/testing-vitest-recommended-for-vue.md)
- Tests keep breaking when refactoring component internals → See [testing-component-blackbox-approach](reference/testing-component-blackbox-approach.md)
- Tests fail intermittently with race conditions → See [testing-async-await-flushpromises](reference/testing-async-await-flushpromises.md)
- Composables using lifecycle hooks or inject fail to test → See [testing-composables-helper-wrapper](reference/testing-composables-helper-wrapper.md)
- Getting "injection Symbol(pinia) not found" errors in tests → See [testing-pinia-store-setup](reference/testing-pinia-store-setup.md)
- Components with async setup won't render in tests → See [testing-suspense-async-components](reference/testing-suspense-async-components.md)
- Snapshot tests keep passing despite broken functionality → See [testing-no-snapshot-only](reference/testing-no-snapshot-only.md)
- Choosing end-to-end testing framework for Vue apps → See [testing-e2e-playwright-recommended](reference/testing-e2e-playwright-recommended.md)
- Tests need to verify computed styles or real DOM events → See [testing-browser-vs-node-runners](reference/testing-browser-vs-node-runners.md)
- Testing components created with defineAsyncComponent fails → See [async-component-testing](reference/async-component-testing.md)
- Teleported modal content can't be found in wrapper queries → See [teleport-testing-complexity](reference/teleport-testing-complexity.md)

## Reference

- [Vue.js Testing Guide](https://vuejs.org/guide/scaling-up/testing)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)

_Token efficiency: Main skill ~300 tokens, each reference ~200-600 tokens_
