// src/components/require-username.tsx
"use client";
import { useEffect, useState } from "react";
import { sb } from "@/lib/supabase";

type Gate = "loading" | "noUser" | "noUsername" | "ok";

export default function RequireUsername({ children }: { children: React.ReactNode }) {
    const supabase = sb();
    const [gate, setGate] = useState<Gate>("loading");

    useEffect(() => {
        (async () => {
            const { data } = await supabase.auth.getUser();
            const u = data.user;
            if (!u) return setGate("noUser");
            const { data: p } = await supabase.from("profiles").select("username").eq("id", u.id).single();
            setGate(p?.username ? "ok" : "noUsername");
        })();
    }, [supabase]);

    if (gate === "ok") return <>{children}</>;
    if (gate === "loading") return null;

    return (
        <main className="min-h-dvh grid place-items-center bg-zinc-950 text-zinc-100 p-6">
            {gate === "noUser" ? (
                <div className="text-center space-y-3">
                    <h2 className="text-xl font-semibold">Sign in to play</h2>
                    <a className="underline" href="/auth">Go to sign in</a>
                </div>
            ) : (
                <div className="text-center space-y-3">
                    <h2 className="text-xl font-semibold">Set a username to play</h2>
                    <a className="underline" href="/profile">Go to profile</a>
                </div>
            )}
        </main>
    );
}
