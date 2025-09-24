"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { sb } from "@/lib/supabase";
import hpStyles from "@/app/g/harry-potter/hp-theme.module.css";

type Game = { id: number; name: string };
type HS = { user_id: string; score: number; updated_at: string };
type ProfileRow = { id: string; username: string | null };
type AnyRec = Record<string, unknown>;

export default function Leaderboard({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const supabase = sb();

    const [slug, setSlug] = useState<string | null>(null);
    const [game, setGame] = useState<Game | null>(null);
    const [rows, setRows] = useState<Array<HS & { username: string | null }>>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Resolve params once
    useEffect(() => {
        let alive = true;
        params.then((p) => {
            if (alive) setSlug(p.slug);
        });
        return () => {
            alive = false;
        };
    }, [params]);

    useEffect(() => {
        if (!slug) return;

        (async () => {
            setLoading(true);
            setErrorMsg(null);

            // 1) resolve game
            const { data: g, error: eGame } = await supabase
                .from("games")
                .select("id,name")
                .eq("slug", slug)
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

            // 2) top 10 scores
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

            // 3) usernames
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
    }, [slug, supabase]);

    const title = game ? `${game.name} Leaderboard` : "Leaderboard";
    const isHP = slug === "harry-potter";

    if (!isHP) {
        // Original minimal style for non-HP
        return (
            <main className="min-h-dvh p-6 text-zinc-100">
                <div className="max-w-2xl mx-auto space-y-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold">{title}</h1>
                        <Link href={slug ? `/g/${slug}` : "/"} className="px-3 py-2 rounded bg-white text-black">
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

    // Harry Potter themed view
    return (
        <div className={hpStyles.hpRoot}>
            <main className="min-h-dvh p-4 text-zinc-100">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <h1 className={hpStyles.hpTitle} style={{ fontSize: "clamp(1.8rem,5vw,2.6rem)" }}>
                            {title}
                        </h1>
                        <Link href="/g/harry-potter" className={hpStyles.hpButton} style={{ background: "#f3e6cf", color: "#4b2e2e" }}>
                            Back to game
                        </Link>
                    </div>

                    <div
                        style={{
                            background: "#f3e6cf",
                            border: "1px solid #a47148",
                            borderRadius: 12,
                            padding: 14,
                            boxShadow: "0 2px 0 #a47148",
                        }}
                    >
                        <div style={{ overflowX: "auto" }}>
                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse: "separate",
                                    borderSpacing: 0,
                                    color: "#4b2e2e",
                                    fontVariantCaps: "small-caps",
                                }}
                            >
                                <thead>
                                    <tr style={{ background: "#ead7b7", color: "#4b2e2e", textAlign: "left", fontWeight: 700, letterSpacing: "0.04em" }}>
                                        {["Rank", "Player", "Score", "Date"].map((h, i) => (
                                            <th
                                                key={h}
                                                style={{
                                                    padding: "10px 12px",
                                                    borderTopLeftRadius: i === 0 ? 10 : 0,
                                                    borderTopRightRadius: i === 3 ? 10 : 0,
                                                    borderBottom: "1px solid #a47148",
                                                }}
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} style={{ ...cellStyle, textAlign: "center", opacity: 0.7 }}>
                                                Loading…
                                            </td>
                                        </tr>
                                    ) : rows.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} style={{ ...cellStyle, textAlign: "center", opacity: 0.7 }}>
                                                No scores yet
                                            </td>
                                        </tr>
                                    ) : (
                                        rows.map((r, i) => (
                                            <tr key={`${r.user_id}-${r.updated_at}`} style={{ background: i % 2 ? "#f7eddc" : "#f3e6cf" }}>
                                                <td style={cellStyle}>{i + 1}</td>
                                                <td style={cellStyle}>{r.username ?? r.user_id.slice(0, 8)}</td>
                                                <td style={{ ...cellStyle, fontWeight: 700 }}>{r.score}</td>
                                                <td style={cellStyle}>
                                                    {r.updated_at ? new Date(r.updated_at).toLocaleDateString() : ""}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

const cellStyle: React.CSSProperties = {
    padding: "10px 12px",
    borderBottom: "1px solid #a47148",
};
