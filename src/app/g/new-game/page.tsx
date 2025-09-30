// src/app/g/new-game/page.tsx
"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import Link from "next/link";
import Countdown from "@/game/components/Countdown";
import { reducer, pickRandom } from "@/game/engine/session";
import type { SessionState } from "@/game/engine/session";
import type { NGFields } from "@/game/types";
import characters from "@/game/data/ng/characters";
import GuessLogNG from "@/game/components/GuessLogNG";
import styles from "./ng-theme.module.css";

import { sb } from "@/lib/supabase";
import { getGameId, getPersonalBest } from "@/lib/scores";
import { upsertHighScore } from "@/game/data/highscore";

type EndReason = "timeout" | "lost" | null;

export default function NGGame() {
    const [all, setAll] = useState<NGFields[]>([]);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [typed, setTyped] = useState("");
    const [msLeft, setMsLeft] = useState(60_000);
    const [ready, setReady] = useState(false);
    const [timerKey, setTimerKey] = useState(0);
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
        setAll(characters as NGFields[]);
        setReady(true);
    }, []);

    useEffect(() => {
        (async () => {
            const id = await getGameId(supabase, "new-game");
            setGameId(id);
            if (id) setBest(await getPersonalBest(supabase, id));
        })();
    }, [supabase]);

    function start() {
        if (!ready) return;
        savedRef.current = false;
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

        const namesLC = new Set(all.map((c) => c.name.toLowerCase()));
        if (!namesLC.has(name.toLowerCase())) return;
        if (state.attempts.some((a) => a.toLowerCase() === name.toLowerCase())) return;

        const target = state.target as unknown as NGFields | null;
        const correct = !!target && name.toLowerCase() === target.name.toLowerCase();

        dispatch({ type: "guess", name });
        setTyped("");

        if (correct && target) {
            if (advanceTimeout.current) window.clearTimeout(advanceTimeout.current);
            advanceTimeout.current = window.setTimeout(() => {
                const next = pickRandom(all) as unknown as NonNullable<typeof state.target>;
                dispatch({ type: "next-target", target: next }); // reducer should reset mistakes
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
            const t = state.target as unknown as NGFields | null;
            if (t?.name) setLastMissed(t.name);
            dispatch({ type: "end" });
        }
    }, [state.mistakes, state.status, state.target]);

    useEffect(() => {
        const endedNow = state.status === "ended" || state.mistakes >= 5;
        if (!endedNow || savedRef.current) return;
        savedRef.current = true;
        (async () => {
            await upsertHighScore(supabase, "new-game", state.score);
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

    const ended = state.status === "ended" || state.mistakes >= 5;
    const liveMsg = ended ? "Session ended." : state.attempts.length ? `Guess ${state.attempts.length} submitted.` : "";

    return (
        <div className={styles.ngRoot}>
            <main className="h-dvh p-4 text-zinc-100">
                <div className="max-w-3xl mx-auto h-full game-screen">
                    {state.status === "idle" && (
                        <div className="h-full grid place-content-center content-center gap-6 text-center">
                            <div className={styles.panel}>
                                <h1 className={styles.ngTitle}>NEW GAME</h1>
                                <div className="mt-3 flex flex-col items-center gap-3">
                                    <button className={styles.ngButton} onClick={start}>
                                        Start
                                    </button>
                                    <Link href="/g/new-game/leaderboard" className={styles.ngButton}>
                                        Leaderboard
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {state.status === "playing" && state.target && (
                        <div className="space-y-4">
                            <h1 className={styles.ngTitle}>NEW GAME</h1>

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
                                {best !== null && (
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
                                            const t = state.target as unknown as NGFields | null;
                                            if (t?.name) setLastMissed(t.name);
                                            dispatch({ type: "end" });
                                        }}
                                        onTick={(ms) => setMsLeft(ms)}
                                    />
                                </div>
                            </div>

                            <div className={styles.timeTrack} aria-hidden>
                                <div
                                    className={styles.timeFill}
                                    style={{ width: `${Math.max(0, Math.min(100, (1 - msLeft / 60000) * 100))}%` }}
                                />
                            </div>

                            <div aria-live="polite" className="sr-only">
                                {liveMsg}
                            </div>

                            <form action={onGuess} className={styles.formColumn} autoComplete="off">
                                <label htmlFor="guess" className="sr-only">
                                    Guess
                                </label>
                                <div style={{ position: "relative", display: "flex", alignItems: "center", width: "100%" }}>
                                    <input
                                        id="guess"
                                        name="guess"
                                        list="ng-names"
                                        autoComplete="off"
                                        autoCorrect="off"
                                        autoCapitalize="off"
                                        spellCheck={false}
                                        ref={inputRef}
                                        value={typed}
                                        onChange={(e) => setTyped(e.target.value)}
                                        className={styles.ngInput}
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
                                            className={styles.ngButton}
                                            style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)" }}
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>

                                <datalist id="ng-names">
                                    {all.map((c) => (
                                        <option key={c.name} value={c.name} />
                                    ))}
                                </datalist>

                                <button type="submit" className={styles.ngButton}>
                                    Guess
                                </button>
                            </form>

                            <div className={styles.tableWrap}>
                                <GuessLogNG
                                    round={{
                                        targetId: (state.target as unknown as NGFields).name,
                                        guesses: state.attempts.map((a) => ({ text: a, ts: Date.now() })),
                                    }}
                                    characters={all}
                                />
                            </div>
                        </div>
                    )}

                    {ended && (
                        <div role="dialog" aria-labelledby="gameOverTitle" className={`space-y-4 text-center ${styles.endBlock}`}>
                            <div className={styles.panel}>
                                <h2 id="gameOverTitle" className={styles.ngTitle} style={{ margin: 0, fontSize: "clamp(1.6rem, 5.5vw, 2.4rem)" }}>
                                    {endReason === "timeout" ? "Time’s up" : "Game over"}
                                </h2>

                                <div className={styles.statsRow} style={{ justifyContent: "center", marginTop: 8 }}>
                                    <div className={styles.stat}>
                                        <span className={styles.statLabel}>Final Score</span> {state.score}
                                    </div>
                                    {best !== null && (
                                        <div className={styles.stat}>
                                            <span className={styles.statLabel}>Personal Best</span> {best}
                                        </div>
                                    )}
                                </div>

                                {lastMissed && (
                                    <div className={`mt-3 ${styles.guessCard}`} style={{ borderRadius: 16, padding: 12 }}>
                                        <div className={styles.ngTitle} style={{ fontSize: 18 }}>
                                            Missed: {lastMissed}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-3 flex justify-center gap-3">
                                    <button className={styles.ngButton} onClick={start}>
                                        Play again
                                    </button>
                                    <Link href="/g/new-game/leaderboard" className={styles.ngButton}>
                                        View leaderboard
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
