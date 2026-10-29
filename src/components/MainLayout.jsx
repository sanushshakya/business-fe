/**
 * MainLayout: sidebar navigation (bottom bar on small screens), top bar and the routed page.
 */
import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import ConnectivityBadge from './ConnectivityBadge';
import StorefrontSyncBadge from './StorefrontSyncBadge';
import SyncStatus from './SyncStatus';
import { Button, Skeleton } from '@/components/ui';
import useMe, { ME_KEY } from '../hooks/useMe';
import useStorefrontSync from '../hooks/useStorefrontSync';
import { canOpen, navItemsFor, ROLE_HOME } from '../roles';
import { logout } from '../services/authService';
import useAuthStore from '../stores/authStore';

const linkClass = ({ isActive }) =>
  `block rounded-md px-3 py-2 text-sm font-medium ${
    isActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'
  }`;

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const me = useMe();
  const role = me.data?.role || '';
  const navItems = navItemsFor(role);
  // Operators are refused by /ws/sync/; everyone else sees the online shop's sync status.
  const accessToken = useAuthStore((state) => state.accessToken);
  const shopSync = useStorefrontSync(me.data && !role ? accessToken : null);

  const handleLogout = async () => {
    await logout();
    queryClient.removeQueries({ queryKey: ME_KEY });
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 md:flex-row">
      <nav className="order-last border-t border-gray-200 bg-white p-2 md:order-none md:w-56 md:border-r md:border-t-0 md:p-4">
        <h1 className="mb-4 hidden text-lg font-bold text-primary md:block">Supply Chain IQ</h1>
        <ul className="flex gap-1 md:block md:space-y-1">
          {navItems.map((item) => (
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
            <StorefrontSyncBadge status={shopSync.status} disconnected={shopSync.disconnected} />
          </div>
          <div className="flex items-center gap-3">
            {role && (
              <span className="text-sm text-gray-700">
                {me.data.name} · {me.data.role_label}
              </span>
            )}
            <Button variant="secondary" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4">
          {me.isLoading ? (
            <Skeleton className="h-8 w-full" />
          ) : !canOpen(role, location.pathname) ? (
            <Navigate to={ROLE_HOME[role]} replace />
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
