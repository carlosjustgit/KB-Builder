import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import './lib/i18n';

// Components
import { Layout } from './components/Layout';
import { Toaster } from './components/ui/toaster';
import { StepContentProvider } from './contexts/StepContentContext';

// Lazy load all routes
const Welcome = React.lazy(() => import('./routes/Welcome').then(m => ({ default: m.Welcome })));
const Research = React.lazy(() => import('./routes/Research').then(m => ({ default: m.Research })));
const Brand = React.lazy(() => import('./routes/Brand').then(m => ({ default: m.Brand })));
const Services = React.lazy(() => import('./routes/Services').then(m => ({ default: m.Services })));
const Market = React.lazy(() => import('./routes/Market').then(m => ({ default: m.Market })));
const Competitors = React.lazy(() => import('./routes/Competitors').then(m => ({ default: m.Competitors })));
const Visual = React.lazy(() => import('./routes/Visual').then(m => ({ default: m.Visual })));
const ExportStep = React.lazy(() => import('./routes/Export').then(m => ({ default: m.ExportStep })));

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Wait for i18n to initialize before rendering
setTimeout(() => {
  try {
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <StepContentProvider>
              <Layout>
                <React.Suspense fallback={<div style={{padding: '50px'}}>Loading...</div>}>
                  <Routes>
                    <Route path="/" element={<Welcome />} />
                    <Route path="/research" element={<Research />} />
                    <Route path="/brand" element={<Brand />} />
                    <Route path="/services" element={<Services />} />
                    <Route path="/market" element={<Market />} />
                    <Route path="/competitors" element={<Competitors />} />
                    <Route path="/visual" element={<Visual />} />
                    <Route path="/export" element={<ExportStep />} />
                  </Routes>
                </React.Suspense>
              </Layout>
            </StepContentProvider>
            <Toaster />
          </BrowserRouter>
        </QueryClientProvider>
      </React.StrictMode>
    );
    console.log('App rendered successfully');
  } catch (error) {
    console.error('Error rendering app:', error);
    document.getElementById('root')!.innerHTML = `<div style="padding: 50px; color: red;">Error: ${error}</div>`;
  }
}, 100);
