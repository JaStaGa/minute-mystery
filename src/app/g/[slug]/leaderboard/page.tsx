"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { sb } from "@/lib/supabase";

type Game = { id: number; name: string };
type HS = { user_id: string; score: number; updated_at: string };
type ProfileRow = { id: string; username: string | null };
type AnyRec = Record<string, unknown>;

export default function Leaderboard({ params }: { params: { slug: string } }) {
    const supabase = sb();
    const [game, setGame] = useState<Game | null>(null);
    const [rows, setRows] = useState<Array<HS & { username: string | null }>>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            setLoading(true);
            setErrorMsg(null);

            // 1) resolve game
            const { data: g, error: eGame } = await supabase
                .from("games")
                .select("id,name")
                .eq("slug", params.slug)
                .maybeSingle();

            if (eGame) {
                setErrorMsg(eGame.message);
                setLoading(false);
                return;
            }
            if (!g) {
                setGame(null);
                setRows([]);
                setLoading(false);
                return;
            }
            const gameRow = g as Game;
            setGame(gameRow);

            // 2) top 10 high scores
            const { data: hs, error: eHS } = await supabase
                .from("high_scores")
                .select("user_id,score,updated_at")
                .eq("game_id", gameRow.id)
                .order("score", { ascending: false })
                .order("updated_at", { ascending: true })
                .limit(10);

            if (eHS) {
                setErrorMsg(eHS.message);
                setLoading(false);
                return;
            }
            const top: HS[] = (hs ?? []) as HS[];
            if (top.length === 0) {
                setRows([]);
                setLoading(false);
                return;
            }

            // 3) usernames for those users
            const userIds = top.map((r) => r.user_id);
            const { data: profs, error: eProf } = await supabase
                .from("profiles")
                .select("id,username")
                .in("id", userIds);

            if (eProf) setErrorMsg(eProf.message);

            const asProfiles = (u: unknown): ProfileRow[] => {
                if (!Array.isArray(u)) return [];
                return (u as AnyRec[]).map((r) => ({
                    id: typeof r.id === "string" ? r.id : "",
                    username: typeof r.username === "string" ? (r.username as string) : null,
                }));
            };

            const nameById = new Map<string, string | null>();
            asProfiles(profs).forEach((p) => nameById.set(p.id, p.username));

            setRows(top.map((r) => ({ ...r, username: nameById.get(r.user_id) ?? null })));
            setLoading(false);
        })();
    }, [params.slug, supabase]);

    const title = game ? `${game.name} Leaderboard` : "Leaderboard";

    return (
        <main className="min-h-dvh p-6 text-zinc-100">
            <div className="max-w-2xl mx-auto space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">{title}</h1>
                    <Link href={`/g/${params.slug}`} className="px-3 py-2 rounded bg-white text-black">
                        Back to game
                    </Link>
                </div>

                {errorMsg && <div className="text-red-400 text-sm">{errorMsg}</div>}

                {loading ? (
                    <div className="text-zinc-400">Loading…</div>
                ) : rows.length === 0 ? (
                    <div className="text-zinc-400">No scores yet.</div>
                ) : (
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="[&>th]:bg-zinc-800 [&>th]:text-white [&>th]:px-3 [&>th]:py-2">
                                <th>Rank</th>
                                <th>Player</th>
                                <th>Score</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r, i) => (
                                <tr key={`${r.user_id}-${r.updated_at}`} className="[&>td]:border [&>td]:border-zinc-700">
                                    <td className="px-3 py-2 text-center">{i + 1}</td>
                                    <td className="px-3 py-2">{r.username ?? r.user_id.slice(0, 8)}</td>
                                    <td className="px-3 py-2 text-center">{r.score}</td>
                                    <td className="px-3 py-2 text-center">
                                        {r.updated_at ? new Date(r.updated_at).toLocaleDateString() : ""}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </main>
    );
}
