"use client";
import { useEffect, useReducer, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import RequireUsername from "@/components/require-username";
import Countdown from "@/game/components/Countdown";
import { reducer, pickRandom } from "@/game/engine/session";
import type { SessionState } from "@/game/engine/session";
import { fetchSW } from "@/game/themes/star-wars/adapter";
import type { SWFields } from "@/game/types";
import GuessLogSW from "@/game/components/GuessLogSW";
import styles from "./sw-theme.module.css";

import { sb } from "@/lib/supabase";
import { getGameId, getPersonalBest } from "@/lib/scores";
import { upsertHighScore } from "@/game/data/highscore";


type EndReason = "timeout" | "lost" | null;

export default function SWGame() {
    const [all, setAll] = useState<SWFields[]>([]);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [typed, setTyped] = useState("");
    const [msLeft, setMsLeft] = useState(60_000);
    const [ready, setReady] = useState(false);
    const [timerKey, setTimerKey] = useState(0);
    const [solved, setSolved] = useState<SWFields[]>([]);
    const advanceTimeout = useRef<number | null>(null);

    const [state, dispatch] = useReducer(reducer, {
        status: "idle",
        target: null,
        attempts: [],
        score: 0,
        mistakes: 0,
        round: 0,
    } as SessionState);

    const supabase = sb();
    const [gameId, setGameId] = useState<number | null>(null);
    const [best, setBest] = useState<number | null>(null);
    const savedRef = useRef(false);

    const [endReason, setEndReason] = useState<EndReason>(null);
    const [lastMissed, setLastMissed] = useState<string | null>(null);

    const swYellow = "#ffe81f";

    useEffect(() => {
        fetchSW().then((cs) => {
            setAll(cs as SWFields[]);
            setReady(true);
        });
    }, []);

    useEffect(() => {
        (async () => {
            const id = await getGameId(supabase, "star-wars");
            setGameId(id);
            if (id) setBest(await getPersonalBest(supabase, id));
        })();
    }, [supabase]);

    function start() {
        if (!ready) return;
        savedRef.current = false;
        setSolved([]);
        setTyped("");
        setMsLeft(60_000);
        setTimerKey((k) => k + 1);
        setEndReason(null);
        setLastMissed(null);
        const pick = pickRandom(all as SWFields[]) as unknown as NonNullable<typeof state.target>;
        dispatch({ type: "start", target: pick });
    }

    function onGuess(fd: FormData) {
        if (state.status === "ended") return;
        const name = String(fd.get("guess") || "").trim();
        if (!name) return;

        const namesLC = new Set(all.map((c) => String(c.name || "").toLowerCase()));
        if (!namesLC.has(name.toLowerCase())) return;
        if (state.attempts.some((a: string) => a.toLowerCase() === name.toLowerCase())) return;

        const target = state.target as unknown as SWFields | null;
        const correct = !!target && name.toLowerCase() === String(target.name).toLowerCase();

        dispatch({ type: "guess", name });
        setTyped("");

        if (correct && target) {
            if (advanceTimeout.current) window.clearTimeout(advanceTimeout.current);
            advanceTimeout.current = window.setTimeout(() => {
                setSolved((prev) => [...prev, target]);
                const next = pickRandom(all as SWFields[]) as unknown as NonNullable<typeof state.target>;
                dispatch({ type: "next-target", target: next });
            }, 1200);
        } else if (!correct && target) {
            setLastMissed(target.name);
        }
    }

    useEffect(() => {
        return () => {
            if (advanceTimeout.current) window.clearTimeout(advanceTimeout.current);
        };
    }, []);

    useEffect(() => {
        if (state.status === "playing" && inputRef.current) inputRef.current.focus();
    }, [state.status, state.round]);

    useEffect(() => {
        if (state.status === "playing" && state.mistakes >= 5) {
            setEndReason("lost");
            const t = state.target as unknown as SWFields | null;
            if (t?.name) setLastMissed(t.name);
            dispatch({ type: "end" });
        }
    }, [state.mistakes, state.status, state.target]);

    useEffect(() => {
        const endedNow = state.status === "ended" || state.mistakes >= 5;
        if (!endedNow || savedRef.current) return;
        savedRef.current = true;
        (async () => {
            await upsertHighScore(supabase, "star-wars", state.score);
            if (gameId) {
                const pb = await getPersonalBest(supabase, gameId);
                if (pb !== null) setBest(pb);
            }
        })();
    }, [state.status, state.mistakes, state.score, gameId, supabase]);

    function clearGuess() {
        setTyped("");
        if (inputRef.current) inputRef.current.focus();
    }
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") clearGuess();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const ended = state.status === "ended" || state.mistakes >= 5;
    const liveMsg =
        ended ? "Session ended." : state.attempts.length ? `Guess ${state.attempts.length} submitted.` : "";

    function SafeLetters({ text }: { text: string }) {
        return (
            <>
                {Array.from(text).map((ch, i) => {
                    const c = ch.toLowerCase();
                    if (c === "i") return <span key={i} className={styles.fallbackI}>I</span>;
                    if (c === "u") return <span key={i} className={styles.fallbackU}>{ch}</span>;
                    return <span key={i}>{ch}</span>;
                })}
            </>
        );
    }

    return (
        <RequireUsername>
            <div className={styles.swRoot}>
                <main className="h-dvh p-4 text-zinc-100">
                    <div className="max-w-3xl mx-auto h-full game-screen">
                        {state.status === "idle" && (
                            <div className="h-full grid place-content-center content-center gap-6 overflow-hidden text-center">
                                <div className={styles.panel}>
                                    <h1 className={styles.swTitle}>STAR WARS G<span className={styles.fallbackU}>U</span>ESS<span className={styles.fallbackI}>I</span>NG GAME</h1>
                                    <div className="mt-3 flex flex-col items-center gap-3">
                                        <button className={styles.swButton} onClick={start}>Start</button>
                                        <Link href="/g/star-wars/leaderboard" className={styles.swButton}>
                                            Leaderboard
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {state.status === "playing" && state.target && (
                            <div className="space-y-4">
                                <h1 className={styles.swTitle}>STAR WARS G<span className={styles.fallbackU}>U</span>ESS<span className={styles.fallbackI}>I</span>NG GAME</h1>

                                <div className={styles.statsRow}>
                                    <div className={styles.stat}>
                                        <span className={styles.statLabel}>Score</span> {state.score}
                                    </div>
                                    <div className={styles.stat}>
                                        <span className={styles.statLabel}>Round</span> {state.round}
                                    </div>
                                    <div className={styles.stat}>
                                        <span className={styles.statLabel}>Mistakes</span> {state.mistakes}/5
                                    </div>

                                    {state.status !== "playing" && best !== null && (
                                        <div className={styles.stat}>
                                            <span className={styles.statLabel}>Personal Best</span> {best}
                                        </div>
                                    )}

                                    <div className={styles.stat}>
                                        <span className={styles.statLabel}>Time</span>
                                        <Countdown
                                            key={timerKey}
                                            ms={60_000}
                                            onEnd={() => {
                                                setEndReason("timeout");
                                                const t = state.target as unknown as SWFields | null;
                                                if (t?.name) setLastMissed(t.name);
                                                dispatch({ type: "end" });
                                            }}
                                            onTick={(ms) => setMsLeft(ms)}
                                        />
                                    </div>
                                </div>

                                <div className={styles.timeTrack}>
                                    <div
                                        className={styles.timeFill}
                                        style={{
                                            width: `${Math.max(0, Math.min(100, (1 - msLeft / 60000) * 100))}%`,
                                            background: swYellow,
                                        }}
                                    />
                                </div>

                                <div aria-live="polite" className="sr-only">{liveMsg}</div>

                                <form action={onGuess} className={styles.formColumn} autoComplete="off">
                                    <label htmlFor="guess" className="sr-only">Guess</label>

                                    <div style={{ position: "relative", display: "flex", alignItems: "center", width: "100%" }}>
                                        <input
                                            id="guess"
                                            name="guess"
                                            list="sw-names"
                                            autoComplete="off"
                                            autoCorrect="off"
                                            autoCapitalize="off"
                                            spellCheck={false}
                                            ref={inputRef}
                                            value={typed}
                                            onChange={(e) => setTyped(e.target.value)}
                                            className={`${styles.swInput} ${styles.swInputWide}`}
                                            placeholder="Type a character name…"
                                            aria-label="Guess input"
                                            style={{ paddingRight: 48 }}
                                        />
                                        {typed && (
                                            <button
                                                type="button"
                                                onClick={clearGuess}
                                                aria-label="Clear input"
                                                title="Clear"
                                                style={{
                                                    position: "absolute",
                                                    right: 10,
                                                    top: "50%",
                                                    transform: "translateY(-50%)",
                                                    border: "none",
                                                    background: "transparent",
                                                    cursor: "pointer",
                                                    fontSize: 18,
                                                    lineHeight: 1,
                                                    padding: 4,
                                                    opacity: 1,
                                                    zIndex: 20,
                                                    color: swYellow,
                                                    fontWeight: 800,
                                                    textShadow: "0 0 6px rgba(255,232,31,0.6)",
                                                }}
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>

                                    <datalist id="sw-names">
                                        {all.map((c) => (<option key={c.name} value={c.name} />))}
                                    </datalist>

                                    <button type="submit" className={styles.swButton}>Guess</button>
                                </form>

                                <div className={styles.tableWrap}>
                                    <GuessLogSW
                                        target={state.target as unknown as SWFields}
                                        characters={all as SWFields[]}
                                        attempts={state.attempts}
                                    />
                                </div>

                                {solved.length > 0 && (
                                    <div className="space-y-2 text-center">
                                        <h2 className="text-lg font-semibold">Correct this session</h2>
                                        <ul className="space-y-2 max-w-2xl mx-auto">
                                            {solved.map((c, i) => (
                                                <li key={`${c.name}-${i}`} className={`flex items-center gap-3 ${styles.guessCard} rounded p-2`}>
                                                    <Image
                                                        src={c.image || "https://via.placeholder.com/60x80"}
                                                        alt={c.name}
                                                        width={48}
                                                        height={64}
                                                        className="w-12 h-16 object-cover rounded"
                                                        unoptimized
                                                    />
                                                    <div className="leading-tight text-left">
                                                        <div className="font-medium">{c.name}</div>
                                                        <div className="text-sm opacity-80">{c.affiliation}</div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {ended && (
                            <div role="dialog" aria-labelledby="gameOverTitle" className={`space-y-4 text-center ${styles.endBlock}`}>
                                <div className={styles.panel}>
                                    <h2
                                        id="gameOverTitle"
                                        className={styles.swTitle}
                                        style={{ margin: 0, fontSize: "clamp(1.6rem, 5.5vw, 2.4rem)" }}
                                    >
                                        <SafeLetters text={endReason === "timeout" ? "Time’s up" : "Game over"} />
                                    </h2>

                                    <div className={styles.statsRow} style={{ justifyContent: "center", marginTop: 8 }}>
                                        <div className={styles.stat}><span className={styles.statLabel}>Final Score</span> {state.score}</div>
                                        {best !== null && (
                                            <div className={styles.stat}><span className={styles.statLabel}>Personal Best</span> {best}</div>
                                        )}
                                    </div>

                                    {lastMissed && (
                                        <div className={`mt-3 ${styles.guessCard}`} style={{ borderRadius: 16, padding: 12 }}>
                                            <div
                                                style={{
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.06em",
                                                    fontWeight: 700,
                                                    textAlign: "center",
                                                    color: swYellow,
                                                }}
                                            >
                                                Missed: {lastMissed}
                                            </div>
                                            {(() => {
                                                const missed = (all as SWFields[]).find((c) => c.name === lastMissed);
                                                const img = missed?.image || "";
                                                return img ? (
                                                    <div style={{ marginTop: 8, display: "grid", placeItems: "center" }}>
                                                        <Image src={img} alt={lastMissed} width={96} height={128} className="rounded object-cover" unoptimized />
                                                    </div>
                                                ) : null;
                                            })()}
                                        </div>
                                    )}

                                    <div className="mt-3 flex justify-center gap-3">
                                        <button className={styles.swButton} onClick={start}>Play again</button>
                                        <Link href="/g/star-wars/leaderboard" className={styles.swButton}>View leaderboard</Link>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </RequireUsername>
    );
}
