import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import './lib/i18n';

// Components
import { Layout } from './components/Layout';
import { Welcome } from './routes/Welcome';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/research" element={<div className="text-center p-8">Research step coming soon...</div>} />
          <Route path="/brand" element={<div className="text-center p-8">Brand step coming soon...</div>} />
          <Route path="/services" element={<div className="text-center p-8">Services step coming soon...</div>} />
          <Route path="/market" element={<div className="text-center p-8">Market step coming soon...</div>} />
          <Route path="/competitors" element={<div className="text-center p-8">Competitors step coming soon...</div>} />
          <Route path="/visual" element={<div className="text-center p-8">Visual step coming soon...</div>} />
          <Route path="/export" element={<div className="text-center p-8">Export step coming soon...</div>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  </React.StrictMode>
);

