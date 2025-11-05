'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ConnectStrava() {
  const router = useRouter();

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
    const redirectUri = encodeURIComponent('http://localhost:3000/strava/callback');
    const scope = 'read,activity:read_all';
    const url = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&approval_prompt=auto&scope=${scope}`;
    window.location.href = url;
  }, []);

  return <p>Redirecting to Strava...</p>;
}
