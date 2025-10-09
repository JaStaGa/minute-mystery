// src/app/g/[slug]/leaderboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { sb } from "@/lib/supabase";
import { useAccent } from "@/lib/accent";

type Game = { id: number; name: string };
type HS = { user_id: string; score: number; updated_at: string };
type ProfileRow = { id: string; username: string | null; icon_url: string | null };
type AnyRec = Record<string, unknown>;

export default function Leaderboard({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const supabase = sb();

    // unwrap Next 15 promise params
    const [slug, setSlug] = useState<string | null>(null);
    useEffect(() => {
        let alive = true;
        params.then((p) => alive && setSlug(p.slug));
        return () => {
            alive = false;
        };
    }, [params]);

    // set accent from slug (sw/hp/nrt/ng). Fallback is accent-none.
    useAccent(slug ?? undefined);

    const [game, setGame] = useState<Game | null>(null);
    const [rows, setRows] = useState<
        Array<HS & { username: string | null; icon_url: string | null }>
    >([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        if (!slug) return;
        (async () => {
            setLoading(true);
            setErrorMsg(null);

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

            const userIds = Array.from(new Set(top.map((r) => r.user_id))).filter(Boolean);
            let profs: unknown = [];
            if (userIds.length) {
                const { data: pData, error: eProf } = await supabase
                    .from("profiles")
                    .select("id,username,icon_url")
                    .in("id", userIds);
                if (eProf) setErrorMsg(eProf.message);
                profs = pData ?? [];
            }

            const asProfiles = (u: unknown): ProfileRow[] => {
                if (!Array.isArray(u)) return [];
                return (u as AnyRec[]).map((r) => ({
                    id: typeof r.id === "string" ? r.id : "",
                    username: typeof r.username === "string" ? (r.username as string) : null,
                    icon_url: typeof r.icon_url === "string" ? (r.icon_url as string) : null,
                }));
            };
            const profById = new Map<string, { username: string | null; icon_url: string | null }>();
            asProfiles(profs).forEach((p) => profById.set(p.id, { username: p.username, icon_url: p.icon_url }));

            setRows(
                top.map((r) => {
                    const p = profById.get(r.user_id);
                    return { ...r, username: p?.username ?? null, icon_url: p?.icon_url ?? null };
                }),
            );
            setLoading(false);
        })();
    }, [slug, supabase]);

    const title = game ? `${game.name} Leaderboard` : "Leaderboard";

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
                <h1 className="text-3xl font-extrabold tracking-tight">
                    <span style={{ color: "var(--accent)" }}>{title}</span>
                </h1>
                <Link
                    href={slug ? `/g/${slug}` : "/"}
                    className="btn-accent"
                >
                    Back to game
                </Link>
            </div>

            {errorMsg && <div className="text-sm" style={{ color: "var(--danger)" }}>{errorMsg}</div>}

            <div className="panel p-0">
                <div className="overflow-x-auto">
                    <table className="w-full border-separate border-spacing-0">
                        <thead>
                            <tr
                                style={{
                                    background: "var(--card)",
                                    color: "var(--accent)",
                                    textAlign: "left",
                                    fontWeight: 800,
                                    letterSpacing: "0.04em",
                                }}
                            >
                                {["Rank", "Player", "Score", "Date"].map((h, i) => (
                                    <th
                                        key={h}
                                        style={{
                                            padding: "10px 12px",
                                            borderBottom: "1px solid var(--border)",
                                            borderTopLeftRadius: i === 0 ? "10px" : 0,
                                            borderTopRightRadius: i === 3 ? "10px" : 0,
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
                                    <td colSpan={4} style={{ padding: "12px", textAlign: "center", opacity: 0.7 }}>
                                        Loading…
                                    </td>
                                </tr>
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ padding: "12px", textAlign: "center", opacity: 0.7 }}>
                                        No scores yet
                                    </td>
                                </tr>
                            ) : (
                                rows.map((r, i) => (
                                    <tr
                                        key={`${r.user_id}-${r.updated_at}`}
                                        style={{ background: i % 2 ? "var(--surface)" : "var(--background)" }}
                                    >
                                        <td style={cellStyle}>{i + 1}</td>
                                        <td style={cellStyle}>
                                            <PlayerCell username={r.username} id={r.user_id} icon={r.icon_url} />
                                        </td>
                                        <td style={{ ...cellStyle, fontWeight: 800 }}>{r.score}</td>
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
    );
}

function PlayerCell({
    username,
    id,
    icon,
}: {
    username: string | null;
    id: string;
    icon: string | null;
}) {
    const label = username ?? id.slice(0, 8);
    const fallback = (username ?? "").slice(0, 2).toUpperCase() || id.slice(0, 2).toUpperCase();
    return (
        <div className="flex items-center justify-start gap-2">
            <div
                className="h-6 w-6 overflow-hidden rounded-full border"
                style={{ borderColor: "var(--border)", background: "var(--surface)" }}
                aria-hidden="true"
                title={label}
            >
                {icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={icon} alt="" className="h-full w-full object-cover" />
                ) : (
                    <div className="grid h-full w-full place-items-center text-[10px] opacity-80">
                        {fallback}
                    </div>
                )}
            </div>
            <span>{label}</span>
        </div>
    );
}

const cellStyle: React.CSSProperties = {
    padding: "10px 12px",
    borderBottom: "1px solid var(--border)",
};
