import { useEffect, useState } from 'react';
import { auth } from './auth';

export type AccountIdentity = { id: string; email?: string };

export function useAccountSession() {
  const [user, setUser] = useState<AccountIdentity | null | undefined>(auth ? undefined : null);
  const [verificationError, setVerificationError] = useState('');

  useEffect(() => {
    const client = auth;
    if (!client) return;
    let revision = 0;
    let verifiedId: string | undefined;
    let expires: number | undefined;
    let pending: number | undefined;

    function lock() {
      window.clearTimeout(expires);
      verifiedId = undefined;
      setUser(null);
    }

    const { data } = client.onAuthStateChange((_event, session) => {
      const current = ++revision;
      window.clearTimeout(pending);
      setVerificationError('');
      if (!session) { lock(); return; }
      if (verifiedId !== session.user.id) {
        window.clearTimeout(expires);
        verifiedId = undefined;
        setUser(undefined);
      }

      // Supabase auth listeners run under a lock. Verify after the listener returns.
      pending = window.setTimeout(async () => {
        try {
          const { data, error } = await client.getClaims(session.access_token);
          if (current !== revision) return;
          const claims = data?.claims;
          if (error || !claims?.sub || claims.sub !== session.user.id ||
              !Number.isFinite(claims.exp) || claims.exp * 1000 <= Date.now() || claims.is_anonymous) {
            throw new Error('Invalid session');
          }
          verifiedId = claims.sub;
          setUser({ id: claims.sub, email: claims.email });
          window.clearTimeout(expires);
          expires = window.setTimeout(lock, claims.exp * 1000 - Date.now());
        } catch {
          if (current !== revision) return;
          lock();
          setVerificationError('Your session could not be verified. Connect to the internet and log in again.');
        }
      }, 0);
    });
    return () => {
      revision++;
      window.clearTimeout(expires);
      window.clearTimeout(pending);
      data.subscription.unsubscribe();
    };
  }, []);
  return { user, verificationError };
}
