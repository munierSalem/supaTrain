'use client';

import { useEffect, useState } from 'react';
import { getBrowserClient } from '@/lib/supabaseBrowser';

export default function Home() {
  const supabase = getBrowserClient();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'http://localhost:3000/auth/callback' },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>supaTrain</h1>

      {userEmail ? (
        <>
          <p>Signed in as <b>{userEmail}</b></p>
          <button onClick={signOut}>Sign out</button>
        </>
      ) : (
        <>
          <p>Not signed in.</p>
          <button onClick={signIn}>Sign in with Google</button>
        </>
      )}
    </main>
  );
}
