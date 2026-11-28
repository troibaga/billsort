import { createRoot } from 'react-dom/client';
import { useSyncExternalStore } from 'react';
import { App } from './App';
import { Landing } from './Landing';
import './style.css';

function subscribe(callback: () => void) {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}

function showPlanner() {
  const installed = matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone;
  return Boolean(installed || ['#overview', '#bills', '#schedule'].includes(location.hash));
}

function Entry() {
  return useSyncExternalStore(subscribe, showPlanner) ? <App /> : <Landing />;
}

const root = document.getElementById('root');
if (!root) throw new Error('Missing app container.');
createRoot(root).render(<Entry />);

if (import.meta.env.PROD && window.isSecureContext && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(error => {
      console.warn('BillWise offline setup failed.', error);
    });
  });
}
