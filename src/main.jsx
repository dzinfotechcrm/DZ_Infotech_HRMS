import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          containerStyle={{
            top: 24,
            right: 24,
            zIndex: 99999,
          }}
          toastOptions={{
            duration: 3500,
            className: 'dz-toast-item',
            style: {
              background: '#ffffff',
              color: '#0f172a',
              fontSize: '13px',
              fontWeight: 500,
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08)',
              padding: '12px 16px',
              maxWidth: '420px',
              wordBreak: 'break-word',
            },
            success: {
              duration: 3500,
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
              style: {
                border: '1px solid #bbf7d0',
                background: '#ffffff',
                color: '#15803d',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
              style: {
                border: '1px solid #fecaca',
                background: '#ffffff',
                color: '#b91c1c',
              },
            },
            loading: {
              style: {
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
              },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
