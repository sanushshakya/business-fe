import React from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import LoginForm from './components/LoginForm';
import MainLayout from './components/MainLayout';
import PrivateRoute from './components/PrivateRoute';
import EventsPage from './pages/EventsPage';
import InventoryListPage from './pages/InventoryListPage';
import StockAlertsPage from './pages/StockAlertsPage';

const App = () => (
  <ErrorBoundary>
    <Router>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
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
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  </ErrorBoundary>
);

export default App;
