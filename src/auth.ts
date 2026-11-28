import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// BillWise uses hash routes. Finish the PKCE exchange explicitly before routing.
export const auth = url && key
  ? createClient(url, key, { auth: { flowType: 'pkce', detectSessionInUrl: false } }).auth
  : null;

export const callbackUrl = new URL('/?auth=callback', window.location.origin).href;

export async function finishAuthCallback() {
  const query = new URLSearchParams(location.search);
  if (query.get('auth') !== 'callback') return '';
  const code = query.get('code');
  let message = 'Sign-in was interrupted. Please try again.';
  if (auth && code) {
    try {
      const result = await auth.exchangeCodeForSession(code);
      message = result.data.session && !result.error ? '' : 'This sign-in link could not be used. Open it in the browser where you started, or sign in again.';
    } catch {
      message = 'Unable to finish sign-in. Check your connection and try again.';
    }
  }
  history.replaceState(null, '', message ? '/#login' : '/#overview');
  return message;
}
