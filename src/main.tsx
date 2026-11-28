import { createRoot } from 'react-dom/client';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { finishAuthCallback } from './auth';
import { useAccountSession } from './useAccountSession';
import { Policy } from './Policy';
import { Account } from './Account';
import { App } from './App';
import { Landing } from './Landing';
import { initializeTheme } from './theme';
import './style.css';
import './dark-mode.css';

function subscribe(callback: () => void) {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}

function currentView() {
  const hash = location.hash;
  if (['#terms', '#privacy', '#login', '#signup', '#account', '#app'].includes(hash)) return hash;
  const installed = matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone;
  return installed || ['#overview', '#bills', '#schedule'].includes(location.hash) ? 'planner' : 'landing';
}

function LoadingPage({ message }: { message: string }) {
  return <main className="session-loading" role="status">
    <img src="/icons/billsort-192.png" width="48" height="48" alt="" />
    <span>{message}</span>
  </main>;
}

function Entry({ callbackError }: { callbackError: string }) {
  const view = useSyncExternalStore(subscribe, currentView);
  const [initialError, setInitialError] = useState(callbackError);
  useEffect(() => {
    if (view !== '#login') setInitialError('');
  }, [view]);
  const { user, verificationError } = useAccountSession();
  const publicPage = view === 'landing' || view === '#privacy' || view === '#terms';
  let destination = '';
  if (!publicPage && user !== undefined) {
    if (!user && view !== '#login' && view !== '#signup') destination = '#login';
    if (user && ['#app', '#login', '#signup'].includes(view)) destination = '#overview';
  }
  useEffect(() => {
    if (destination) location.replace(destination);
  }, [destination]);
  if (view === 'landing') return <Landing />;
  if (view === '#terms' || view === '#privacy') return <Policy privacy={view === '#privacy'} />;
  if (user === undefined || destination) return <LoadingPage message="Opening BillWise…" />;
  if (view === 'planner' && user) return <App key={user.id} userId={user.id} />;
  return <Account key={view} signup={view === '#signup'} user={user}
    verificationError={verificationError} initialError={initialError} />;
}

initializeTheme();
const root = document.getElementById('root');
if (!root) throw new Error('Missing app container.');
const app = createRoot(root);
if (new URLSearchParams(location.search).get('auth') === 'callback') {
  app.render(<LoadingPage message="Finishing sign-in…" />);
}
void finishAuthCallback().then(error => app.render(<Entry callbackError={error} />));

if (import.meta.env.PROD && window.isSecureContext && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(error => {
      console.warn('BillWise offline setup failed.', error);
    });
  });
}
