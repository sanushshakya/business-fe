# CLAUDE.md

IQ frontend (iq-fe): React 18 + Vite SPA. Commands and detailed notes are in the workspace CLAUDE.md (one folder up), section "Frontend".

## Workspace rules
Shared rules live in the workspace CLAUDE.md (one folder up). The backend decides prices, VAT and
stock; the UI never computes a total that it sends as truth.

## Where things go in this repo
- API calls only through `src/utils/axios.js` and react-query hooks.
- Role-gated tabs in `src/roles.js` must match the backend allow-list (the backend is the real gate).
- Offline data and queues: `src/offline/` (RxDB). Barcode parsers: `src/utils/barcodes/` (from G17).
- Till components: `src/components/pos/`.
- Every new screen gets a vitest test for its main path and permission hiding.
