// src/app/auth/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sb } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Mode = "sign_in" | "sign_up";

export default function AuthPage() {
    const supabase = sb();
    const router = useRouter();

    const [mode, setMode] = useState<Mode>("sign_in");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [err, setErr] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    function cleanUsername(v: string) {
        // keep 0..20 chars (was starting at 1 before)
        return v.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);
        setBusy(true);

        try {
            if (mode === "sign_in") {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                router.replace("/");
                return;
            }

            // sign_up
            const wanted = cleanUsername(username);
            if (!wanted) {
                setErr("Choose a username: letters, numbers, underscore.");
                setBusy(false);
                return;
            }

            const { data, error } = await supabase.auth.signUp({ email, password });
            if (error) throw error;

            const uid = data.user?.id;
            if (uid) {
                // update profile username; handle uniqueness
                const { error: upErr } = await supabase
                    .from("profiles")
                    .upsert({ id: uid, username: wanted }, { onConflict: "id" });

                if (upErr?.code === "23505") {
                    setErr("Username is taken. Try another.");
                    setBusy(false);
                    return;
                }
                if (upErr) throw upErr;
            }

            router.replace("/profile");
        } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : "Auth failed");
        } finally {
            setBusy(false);
        }
    }

    return (
        <main className="min-h-dvh p-6 flex justify-center items-start">
            <Card className="w-full max-w-md bg-zinc-900/40 border-zinc-800">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">
                            {mode === "sign_in" ? "Log in" : "Create account"}
                        </CardTitle>
                        <div className="flex gap-2">
                            <Button
                                variant={mode === "sign_up" ? "default" : "outline"}
                                onClick={() => setMode("sign_up")}
                            >
                                Sign up
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <form onSubmit={onSubmit}>
                    <CardContent className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-sm text-zinc-300">Email</label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-zinc-900 text-white placeholder:text-zinc-400"
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm text-zinc-300">Password</label>
                            <Input
                                type="password"
                                value={password}
                                minLength={6}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-zinc-900 text-white placeholder:text-zinc-400"
                                placeholder="Minimum 6 characters"
                                required
                            />
                        </div>

                        {mode === "sign_up" && (
                            <div className="space-y-1">
                                <label className="text-sm text-zinc-300">Username</label>
                                <Input
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="bg-zinc-900 text-white placeholder:text-zinc-400"
                                    placeholder="e.g. jsg_dev"
                                />
                                <p className="text-xs text-zinc-400">
                                    Lowercase letters, numbers, underscore. Max 20.
                                </p>
                            </div>
                        )}

                        {err && <p className="text-sm text-red-400">{err}</p>}
                    </CardContent>

                    <CardFooter className="flex justify-end">
                        <Button type="submit" disabled={busy}>
                            {busy ? "Please wait…" : mode === "sign_in" ? "Log in" : "Create account"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </main>
    );
}
