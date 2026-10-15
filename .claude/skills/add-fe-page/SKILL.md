---
name: add-fe-page
description: Use when adding a new screen to the frontend (page, presentational component, route, role navigation, tests).
---

# Add a page

Pattern: **pages fetch and wire; components present.** Look at `src/pages/DemandAlertsPage.jsx` and `src/components/DemandAlert.jsx` as the reference pair.

## Steps
1. **Presentational component** in `src/components/` taking data and callbacks as props; unit test in `src/components/__tests__/`.
2. **Page** in `src/pages/<Name>Page.jsx`:
   - Lists: `useApiList('/app/things/')` (react-query v4, walks DRF pagination, key `['list', url]`) rendered inside `<QueryState query={...} emptyMessage="...">`.
   - Writes: `useMutation` with `utils/axios`, then `queryClient.invalidateQueries({ queryKey: ['list', URL] })`. Show failures yourself (`role="alert"`, `apiErrorMessage` from `utils/http`); forms keep their values when `onSubmit` rejects, so let the mutation error propagate.
3. **Route** in `src/App.jsx` under the `/dashboard` `MainLayout` route (`<Route path="things" element={<ThingsPage />} />`).
4. **Navigation and roles** in `src/roles.js`: add an entry to `ITEMS`, and to `ROLE_ITEMS[role]` for each operator role that should see it (`ROLE_HOME` if it is a landing page). Staff and unrestricted users get every item in `ITEMS` automatically. `canOpen` redirects operators away from screens not in their list.
5. **Backend access**: operators can only call endpoints on their role's allow-list (`config/authentication/role_access.py`). If the page needs a new endpoint, add it there, or the page will 403 for operators. If the URL prefix is new, add it to the Vite proxy list in `vite.config.mjs`.
6. **Tests**: page test in `src/pages/__tests__/` (see `fe-testing`).

## Conventions
- UI primitives are local Tailwind components: `import { Button, Card, Input, Table, Modal, Badge, Skeleton } from '@/components/ui'` (`@` = `src/`). There is no shadcn/MUI usage; do not introduce one.
- Money is in pence (`utils/money`: `formatCents`, `toCents`, `parseMoney`); never do float arithmetic on prices.
- Dates via `date-fns` / `utils/dateUtils`.
- Prettier owns formatting (single quotes, width 120); run `npm run lint`.
- `src/tests/modules.test.js` imports every module, so a bad import fails it.
