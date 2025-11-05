import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function getServerClient() {
  const cookieStore = await cookies(); // ✅ ensure it's awaited here

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
            getAll: async () => {
              const single = (await cookieStore).get
                ? [((await cookieStore) as any).get() ?? {}]
                : [];
              return single;
            },
            setAll: async (cookiesToSet: any[]) => {
              const store = await cookieStore;
              cookiesToSet.forEach(({ name, value, options }) => {
                (store as any).set(name, value, options);
              });
            },
          },
    }
  );
}
