import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import './lib/i18n';

// Components
import { Layout } from './components/Layout';
import { Welcome } from './routes/Welcome';
import { Research } from './routes/Research';
import { Visual } from './routes/Visual';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
    mutations: {
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/research" element={<Research />} />
            <Route path="/brand" element={<div className="text-center p-8">Brand step coming soon...</div>} />
            <Route path="/services" element={<div className="text-center p-8">Services step coming soon...</div>} />
            <Route path="/market" element={<div className="text-center p-8">Market step coming soon...</div>} />
            <Route path="/competitors" element={<div className="text-center p-8">Competitors step coming soon...</div>} />
            <Route path="/visual" element={<Visual />} />
            <Route path="/export" element={<div className="text-center p-8">Export step coming soon...</div>} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);

