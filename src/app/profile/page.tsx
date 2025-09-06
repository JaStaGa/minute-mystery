"use client";
import { useEffect, useState } from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import { sb } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
    const supabase = sb();
    const [userId, setUserId] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);
    const [username, setUsername] = useState("");
    const [status, setStatus] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            const { data } = await supabase.auth.getUser();
            const u = data.user;
            if (!u) return;
            setUserId(u.id);
            setEmail(u.email ?? null);

            const { data: prof } = await supabase
                .from("profiles")
                .select("username")
                .eq("id", u.id)
                .single();
            setUsername(prof?.username ?? "");
        })();
    }, [supabase]);

    if (!userId) {
        return (
            <main className="p-6">
                <p className="text-zinc-200">
                    Please <a className="underline" href="/auth">sign in</a>.
                </p>
            </main>
        );
    }

    async function save() {
        setStatus(null);
        const clean = username.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
        const { error } = await supabase
            .from("profiles")
            .update({ username: clean })
            .eq("id", userId);

        if (error) {
            const code = (error as PostgrestError).code;
            if (code === "23505") setStatus("Username is taken.");
            else setStatus(error.message);
        } else {
            setUsername(clean);
            setStatus("Saved.");
        }
    }

    return (
        <main className="p-6">
            <Card className="max-w-md">
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="text-sm text-zinc-400">Email: {email}</div>
                    <label className="text-sm">Username</label>
                    <Input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. jsg_dev"
                    />
                    <p className="text-xs text-zinc-400">
                        Lowercase letters, numbers, underscore. Max 20.
                    </p>
                    {status && <p className="text-sm">{status}</p>}
                </CardContent>
                <CardFooter>
                    <Button onClick={save}>Save</Button>
                </CardFooter>
            </Card>
        </main>
    );
}
