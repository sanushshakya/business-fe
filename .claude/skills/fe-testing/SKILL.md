---
name: fe-testing
description: Use when writing or running frontend tests (Vitest, Testing Library) or debugging flaky queries in tests and browser automation.
---

# Frontend testing

Needs Node >= 18.19 (older 18.x breaks `workbox-build`); this machine uses Node 22: `PATH=$HOME/.nvm/versions/node/v22.22.0/bin:$PATH`.

```bash
npm test                                   # vitest --coverage (jsdom, setup in src/setupTests.js)
npx vitest run src/components/__tests__/forms.test.jsx   # one file
npx vitest run -t "dismisses"              # by test name
npm run lint
npm run build                              # also generates dist/sw.js
```

## Patterns (copy `src/pages/__tests__/DemandAlertsPage.test.jsx`)
- Mock the HTTP layer: `vi.mock('../../utils/axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }))`. List responses look like `{ data: { results: [...], next: null } }`.
- Wrap pages in `QueryClientProvider` with `new QueryClient({ defaultOptions: { queries: { retry: false } } })` and a fresh client per test; `vi.clearAllMocks()` in `beforeEach`.
- Use `findBy*` for async data and `userEvent` for interaction; prefer role/label queries. Ambiguous text queries fail: make them specific (`getByRole('button', { name: ... })`, `within(...)`).
- Presentational components are tested with props only; no network.
- RxDB uses memory storage in tests (`offlineDB.js`).
- New modules are smoke-imported by `src/tests/modules.test.js`.
- Role logic lives in `src/tests/roles.test.js`; update it when changing `roles.js`.

## Gotcha
React Query v4 pauses retries while the tab is hidden/unfocused, so in a background browser tab (browser automation) a failing query looks stuck on its skeleton. That is not an app bug; check network responses instead.
