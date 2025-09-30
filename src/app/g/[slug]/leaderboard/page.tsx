"use client";
import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { sb } from "@/lib/supabase";
import hpStyles from "@/app/g/harry-potter/hp-theme.module.css";
import nrtStyles from "@/app/g/naruto/naruto-theme.module.css";

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

    // unwrap params once
    const [slug, setSlug] = useState<string | null>(null);
    useEffect(() => {
        let alive = true;
        params.then((p) => {
            if (alive) setSlug(p.slug);
        });
        return () => {
            alive = false;
        };
    }, [params]);

    const [game, setGame] = useState<Game | null>(null);
    const [rows, setRows] = useState<
        Array<HS & { username: string | null; icon_url: string | null }>
    >([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        if (!slug) return; // guard until slug is ready
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

            // 3) usernames + icons
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
    const isHP = slug === "harry-potter";
    const isSW = slug === "star-wars";
    const isNRT = slug === "naruto";

    const PlayerCell = ({
        username,
        id,
        icon,
    }: {
        username: string | null;
        id: string;
        icon: string | null;
    }) => {
        const label = username ?? id.slice(0, 8);
        const fallback = (username ?? "").slice(0, 2).toUpperCase() || id.slice(0, 2).toUpperCase();
        return (
            <div className="flex items-center gap-2 justify-center">
                <div
                    className="w-6 h-6 rounded-full overflow-hidden border"
                    style={{ borderColor: "rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)" }}
                    aria-hidden="true"
                    title={label}
                >
                    {icon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={icon} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full grid place-items-center text-[10px] opacity-80">{fallback}</div>
                    )}
                </div>
                <span>{label}</span>
            </div>
        );
    };

    // Star Wars themed
    if (isSW) {
        const yellow = "#ffe81f";
        const border = "#2b2b2b";
        return (
            <main className="min-h-dvh p-4 text-zinc-100">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: yellow }}>
                            {title}
                        </h1>
                        <Link href="/g/star-wars" className="px-3 py-2 rounded" style={{ background: yellow, color: "#000" }}>
                            Back to game
                        </Link>
                    </div>

                    <div style={{ background: "#0b0b0b", border: `1px solid ${border}`, borderRadius: 12, padding: 14 }}>
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, color: "#eee" }}>
                                <thead>
                                    <tr
                                        style={{
                                            background: "#111",
                                            color: yellow,
                                            textAlign: "left",
                                            fontWeight: 800,
                                            letterSpacing: "0.04em",
                                        }}
                                    >
                                        {["Rank", "Player", "Score", "Date"].map((h) => (
                                            <th key={h} style={{ padding: "10px 12px", borderBottom: `1px solid ${border}` }}>
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
                                            <tr key={`${r.user_id}-${r.updated_at}`} style={{ background: i % 2 ? "#121212" : "#0b0b0b" }}>
                                                <td style={{ padding: "10px 12px", borderBottom: `1px solid ${border}` }}>{i + 1}</td>
                                                <td style={{ padding: "10px 12px", borderBottom: `1px solid ${border}` }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                        <div
                                                            style={{
                                                                width: 24,
                                                                height: 24,
                                                                borderRadius: "9999px",
                                                                overflow: "hidden",
                                                                border: `1px solid ${border}`,
                                                                background: "#151515",
                                                            }}
                                                            title={r.username ?? r.user_id.slice(0, 8)}
                                                        >
                                                            {r.icon_url ? (
                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                <img src={r.icon_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                            ) : (
                                                                <div
                                                                    style={{
                                                                        width: "100%",
                                                                        height: "100%",
                                                                        display: "grid",
                                                                        placeItems: "center",
                                                                        fontSize: 10,
                                                                        opacity: 0.8,
                                                                    }}
                                                                >
                                                                    {(r.username ?? r.user_id).slice(0, 2).toUpperCase()}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span>{r.username ?? r.user_id.slice(0, 8)}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: "10px 12px", borderBottom: `1px solid ${border}`, fontWeight: 800 }}>
                                                    {r.score}
                                                </td>
                                                <td style={{ padding: "10px 12px", borderBottom: `1px solid ${border}` }}>
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
        );
    }

    // Harry Potter themed
    if (isHP) {
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
                                        <tr
                                            style={{
                                                background: "#ead7b7",
                                                color: "#4b2e2e",
                                                textAlign: "left",
                                                fontWeight: 700,
                                                letterSpacing: "0.04em",
                                            }}
                                        >
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
                                                    <td style={cellStyle}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                            <div
                                                                style={{
                                                                    width: 24,
                                                                    height: 24,
                                                                    borderRadius: 9999,
                                                                    overflow: "hidden",
                                                                    border: "1px solid #a47148",
                                                                    background: "#ead7b7",
                                                                }}
                                                                title={r.username ?? r.user_id.slice(0, 8)}
                                                            >
                                                                {r.icon_url ? (
                                                                    // eslint-disable-next-line @next/next/no-img-element
                                                                    <img src={r.icon_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                                ) : (
                                                                    <div
                                                                        style={{
                                                                            width: "100%",
                                                                            height: "100%",
                                                                            display: "grid",
                                                                            placeItems: "center",
                                                                            fontSize: 10,
                                                                            color: "#4b2e2e",
                                                                            opacity: 0.8,
                                                                        }}
                                                                    >
                                                                        {(r.username ?? r.user_id).slice(0, 2).toUpperCase()}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span>{r.username ?? r.user_id.slice(0, 8)}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ ...cellStyle, fontWeight: 700 }}>{r.score}</td>
                                                    <td style={cellStyle}>{r.updated_at ? new Date(r.updated_at).toLocaleDateString() : ""}</td>
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

    // Naruto themed
    if (isNRT) {
        const border = "#233127";
        return (
            <div className={nrtStyles.nrtRoot}>
                <main className="min-h-dvh p-4 text-zinc-100">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <h1 className={nrtStyles.nrtTitle} style={{ fontSize: "clamp(1.8rem,5vw,2.6rem)" }}>
                                {title}
                            </h1>
                            <Link href="/g/naruto" className={nrtStyles.nrtButton}>
                                Back to game
                            </Link>
                        </div>

                        <div className={nrtStyles.panel}>
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, color: "var(--nrt-ink)" }}>
                                    <thead>
                                        <tr
                                            style={{
                                                background: "#0f1a14",
                                                color: "var(--nrt-accent)",
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
                                                        borderTopLeftRadius: i === 0 ? 10 : 0,
                                                        borderTopRightRadius: i === 3 ? 10 : 0,
                                                        borderBottom: `1px solid ${border}`,
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
                                                <tr key={`${r.user_id}-${r.updated_at}`} style={{ background: i % 2 ? "#0f1a14" : "#0b1410" }}>
                                                    <td style={{ padding: "10px 12px", borderBottom: `1px solid ${border}` }}>{i + 1}</td>
                                                    <td style={{ padding: "10px 12px", borderBottom: `1px solid ${border}` }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                            <div
                                                                style={{
                                                                    width: 24,
                                                                    height: 24,
                                                                    borderRadius: 9999,
                                                                    overflow: "hidden",
                                                                    border: `1px solid ${border}`,
                                                                    background: "#0e1914",
                                                                }}
                                                                title={r.username ?? r.user_id.slice(0, 8)}
                                                            >
                                                                {r.icon_url ? (
                                                                    // eslint-disable-next-line @next/next/no-img-element
                                                                    <img src={r.icon_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                                ) : (
                                                                    <div
                                                                        style={{
                                                                            width: "100%",
                                                                            height: "100%",
                                                                            display: "grid",
                                                                            placeItems: "center",
                                                                            fontSize: 10,
                                                                            opacity: 0.8,
                                                                        }}
                                                                    >
                                                                        {(r.username ?? r.user_id).slice(0, 2).toUpperCase()}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span>{r.username ?? r.user_id.slice(0, 8)}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: "10px 12px", borderBottom: `1px solid ${border}`, fontWeight: 800 }}>
                                                        {r.score}
                                                    </td>
                                                    <td style={{ padding: "10px 12px", borderBottom: `1px solid ${border}` }}>
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

    // Minimal fallback for other themes
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
                            <tr className="[&>th]:bg-zinc-800 [&>th]:text-white [&>th]:px-3 [&>th]:py-2 [&>th]:text-xs">
                                <th>Rank</th>
                                <th>Player</th>
                                <th>Score</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r, i) => (
                                <tr key={`${r.user_id}-${r.updated_at}`} className="[&>td]:border [&>td]:border-zinc-700 [&>td]:text-sm">
                                    <td className="px-3 py-2 text-center">{i + 1}</td>
                                    <td className="px-3 py-2 text-center">
                                        <PlayerCell username={r.username} id={r.user_id} icon={r.icon_url} />
                                    </td>
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

const cellStyle: CSSProperties = {
    padding: "10px 12px",
    borderBottom: "1px solid #a47148",
};
