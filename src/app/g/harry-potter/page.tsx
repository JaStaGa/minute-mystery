"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import RequireUsername from "@/components/require-username";
import Countdown from "@/game/components/Countdown";
import { reducer, pickRandom } from "@/game/engine/session";
import type { SessionState } from "@/game/engine/session";
import { fetchHP } from "@/game/themes/harry-potter/adapter";
import type { HPFields } from "@/game/types";
import GuessLogHP from "@/game/components/GuessLogHP";
import styles from "./hp-theme.module.css";

import { sb } from "@/lib/supabase";
import { getGameId, getPersonalBest } from "@/lib/scores";
import { upsertHighScore } from "@/game/data/highscore";

type EndReason = "timeout" | "lost" | null;

export default function HPGame() {
    const [all, setAll] = useState<HPFields[]>([]);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [typed, setTyped] = useState("");
    const [msLeft, setMsLeft] = useState(60_000);
    const [ready, setReady] = useState(false);
    const [timerKey, setTimerKey] = useState(0);
    const [solved, setSolved] = useState<HPFields[]>([]);
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

    useEffect(() => {
        fetchHP().then((cs) => {
            setAll(cs as HPFields[]);
            setReady(true);
        });
    }, []);

    useEffect(() => {
        (async () => {
            const id = await getGameId(supabase, "harry-potter");
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
        const pick = pickRandom(all) as unknown as NonNullable<typeof state.target>;
        dispatch({ type: "start", target: pick });
    }

    function onGuess(fd: FormData) {
        if (state.status === "ended") return;
        const name = String(fd.get("guess") || "").trim();
        if (!name) return;

        const namesLC = new Set(all.map((c) => String(c.name || "").toLowerCase()));
        if (!namesLC.has(name.toLowerCase())) return;
        if (state.attempts.some((a: string) => a.toLowerCase() === name.toLowerCase())) return;

        const target = state.target as unknown as HPFields | null;
        const correct = !!target && name.toLowerCase() === String(target.name).toLowerCase();

        dispatch({ type: "guess", name });
        setTyped("");

        if (correct && target) {
            if (advanceTimeout.current) window.clearTimeout(advanceTimeout.current);
            advanceTimeout.current = window.setTimeout(() => {
                setSolved((prev) => [...prev, target]);
                const next = pickRandom(all) as unknown as NonNullable<typeof state.target>;
                dispatch({ type: "next-target", target: next }); // reducer resets mistakes on new target
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
            const t = state.target as unknown as HPFields | null;
            if (t?.name) setLastMissed(t.name);
            dispatch({ type: "end" });
        }
    }, [state.mistakes, state.status, state.target]);

    // Save high score exactly once at end, then refresh PB from DB
    useEffect(() => {
        const endedNow = state.status === "ended" || state.mistakes >= 5;
        if (!endedNow || savedRef.current) return;
        savedRef.current = true;

        (async () => {
            try {
                await upsertHighScore(supabase, "harry-potter", state.score);
                if (gameId) {
                    const pb = await getPersonalBest(supabase, gameId);
                    if (pb !== null) setBest(pb);
                }
            } catch (e) {
                console.error("save high score failed", e);
            }
        })();
    }, [state.status, state.mistakes, state.score, gameId, supabase]);

    const ended = state.status === "ended" || state.mistakes >= 5;
    const liveMsg = ended
        ? "Session ended."
        : state.attempts.length
            ? `Guess ${state.attempts.length} submitted.`
            : "";

    function clearGuess() {
        setTyped("");
        if (inputRef.current) inputRef.current.focus();
    }

    return (
        <RequireUsername>
            <div className={styles.hpRoot}>
                <main className="h-dvh p-4">
                    <div className="max-w-3xl mx-auto h-full game-screen">
                        {state.status === "idle" && (
                            <div className="h-full grid place-content-center content-center gap-6 text-center">
                                <div className={styles.panel}>
                                    <h1 className={styles.hpBigTitle}>HARRY POTTER GUESSING GAME</h1>
                                    <div className="mt-3 flex flex-col items-center gap-3">
                                        <button className={styles.hpButton} onClick={start}>Start</button>
                                        <Link href="/g/harry-potter/leaderboard" className={styles.hpButton}>Leaderboard</Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {state.status === "playing" && state.target && (
                            <div className="space-y-4">
                                <h1 className={styles.hpTitle}>HARRY POTTER GUESSING GAME</h1>

                                <div className={styles.statsRow}>
                                    <div className={styles.stat}><span className={styles.statLabel}>Score</span> {state.score}</div>
                                    <div className={styles.stat}><span className={styles.statLabel}>Round</span> {state.round}</div>
                                    <div className={styles.stat}><span className={styles.statLabel}>Mistakes</span> {state.mistakes}/5</div>
                                    {state.status !== "playing" && best !== null && (
                                        <div className={styles.stat}><span className={styles.statLabel}>Personal Best</span> {best}</div>
                                    )}
                                    <div className={`${styles.stat} ${styles.timer}`}>
                                        <span className={styles.statLabel}>Time</span>
                                        <Countdown
                                            key={timerKey}
                                            ms={60_000}
                                            onEnd={() => {
                                                setEndReason("timeout");
                                                const t = state.target as unknown as HPFields | null;
                                                if (t?.name) setLastMissed(t.name);
                                                dispatch({ type: "end" });
                                            }}
                                            onTick={(ms) => setMsLeft(ms)}
                                        />
                                    </div>
                                </div>

                                <div className={styles.progressTrack}>
                                    <div
                                        className={styles.progressFill}
                                        style={{ width: `${Math.max(0, Math.min(100, (1 - msLeft / 60000) * 100))}%` }}
                                    />
                                </div>

                                <div aria-live="polite" className="sr-only">{liveMsg}</div>

                                <form action={onGuess} className={styles.formColumn} autoComplete="off">
                                    <label htmlFor="guess" className="sr-only">Guess</label>

                                    <div style={{ position: "relative", display: "flex", alignItems: "center", width: "100%" }}>
                                        <input
                                            id="guess"
                                            name="guess"
                                            list="hp-names"
                                            autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
                                            ref={inputRef} value={typed} onChange={(e) => setTyped(e.target.value)}
                                            className={`${styles.hpInput} ${styles.hpInputWide} ${styles.hpInputFlex}`}
                                            placeholder="Type a character name…" aria-label="Guess input"
                                            style={{ paddingRight: 48 }}
                                        />
                                        {typed && (
                                            <button
                                                type="button"
                                                onClick={clearGuess}
                                                aria-label="Clear input"
                                                title="Clear"
                                                className={styles.clearBtn}
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>

                                    <button type="submit" className={styles.hpButtonSm}>Guess</button>
                                </form>

                                <datalist id="hp-names">
                                    {all.map((c) => (<option key={c.name} value={c.name} />))}
                                </datalist>

                                <div className={styles.tableWrap}>
                                    <GuessLogHP
                                        target={state.target as unknown as HPFields}
                                        characters={all as HPFields[]}
                                        attempts={state.attempts}
                                    />
                                </div>

                                {solved.length > 0 && (
                                    <div className="space-y-2 text-center">
                                        <h2 className="text-lg font-semibold">Correct this session</h2>
                                        <ul className="space-y-2 max-w-2xl mx-auto">
                                            {solved.map((c, i) => (
                                                <li key={`${c.name}-${i}`} className="flex items-center gap-3 rounded p-2" style={{ background: "#d3ba93", border: "1px solid #a47148" }}>
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
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {ended && (
                            <div role="dialog" aria-labelledby="gameOverTitle" className="space-y-4 text-center" style={{ marginTop: 20 }}>
                                <div className={styles.panel}>
                                    <h2 id="gameOverTitle" className={styles.hpTitle} style={{ margin: 0, fontSize: "clamp(1.6rem, 5.5vw, 2.4rem)" }}>
                                        {endReason === "timeout" ? "Time’s up" : "Game over"}
                                    </h2>

                                    <div className={styles.statsRow} style={{ justifyContent: "center", marginTop: 8 }}>
                                        <div className={styles.stat}><span className={styles.statLabel}>Final Score</span> {state.score}</div>
                                        {best !== null && (<div className={styles.stat}><span className={styles.statLabel}>Personal Best</span> {best}</div>)}
                                    </div>

                                    {lastMissed && (
                                        <div className="mt-3" style={{ borderRadius: 16, padding: 12, background: "#d3ba93", border: "1px solid #a47148" }}>
                                            <div className={styles.hpTitle} style={{ fontSize: 18, marginBottom: 8 }}>Missed: {lastMissed}</div>
                                            {(() => {
                                                const missed = (all as HPFields[]).find((c) => c.name === lastMissed)
                                                const img = missed?.image || ""
                                                return img ? (
                                                    <div style={{ marginTop: 4, display: "grid", placeItems: "center" }}>
                                                        <Image src={img} alt={lastMissed} width={96} height={128} className="rounded object-cover" unoptimized />
                                                    </div>
                                                ) : null
                                            })()}
                                        </div>
                                    )}

                                    <div className="mt-3 flex justify-center gap-3">
                                        <button className={styles.hpButton} onClick={start}>Play again</button>
                                        <Link href="/g/harry-potter/leaderboard" className={styles.hpButton}>View leaderboard</Link>
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
