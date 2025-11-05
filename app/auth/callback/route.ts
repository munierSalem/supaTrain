import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    if (!code) return NextResponse.redirect(new URL("/", request.url));

    // Create a response that Supabase can modify (set cookies, etc.)
    const response = NextResponse.redirect(new URL("/", request.url));

    // Create the Supabase server client, binding to request/response
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            // pull cookies from the incoming request
            const cookieHeader = request.headers.get("cookie");
            if (!cookieHeader) return undefined;
            const cookies = Object.fromEntries(
              cookieHeader
                .split(";")
                .map((c) => c.trim().split("="))
                .map(([k, v]) => [k, decodeURIComponent(v)])
            );
            return cookies[name];
          },
          set(name: string, value: string, options: CookieOptions) {
            // set cookies on the outgoing response
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value: "",
              ...options,
              maxAge: 0,
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("❌ Supabase exchange error:", error);
      return NextResponse.redirect(new URL("/?error=auth", request.url));
    }

    console.log("✅ Session exchange successful");
    return response;
  } catch (err: any) {
    console.error("🔥 Callback handler crashed:", err.message || err);
    return new Response("Server error during OAuth callback", { status: 500 });
  }
}
