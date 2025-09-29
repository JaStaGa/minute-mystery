// middleware.ts (root)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();

    // Protect /profile and anything under /g/*
    const protectedPath =
        /^\/profile$/.test(req.nextUrl.pathname) || /^\/g(\/|$)/.test(req.nextUrl.pathname);
    if (!protectedPath) return res;

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                // @supabase/ssr expects getAll/setAll in middleware
                getAll: () => req.cookies.getAll(),
                setAll: (cookies) => {
                    cookies.forEach(({ name, value, options }) =>
                        res.cookies.set({ name, value, ...options }),
                    );
                },
            },
        }
    );

    const { data } = await supabase.auth.getUser();

    if (!data.user) {
        const url = new URL("/auth", req.url);
        url.searchParams.set("redirectedFrom", req.nextUrl.pathname);
        return NextResponse.redirect(url);
    }

    return res;
}

export const config = {
    matcher: ["/profile", "/g/:path*"],
};
