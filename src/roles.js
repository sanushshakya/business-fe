/**
 * Roles and what each one sees. Staff and regular users have no role and get every screen.
 *
 * This only decides what to offer; the backend (`authentication/role_access.py`) is what actually refuses
 * anything outside a role's area.
 */

export const ROLES = [
  { value: 'till', label: 'Till operator' },
  { value: 'demand', label: 'Demand planner' },
  { value: 'freight', label: 'Freight manager' },
  { value: 'supplier', label: 'Supplier manager' },
  { value: 'stock', label: 'Stock controller' },
  { value: 'driver', label: 'Delivery driver' },
];

const ITEMS = {
  stockAlerts: { to: '/dashboard', label: 'Stock Alerts', end: true },
  till: { to: '/dashboard/pos', label: 'Till' },
  sales: { to: '/dashboard/sales', label: 'Sales' },
  demandView: { to: '/dashboard/pov/demand', label: 'Demand overview' },
  freightView: { to: '/dashboard/pov/freight', label: 'Freight overview' },
  supplierView: { to: '/dashboard/pov/supplier', label: 'Supplier overview' },
  inventory: { to: '/dashboard/inventory', label: 'Inventory' },
  transfers: { to: '/dashboard/transfers', label: 'Transfers' },
  requisitions: { to: '/dashboard/requisitions', label: 'Requisitions' },
  breakdowns: { to: '/dashboard/breakdowns', label: 'Breakdowns' },
  writeOffs: { to: '/dashboard/write-offs', label: 'Write-offs' },
  yieldWaste: { to: '/dashboard/yield-waste', label: 'Yield & waste' },
  events: { to: '/dashboard/events', label: 'Events' },
  freight: { to: '/dashboard/freight', label: 'Freight' },
  demand: { to: '/dashboard/demand', label: 'Demand' },
  suppliers: { to: '/dashboard/suppliers', label: 'Suppliers' },
  branches: { to: '/dashboard/branches', label: 'Branches' },
  waste: { to: '/dashboard/waste', label: 'Waste' },
  syncExceptions: { to: '/dashboard/sync-exceptions', label: 'Sync exceptions' },
  // B2B office (G46a): staff only, so in no role's list below.
  tradeCustomers: { to: '/dashboard/b2b/customers', label: 'Trade customers' },
  priceLists: { to: '/dashboard/b2b/price-lists', label: 'Price lists' },
  tradeOrders: { to: '/dashboard/b2b/orders', label: 'Trade orders' },
  invoices: { to: '/dashboard/b2b/invoices', label: 'Invoices' },
  creditNotes: { to: '/dashboard/b2b/credit-notes', label: 'Credit notes' },
  // Till promotions (G58): staff only, so in no role's list below.
  promotions: { to: '/dashboard/promotions', label: 'Promotions' },
  // The books (G54): staff only, so in no role's list below.
  accounts: { to: '/dashboard/accounts', label: 'Accounts' },
  // B2B warehouse and road (G46b). `nested`: the screens under it (an order, a run) open too.
  picking: { to: '/dashboard/b2b/picking', label: 'Picking', nested: true },
  runs: { to: '/dashboard/b2b/runs', label: 'Delivery runs', nested: true },
  driver: { to: '/dashboard/driver', label: 'My deliveries', nested: true },
  team: { to: '/dashboard/team', label: 'Team' },
  settings: { to: '/dashboard/settings', label: 'Settings' },
};

const ALL = Object.values(ITEMS);

const ROLE_ITEMS = {
  till: [ITEMS.till, ITEMS.sales],
  demand: [ITEMS.demandView, ITEMS.demand, ITEMS.events, ITEMS.stockAlerts],
  freight: [ITEMS.freightView, ITEMS.freight],
  supplier: [ITEMS.supplierView, ITEMS.suppliers],
  stock: [
    ITEMS.stockAlerts,
    ITEMS.inventory,
    ITEMS.transfers,
    ITEMS.requisitions,
    ITEMS.breakdowns,
    ITEMS.writeOffs,
    ITEMS.yieldWaste,
    ITEMS.waste,
    ITEMS.picking,
  ],
  driver: [ITEMS.driver],
};

/** Where an operator lands after signing in, and where they are sent from a screen that is not theirs. */
export const ROLE_HOME = {
  till: '/dashboard/pos',
  demand: '/dashboard/pov/demand',
  freight: '/dashboard/pov/freight',
  supplier: '/dashboard/pov/supplier',
  stock: '/dashboard',
  driver: '/dashboard/driver',
};

export const navItemsFor = (role) => ROLE_ITEMS[role] ?? ALL;

const normalise = (path) => path.replace(/\/$/, '') || '/';

export const canOpen = (role, path) =>
  !role ||
  navItemsFor(role).some(
    (item) => item.to === normalise(path) || (item.nested && normalise(path).startsWith(`${item.to}/`))
  );
