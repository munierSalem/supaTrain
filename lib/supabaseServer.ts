import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function getServerClient() {
  const cookieStore = cookies();

  // check which API shape is available (older vs newer Next)
  const hasGetAll = typeof (cookieStore as any).getAll === 'function';

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: hasGetAll
        ? {
            getAll: () => (cookieStore as any).getAll(),
            setAll: (cookiesToSet: any[]) => {
              cookiesToSet.forEach(({ name, value, options }) => {
                (cookieStore as any).set({ name, value, ...options });
              });
            },
          }
        : {
            // fallback for older cookie API
            getAll: () => {
              const single = (cookieStore as any).get
                ? [(cookieStore as any).get() ?? {}]
                : [];
              return single;
            },
            setAll: (cookiesToSet: any[]) => {
              cookiesToSet.forEach(({ name, value, options }) => {
                (cookieStore as any).set(name, value, options);
              });
            },
          },
    }
  );
}
