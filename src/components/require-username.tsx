// src/components/require-username.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { sb } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type GateState =
    | { kind: "loading" }
    | { kind: "need-sign-in" }
    | { kind: "need-username" }
    | { kind: "ok" };

export default function RequireUsername({ children }: { children: React.ReactNode }) {
    const supabase = sb();
    const pathname = usePathname();
    const [state, setState] = useState<GateState>({ kind: "loading" });

    async function check() {
        const { data: auth } = await supabase.auth.getUser();
        const user = auth.user;
        if (!user) return setState({ kind: "need-sign-in" });

        const { data: prof, error } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", user.id)
            .maybeSingle();

        if (error) {
            // fall back to sign-in screen if table is unreachable
            setState({ kind: "need-sign-in" });
            return;
        }
        if (!prof?.username) setState({ kind: "need-username" });
        else setState({ kind: "ok" });
    }

    useEffect(() => {
        check();

        // refresh on profile save
        function onUpdated() { check(); }
        window.addEventListener("mm-profile-updated", onUpdated);

        // refresh on auth state changes
        const { data: sub } = supabase.auth.onAuthStateChange(() => check());

        return () => {
            window.removeEventListener("mm-profile-updated", onUpdated);
            sub.subscription.unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Let the profile page render even when username is missing.
    const onProfilePage = pathname === "/profile";

    if (state.kind === "ok" || onProfilePage) return <>{children}</>;

    return (
        <main className="min-h-dvh flex items-center justify-center p-6">
            <Card className="w-full max-w-md border border-zinc-800 bg-zinc-900/80 shadow-lg text-white">
                <CardHeader className="pb-2">
                    <CardTitle className="text-2xl !text-white">Minute Mystery</CardTitle>
                </CardHeader>

                <CardContent className="space-y-3 text-white">
                    {state.kind === "loading" && <p className="opacity-85 !text-white">Checking your session…</p>}

                    {state.kind === "need-sign-in" && (
                        <>
                            <h2 className="text-lg font-semibold !text-white">Sign in to play</h2>
                            <p className="text-sm !text-white">
                                Track scores and appear on leaderboards once you’re signed in.
                            </p>
                        </>
                    )}

                    {state.kind === "need-username" && (
                        <>
                            <h2 className="text-lg font-semibold !text-white">Finish your profile</h2>
                            <p className="!text-white/80">Choose a username before jumping into the game.</p>
                        </>
                    )}
                </CardContent>

                <CardFooter className="justify-end gap-2">
                    {state.kind === "need-sign-in" && (
                        <Button asChild><Link href="/auth">Go to sign in</Link></Button>
                    )}
                    {state.kind === "need-username" && (
                        <Button asChild><Link href="/profile">Set username</Link></Button>
                    )}
                </CardFooter>
            </Card>
        </main>
    );
}
