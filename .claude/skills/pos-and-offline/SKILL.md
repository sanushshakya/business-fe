---
name: pos-and-offline
description: Use when changing the till (point of sale), sales history, stock receipts, offline queue or sync behaviour.
---

# Till and offline rules

## Till (`pages/PosPage`, `pages/SalesPage`, `components/pos/*`)
- Shift flow: open session (`OpenTillForm`) → sell (`ProductPicker`, `Cart` via `hooks/useCart`, `PaymentPanel`, `Receipt`) → close with a cash count (`CashUpForm`). History, voids and sessions are on `SalesPage`.
- Backend: `sales` app (`/sales/sessions/`, `/sales/sales/`, `.../close/`, `.../void/`). Selling allocates stock FEFO from **batches**; a product with only `stock_quantity` cannot be sold.
- **Money is in pence** (`utils/money`); never use floats for totals or change.
- **Selling is online-only**: charging pauses while offline. Every charge sends a `client_ref` UUID, reused for an unchanged retry so a double-click or retry cannot double-sell (the backend is idempotent on it). Generate a new one only when the cart changes.
- `utils/http#apiErrorMessage` turns DRF errors into text; show server messages (e.g. insufficient stock) to the cashier.
- Till operators only reach their allow-listed endpoints (`config/authentication/role_access.py`).
- The till lists all products and shows the first 60 matches of a search; keep that cap when changing the picker.

## Offline layer
- Stock receipts are the **only** offline-capable write. `offline/OfflineProvider.jsx` (in `main.jsx`) opens RxDB (`offlineDB.js`); `Inventory` calls `queueReceipt` when offline or the server is unreachable/5xx. `utils/http#isRejection` is the shared rule: only 4xx is a real rejection.
- `hooks/useSyncManager` flushes the queue on the `online` event and at startup. 4xx-rejected receipts get an `error` and are not retried until the user clicks Retry in `SyncStatus`.
- `rxdbBatchService` and `WebSocketService` are unused (the backend `/ws/sync/` is a stub). Reads are not cached across reloads, so the product list needs one online visit per page load.
- Do not make other writes offline-capable without designing conflict handling and idempotency first.
- Receiving a batch does not change `Product.stock_quantity` (only stock movements do); do not show a count that assumes it does.
