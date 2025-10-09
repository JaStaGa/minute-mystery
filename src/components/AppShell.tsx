// src/components/AppShell.tsx
"use client";
import { PropsWithChildren, useEffect, useState } from "react";
import Link from "next/link";
import { sb } from "@/lib/supabase";

type Props = PropsWithChildren<{ accent?: "sw" | "hp" | "nrt" | "ng" | null }>;

export default function AppShell({ children, accent = null }: Props) {
    // accent
    useEffect(() => {
        const b = document.body;
        b.classList.remove("accent-sw", "accent-hp", "accent-nrt", "accent-ng", "accent-none");
        b.classList.add(accent ? `accent-${accent}` : "accent-none");
    }, [accent]);

    // auth
    const supabase = sb();
    const [authed, setAuthed] = useState(false);

    useEffect(() => {
        let mounted = true;
        supabase.auth.getUser().then(({ data }) => mounted && setAuthed(!!data.user));
        const { data: authSub } = supabase.auth.onAuthStateChange((_e, sess) => {
            setAuthed(!!sess?.user);
        });
        return () => {
            mounted = false;
            authSub.subscription.unsubscribe();
        };
    }, [supabase]);

    return (
        <div className="min-h-svh bg-[var(--background)] text-[var(--foreground)]">
            <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur">
                <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
                    <Link href="/" className="font-semibold">Minute Mystery</Link>
                    <nav className="ml-auto flex items-center gap-2">
                        {authed ? (
                            <>
                                <Link className="btn" href="/profile">Profile</Link>
                                {/* <Link className="btn" href="/settings">Settings</Link> */}
                            </>
                        ) : (
                            <Link className="btn btn-outline-accent btn-sm" href="/auth" aria-label="Log in">
                                Log in
                            </Link>
                        )}
                    </nav>
                </div>
            </header>
            <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        </div>
    );
}
