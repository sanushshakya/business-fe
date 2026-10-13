import React from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import LoginForm from './components/LoginForm';
import MainLayout from './components/MainLayout';
import PrivateRoute from './components/PrivateRoute';
import BranchesPage from './pages/BranchesPage';
import EventsPage from './pages/EventsPage';
import FreightAlertsPage from './pages/FreightAlertsPage';
import InventoryListPage from './pages/InventoryListPage';
import PriceChangesPage from './pages/PriceChangesPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SettingsPage from './pages/SettingsPage';
import StockAlertsPage from './pages/StockAlertsPage';
import SuppliersListPage from './pages/SuppliersListPage';
import TeamPage from './components/TeamPage';

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
          <Route path="inventory" element={<InventoryListPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="freight" element={<FreightAlertsPage />} />
          <Route path="suppliers" element={<SuppliersListPage />} />
          <Route path="branches" element={<BranchesPage />} />
          <Route path="waste" element={<PriceChangesPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  </ErrorBoundary>
);

export default App;
