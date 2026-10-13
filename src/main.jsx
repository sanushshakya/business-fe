import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { OfflineProvider } from './offline/OfflineProvider';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Serve cached data (and let requests fail fast) instead of pausing while offline.
      networkMode: 'offlineFirst',
      retry: (failureCount, error) => failureCount < 1 && !(error.response?.status < 500),
      refetchOnWindowFocus: false,
    },
    // Never park a save waiting for a connection; a failed send is queued on the device instead.
    mutations: { networkMode: 'always' },
  },
});

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <OfflineProvider>
        <App />
      </OfflineProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
