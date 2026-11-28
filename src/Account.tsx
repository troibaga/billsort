import { useEffect, useState, useSyncExternalStore, type FormEvent } from 'react';
import { isAuthError } from '@supabase/supabase-js';
import type { AccountIdentity } from './useAccountSession';
import { PolicyLinks } from './Policy';
import { auth, callbackUrl } from './auth';
import { isDarkMode, setDarkMode, subscribeTheme } from './theme';
import './account.css';

const messages: Record<string, string> = {
  invalid_credentials: 'Check your email and password and try again.',
  email_not_confirmed: 'Confirm your email address, then log in.',
  weak_password: 'Choose a stronger password and try again.',
  over_request_rate_limit: 'Too many attempts. Try again later.',
};

export function Account({ signup, user, initialError, verificationError }: {
  signup: boolean; user: AccountIdentity | null; initialError: string; verificationError: string;
}) {
  const [pending, setPending] = useState<'email' | 'google' | 'logout' | null>(null);
  const busy = pending !== null;
  const dark = useSyncExternalStore(subscribeTheme, isDarkMode);
  const [error, setError] = useState(initialError);
  const [notice, setNotice] = useState('');
  const title = user ? 'Your account' : signup ? 'Create an account' : 'Log in to BillWise';

  useEffect(() => {
    const previous = document.title;
    document.title = title + ' | BillWise';
    window.scrollTo(0, 0);
    return () => { document.title = previous; };
  }, [title]);

  useEffect(() => {
    // A cancelled Google redirect can restore this document from the back/forward cache.
    function restore(event: PageTransitionEvent) { if (event.persisted) setPending(null); }
    window.addEventListener('pageshow', restore);
    return () => window.removeEventListener('pageshow', restore);
  }, []);

  async function perform(method: NonNullable<typeof pending>, action: () => Promise<void>) {
    setPending(method);
    setError('');
    setNotice('');
    try {
      await action();
      if (method !== 'google') setPending(null);
    } catch (cause) {
      setError(isAuthError(cause) ? messages[cause.code ?? ''] ?? cause.message
        : 'BillWise could not finish this request. Check your connection and try again.');
      setPending(null);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!auth || busy) return;
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email')).trim();
    const password = String(data.get('password'));
    const client = auth;
    void perform('email', async () => {
      const { data, error } = signup
        ? await client.signUp({ email, password, options: { emailRedirectTo: callbackUrl } })
        : await client.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.session) setNotice('Check your email and open the confirmation link in this browser to finish signing up.');
    });
  }

  function googleLogin() {
    if (!auth || busy) return;
    const client = auth;
    void perform('google', async () => {
      const { error } = await client.signInWithOAuth({ provider: 'google', options: { redirectTo: callbackUrl } });
      if (error) throw error;
    });
  }

  function logout() {
    if (!auth || busy) return;
    const client = auth;
    void perform('logout', async () => {
      const { error } = await client.signOut({ scope: 'local' });
      if (error) throw error;
    });
  }

  return <div className="account-page">
    <header><div className="account-bar">
      <a className="brand" href={user ? '#overview' : '/'}><img width="42" height="42" src="/icons/billsort-192.png" alt="" />BillWise</a>
      {user && <a href="#overview">Back to planner</a>}
    </div></header>
    <main className="account-main page-enter">
      <section className="account-card" aria-labelledby="account-title">
        <h1 id="account-title">{title}</h1>
        {user ? <>
          <p className="account-identity">{user.email}</p>
          <p>Your bill plan is stored in this browser.</p>
          <button type="button" role="switch" className="theme-switch"
            aria-checked={dark} onClick={() => setDarkMode(!dark)}>
            Dark mode <span className="switch-track" aria-hidden="true" />
          </button>
          <button className="secondary" disabled={busy} data-pending={pending === 'logout'} onClick={logout}>
            {pending === 'logout' ? 'Logging out…' : 'Log out'}
          </button>
        </> : <>
          {!auth && <p className="account-note" role="status">Sign-in is unavailable until BillWise connects to Supabase.</p>}
          <button className="secondary google-login" disabled={!auth || busy} data-pending={pending === 'google'}
            onClick={googleLogin}>{pending === 'google' ? 'Opening Google…' : 'Continue with Google'}</button>
          <div className="account-divider">or use email</div>
          <form onSubmit={submit}>
            <label>Email address<input type="email" name="email" autoComplete="email" required /></label>
            <label>Password<input type="password" name="password" autoComplete={signup ? 'new-password' : 'current-password'}
              required minLength={signup ? 6 : undefined} /></label>
            <button className="primary" disabled={!auth || busy} data-pending={pending === 'email'}>
              {pending === 'email' ? (signup ? 'Creating account…' : 'Logging in…') : (signup ? 'Create account' : 'Log in')}
            </button>
          </form>
          <p className="account-switch">{signup ? 'Already have an account? ' : 'New to BillWise? '}
            <a href={signup ? '#login' : '#signup'}>{signup ? 'Log in' : 'Create an account'}</a></p>
        </>}
        {notice && <p className="account-note" role="status">{notice}</p>}
        {(error || verificationError) && <p className="error" role="alert">{error || verificationError}</p>}
        <PolicyLinks />
      </section>
    </main>
  </div>;
}
