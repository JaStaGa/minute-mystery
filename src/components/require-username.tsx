"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
    const [state, setState] = useState<GateState>({ kind: "loading" });

    useEffect(() => {
        (async () => {
            const { data: auth } = await supabase.auth.getUser();
            const user = auth.user;
            if (!user) {
                setState({ kind: "need-sign-in" });
                return;
            }
            const { data: prof } = await supabase
                .from("profiles")
                .select("username")
                .eq("id", user.id)
                .maybeSingle();

            if (!prof?.username) setState({ kind: "need-username" });
            else setState({ kind: "ok" });
        })();
    }, [supabase]);

    if (state.kind === "ok") return <>{children}</>;

    return (
        <main className="min-h-dvh flex items-center justify-center p-6 font-sans">
            <Card className="w-full max-w-md border border-zinc-800 bg-zinc-900/70 text-white shadow-lg"
                style={{
                    color: "#fff", // force white for all text inside
                    fontFamily:
                        'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji","Segoe UI Emoji"',
                }}>
                <CardHeader className="pb-2">
                    <CardTitle className="text-2xl tracking-normal">Minute Mystery</CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                    {state.kind === "loading" && <p style={{ opacity: 0.85 }}>Checking your session…</p>}

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
                            <h2 className="text-lg font-semibold">Finish your profile</h2>
                            <p className="text-white/80">Choose a username before jumping into the game.</p>
                        </>
                    )}
                </CardContent>

                <CardFooter className="justify-end gap-2">
                    {state.kind === "need-sign-in" && (
                        <Button asChild>
                            <Link href="/auth">Go to sign in</Link>
                        </Button>
                    )}
                    {state.kind === "need-username" && (
                        <Button asChild>
                            <Link href="/profile">Set username</Link>
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </main>
    );
}
