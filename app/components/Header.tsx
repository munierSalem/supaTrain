'use client';

import { useEffect, useState } from 'react';
import { getBrowserClient } from '@/lib/supabaseBrowser';

export default function Header() {
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
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 24px',
        backgroundColor: '#111',
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1 style={{ fontSize: '1.2rem', fontWeight: 600 }}>supaTrain</h1>

      {userEmail ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '0.9rem' }}>{userEmail}</span>
          <button
            onClick={signOut}
            style={{
              background: '#444',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              padding: '6px 12px',
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      ) : (
        <button
          onClick={signIn}
          style={{
            background: '#0070f3',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '6px 12px',
            cursor: 'pointer',
          }}
        >
          Sign in with Google
        </button>
      )}
    </header>
  );
}
