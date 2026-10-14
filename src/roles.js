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
];

const ITEMS = {
  stockAlerts: { to: '/dashboard', label: 'Stock Alerts', end: true },
  till: { to: '/dashboard/pos', label: 'Till' },
  sales: { to: '/dashboard/sales', label: 'Sales' },
  demandView: { to: '/dashboard/pov/demand', label: 'Demand overview' },
  freightView: { to: '/dashboard/pov/freight', label: 'Freight overview' },
  supplierView: { to: '/dashboard/pov/supplier', label: 'Supplier overview' },
  inventory: { to: '/dashboard/inventory', label: 'Inventory' },
  events: { to: '/dashboard/events', label: 'Events' },
  freight: { to: '/dashboard/freight', label: 'Freight' },
  demand: { to: '/dashboard/demand', label: 'Demand' },
  suppliers: { to: '/dashboard/suppliers', label: 'Suppliers' },
  branches: { to: '/dashboard/branches', label: 'Branches' },
  waste: { to: '/dashboard/waste', label: 'Waste' },
  team: { to: '/dashboard/team', label: 'Team' },
  settings: { to: '/dashboard/settings', label: 'Settings' },
};

const ALL = Object.values(ITEMS);

const ROLE_ITEMS = {
  till: [ITEMS.till, ITEMS.sales],
  demand: [ITEMS.demandView, ITEMS.demand, ITEMS.events, ITEMS.stockAlerts],
  freight: [ITEMS.freightView, ITEMS.freight],
  supplier: [ITEMS.supplierView, ITEMS.suppliers],
  stock: [ITEMS.stockAlerts, ITEMS.inventory, ITEMS.waste],
};

/** Where an operator lands after signing in, and where they are sent from a screen that is not theirs. */
export const ROLE_HOME = {
  till: '/dashboard/pos',
  demand: '/dashboard/pov/demand',
  freight: '/dashboard/pov/freight',
  supplier: '/dashboard/pov/supplier',
  stock: '/dashboard',
};

export const navItemsFor = (role) => ROLE_ITEMS[role] ?? ALL;

const normalise = (path) => path.replace(/\/$/, '') || '/';

export const canOpen = (role, path) => !role || navItemsFor(role).some((item) => item.to === normalise(path));
