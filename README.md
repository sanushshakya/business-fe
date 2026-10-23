# Supply Chain IQ — frontend

React 18 + Vite single-page app for the Supply Chain IQ backend (Django/DRF, in the sibling `config/` repo). It covers stock alerts, inventory and stock receipts, cultural events, freight alerts, suppliers, branches, waste reduction, team invitations and company settings.

## Getting started

Requires **Node 18.19 or newer** (older 18.x breaks `workbox-build`).

```bash
npm install
npm run dev          # http://localhost:5173
```

The backend has no CORS configuration, so the dev server proxies API calls to it. Start the backend first (from `config/`, with `SECRET_KEY` set):

```bash
python manage.py migrate
python manage.py seed_demo_data      # demo company + owner (see seed_demo_data --help)
python manage.py runserver           # http://localhost:8000
```

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_PROXY_TARGET` | `http://localhost:8000` | Where the dev proxy forwards `/auth`, `/tenants`, `/inventory`, `/sales`, `/demand`, `/calendar`, `/logistics`, `/pricing`, `/sync`, `/common`. |
| `VITE_API_URL` | empty (same origin) | Base URL for API calls. Set it for a production build served from a different origin. |

In Docker, `Dockerfile` runs this same dev server (Node 22) with `VITE_API_PROXY_TARGET` pointing at the IQ
container; the workspace-level `docker-compose.yml` starts it with both backends.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload and API proxy. |
| `npm run build` | Production build into `dist/`, plus the service worker `dist/sw.js`. |
| `npm test` | Vitest with coverage (jsdom). Use `npx vitest run <file>` for a single file. |
| `npm run lint` | ESLint over `src/`. |
| `npm run format` | Prettier. Prettier owns formatting; ESLint does not check style. |

## Routes

| Path | Page |
| --- | --- |
| `/login` | Sign in with email and password, or (Operator code tab) with an 8-digit code |
| `/reset-password?uid=…&token=…` | Confirm a password reset from the emailed link |
| `/dashboard` | Stock alerts |
| `/dashboard/pos` | Till: open a till with a float, ring up cash/card sales, print receipts, close with a cash count |
| `/dashboard/sales` | Sales history (filter, view receipt, void) and till sessions with their cash variance |
| `/dashboard/inventory` | Products, with a "Receive stock" dialog |
| `/dashboard/events` | Cultural events |
| `/dashboard/freight` | Freight rate alerts (dismissable) |
| `/dashboard/demand` | Branch demand alerts (open ones, dismissable) |
| `/dashboard/suppliers` | Suppliers and alternative suppliers |
| `/dashboard/branches` | Branches and their tills; add a branch or a till (staff) |
| `/dashboard/waste` | Pending price changes (staff approve or reject them; approval sets the product's price, which then syncs to the storefronts) and markdowns of near-expiry stock, last 30 days |
| `/dashboard/pov/demand` | Demand overview: open alerts, upcoming events, low stock |
| `/dashboard/pov/freight` | Freight overview: rate alerts, deliveries (add, change status), carriers, current rates |
| `/dashboard/pov/supplier` | Supplier overview: what is owed, overdue invoices (mark paid), suppliers and alternatives |
| `/dashboard/team` | Invitations and inviting a user; operators (add with a role, show their code once, reset it, change role, deactivate) |
| `/dashboard/settings` | Company profile |

Everything under `/dashboard` requires a signed-in user and redirects to `/login` otherwise.

## Architecture

```
src/
  main.jsx, App.jsx        entry, providers, routes
  pages/                   fetch data and wire components together
  components/              presentational components (props in, events out)
  components/ui/           local Tailwind primitives (Button, Card, Table, Modal, …)
  hooks/                   useApiList, useNetworkStatus, useSyncManager
  services/                authService, rxdbBatchService, WebSocketService
  stores/                  zustand: authStore (tokens), companyStore
  utils/axios.js           the single configured axios instance
  offlineDB.js             RxDB (Dexie) offline database
```

- **Data fetching.** Pages use `useApiList(url)` (react-query; walks DRF pagination, `{count, next, previous, results}`) for reads and `useMutation` with `utils/axios` for writes. Mutations invalidate the matching `['list', url]` query.
- **Auth.** `POST /auth/login/` takes `{username, password}` (the email goes in `username`) and returns `{access_token, refresh_token}`. Tokens live in `authStore` and are mirrored to `localStorage`. On a 401 the axios instance makes **one shared** `POST /auth/token/refresh/` and retries; refresh tokens are single use, so concurrent refreshes must not race. A failed refresh clears the session.
- **Errors.** `QueryState` renders loading, empty and error states and says so when the backend returns 403. Client errors (4xx) are not retried. Forms keep their values when `onSubmit` rejects, so pages should let the mutation error propagate and show it themselves.
- **Offline stock receipts.** `OfflineProvider` (in `main.jsx`) keeps receipts in RxDB (IndexedDB) when the browser is offline or the server is unreachable or answers 5xx, shows "n waiting to sync" in the header, and sends them when the browser comes back online or the app starts. A 4xx is a real rejection: the receipt is marked and only retried from the header's Retry button. `rxdbBatchService` and `WebSocketService` are tested but unused (the backend's `/ws/sync/` is a stub). Reads are cached in memory only, so the product list needs one online visit per page load.
- **Till (point of sale).** `PosPage` runs a shift: pick a till, open a session with a float, tap products into the basket (`hooks/useCart`, in whole pence), take cash (change is shown) or card, then show/print the receipt; stock refreshes after each sale. The server prices the sale and takes stock oldest expiry first. Each charge carries a `client_ref` that is reused while the basket and payment are unchanged, so resending after a lost response cannot charge twice. Selling needs a connection (charging pauses offline); only stock receipts are queued offline. Closing the till records the counted cash and shows over/short. `SalesPage` lists sales (paged, `hooks/usePagedList`) and till sessions; voiding is for staff or the sale's own cashier while the session is open.
- **Roles.** Operators sign in with an 8-digit code (`CodePad`, keyboard or on-screen keypad; `POST /auth/code-login/`). `roles.js` says which screens each role (`till`, `demand`, `freight`, `supplier`, `stock`) gets and where it lands; `hooks/useMe` reads `/auth/me/` and `MainLayout` shows only those tabs and redirects everything else to the role's home. Staff and regular users have no role and see every tab, including the till and the three overviews. The backend (`authentication/role_access.py`) is what really refuses access; the UI only avoids offering what would fail. Admins create operators on the Team page: the code is generated by the server and shown once, because only a hash is stored.
- **Path alias.** `@` is `src/`, e.g. `import { Button } from '@/components/ui'`.

## Testing

Tests sit next to the code in `__tests__/` folders and run on Vitest with Testing Library and jest-dom (set up in `src/setupTests.js`). `src/tests/modules.test.js` imports every module in `src/` as a smoke test, so a broken import fails the suite. RxDB tests use the in-memory storage; HTTP is mocked at `utils/axios` or the axios adapter.

## Backend behaviours to know about

- Creating branches, and listing or creating invitations, is staff-only. The seeded demo owner is not `is_staff`, so those return 403 until you make them staff.
- Creating a stock batch does not change `Product.stock_quantity`; only stock movements do.
- Products with stock but no stock batch cannot be sold at a till: sales take stock from batches, so receive a batch first. Expired batches are never sold.
- Voiding and closing are limited to staff or the person who rang up the sale / opened the till. Creating tills is staff-only.
- Branch demand alerts are listed at `GET /common/api/alerts/demand/` (open by default; `?status=handled` or `all`), shown on the Demand page.
- The API docs are at `/api/docs/` on the backend.
