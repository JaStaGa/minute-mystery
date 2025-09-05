"use client";
import { useEffect, useState } from "react";
import { sb } from "@/lib/supabase";

type Game = { id: number; slug: string; name: string };
type Profile = { id: string; username: string | null; created_at: string };

export default function DBCheck() {
    const supabase = sb();
    const [games, setGames] = useState<Game[]>([]);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            const g = await supabase.from("games").select("id,slug,name").order("id");
            const p = await supabase.from("profiles").select("id,username,created_at").limit(5);
            if (g.error || p.error) setErr((g.error || p.error)!.message);
            setGames(g.data ?? []);
            setProfiles(p.data ?? []);
        })();
    }, [supabase]);

    return (
        <main className="p-6 space-y-4 text-sm text-zinc-100">
            <h1 className="text-xl font-semibold">DB/RLS check</h1>
            {err && <p className="text-red-400">Error: {err}</p>}

            <section>
                <h2 className="font-medium">games</h2>
                <pre className="bg-zinc-900 p-3 rounded">{JSON.stringify(games, null, 2)}</pre>
            </section>

            <section>
                <h2 className="font-medium">profiles (latest 5)</h2>
                <pre className="bg-zinc-900 p-3 rounded">{JSON.stringify(profiles, null, 2)}</pre>
            </section>
        </main>
    );
}
