import React from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import LoginForm from './components/LoginForm';
import MainLayout from './components/MainLayout';
import PrivateRoute from './components/PrivateRoute';
import BranchesPage from './pages/BranchesPage';
import DemandAlertsPage from './pages/DemandAlertsPage';
import DemandPovPage from './pages/DemandPovPage';
import EventsPage from './pages/EventsPage';
import FreightAlertsPage from './pages/FreightAlertsPage';
import FreightPovPage from './pages/FreightPovPage';
import InventoryListPage from './pages/InventoryListPage';
import PosPage from './pages/PosPage';
import PriceChangesPage from './pages/PriceChangesPage';
import SalesPage from './pages/SalesPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SettingsPage from './pages/SettingsPage';
import StockAlertsPage from './pages/StockAlertsPage';
import TransfersPage from './pages/TransfersPage';
import RequisitionsPage from './pages/RequisitionsPage';
import BreakdownsPage from './pages/BreakdownsPage';
import WriteOffsPage from './pages/WriteOffsPage';
import YieldWastePage from './pages/YieldWastePage';
import SyncExceptionsPage from './pages/SyncExceptionsPage';
import SuppliersListPage from './pages/SuppliersListPage';
import SupplierPovPage from './pages/SupplierPovPage';
import TeamPage from './components/TeamPage';
import CustomersPage from './pages/b2b/CustomersPage';
import PriceListsPage from './pages/b2b/PriceListsPage';
import OrdersPage from './pages/b2b/OrdersPage';
import OrderEntryPage from './pages/b2b/OrderEntryPage';
import OrderDetailPage from './pages/b2b/OrderDetailPage';
import InvoicesPage from './pages/b2b/InvoicesPage';
import CreditNotesPage from './pages/b2b/CreditNotesPage';
import AccountsPage from './pages/AccountsPage';
import DashboardPage from './pages/DashboardPage';
import PickingPage from './pages/b2b/PickingPage';
import PickPage from './pages/b2b/PickPage';
import RunsPage from './pages/b2b/RunsPage';
import RunPage from './pages/b2b/RunPage';
import DriverPage from './pages/b2b/DriverPage';

const App = () => (
  <ErrorBoundary>
    <Router>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<StockAlertsPage />} />
          <Route path="pov/demand" element={<DemandPovPage />} />
          <Route path="pov/freight" element={<FreightPovPage />} />
          <Route path="pov/supplier" element={<SupplierPovPage />} />
          <Route path="pos" element={<PosPage />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="inventory" element={<InventoryListPage />} />
          <Route path="transfers" element={<TransfersPage />} />
          <Route path="requisitions" element={<RequisitionsPage />} />
          <Route path="breakdowns" element={<BreakdownsPage />} />
          <Route path="write-offs" element={<WriteOffsPage />} />
          <Route path="yield-waste" element={<YieldWastePage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="freight" element={<FreightAlertsPage />} />
          <Route path="demand" element={<DemandAlertsPage />} />
          <Route path="suppliers" element={<SuppliersListPage />} />
          <Route path="branches" element={<BranchesPage />} />
          <Route path="waste" element={<PriceChangesPage />} />
          <Route path="sync-exceptions" element={<SyncExceptionsPage />} />
          <Route path="b2b/customers" element={<CustomersPage />} />
          <Route path="b2b/price-lists" element={<PriceListsPage />} />
          <Route path="b2b/orders" element={<OrdersPage />} />
          <Route path="b2b/orders/new" element={<OrderEntryPage />} />
          <Route path="b2b/orders/:id" element={<OrderDetailPage />} />
          <Route path="b2b/invoices" element={<InvoicesPage />} />
          <Route path="b2b/credit-notes" element={<CreditNotesPage />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="overview" element={<DashboardPage />} />
          <Route path="b2b/picking" element={<PickingPage />} />
          <Route path="b2b/picking/:id" element={<PickPage />} />
          <Route path="b2b/runs" element={<RunsPage />} />
          <Route path="b2b/runs/:id" element={<RunPage />} />
          <Route path="driver" element={<DriverPage />} />
          <Route path="driver/:id" element={<DriverPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  </ErrorBoundary>
);

export default App;
