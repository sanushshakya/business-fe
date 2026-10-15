---
name: add-dashboard-chart
description: Use when adding a KPI card, chart or summary widget to a dashboard page.
---

# Dashboard widgets

- Charts use **recharts** (see `src/components/StockChart.jsx`); KPI tiles use `KPICard.jsx`; alert summaries `RecentAlertsSummary.jsx`. Reuse or extend these before creating new ones.
- Keep the chart component presentational: it receives already-shaped data (`[{ name, value }]`) as props, and the page does the fetching with `useApiList` / `useQuery`.
- Wrap in `ResponsiveContainer` with a fixed-height parent so it renders in jsdom-free layouts; give series accessible labels.
- Always handle all four states through `QueryState`: loading (Skeleton), error, empty (`emptyMessage`), data. An empty chart must say so.
- Derive numbers from API fields (e.g. `GET /inventory/products/<id>/stock-projection/`, stock/demand alerts); do not invent values. Format currency with `formatCents` and dates with `date-fns`.
- Test: recharts does not lay out in jsdom, so test the component with data (labels/legend/KPI text present) and the empty state, and mock `ResponsiveContainer` if sizes are needed.
- If the data needs a new endpoint, add it on the backend (`add-tenant-endpoint`) and to the role allow-list for the roles that should see the widget.
