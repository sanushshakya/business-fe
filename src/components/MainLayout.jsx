/**
 * MainLayout: sidebar navigation (bottom bar on small screens), top bar and the routed page.
 */
import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import ConnectivityBadge from './ConnectivityBadge';
import SyncStatus from './SyncStatus';
import { Button } from '@/components/ui';
import { logout } from '../services/authService';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Stock Alerts', end: true },
  { to: '/dashboard/pos', label: 'Till' },
  { to: '/dashboard/sales', label: 'Sales' },
  { to: '/dashboard/inventory', label: 'Inventory' },
  { to: '/dashboard/events', label: 'Events' },
  { to: '/dashboard/freight', label: 'Freight' },
  { to: '/dashboard/demand', label: 'Demand' },
  { to: '/dashboard/suppliers', label: 'Suppliers' },
  { to: '/dashboard/branches', label: 'Branches' },
  { to: '/dashboard/waste', label: 'Waste' },
  { to: '/dashboard/team', label: 'Team' },
  { to: '/dashboard/settings', label: 'Settings' },
];

const linkClass = ({ isActive }) =>
  `block rounded-md px-3 py-2 text-sm font-medium ${
    isActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'
  }`;

const MainLayout = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 md:flex-row">
      <nav className="order-last border-t border-gray-200 bg-white p-2 md:order-none md:w-56 md:border-r md:border-t-0 md:p-4">
        <h1 className="mb-4 hidden text-lg font-bold text-primary md:block">Supply Chain IQ</h1>
        <ul className="flex gap-1 md:block md:space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.to} className="flex-1 md:flex-none">
              <NavLink to={item.to} end={item.end} className={linkClass}>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <ConnectivityBadge />
            <SyncStatus />
          </div>
          <Button variant="secondary" onClick={handleLogout}>
            Log out
          </Button>
        </header>
        <main className="flex-1 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
