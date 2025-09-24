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
import StartScreen from "@/game/themes/harry-potter/components/StartScreen";
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
    const [gameId, setGameId] = useState<string | null>(null);
    const [best, setBest] = useState<number | null>(null);
    const savedRef = useRef(false);

    // New: track why the run ended and the last missed character
    const [endReason, setEndReason] = useState<EndReason>(null);
    const [lastMissed, setLastMissed] = useState<string | null>(null);

    useEffect(() => {
        fetchHP().then((cs) => {
            setAll(cs);
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
        dispatch({ type: "start", target: pickRandom(all) });
    }

    function onGuess(fd: FormData) {
        if (state.status === "ended") return;
        const name = String(fd.get("guess") || "").trim();
        if (!name) return;
        const namesLC = new Set(all.map((c) => c.name.toLowerCase()));
        if (!namesLC.has(name.toLowerCase())) return;
        if (state.attempts.some((a) => a.toLowerCase() === name.toLowerCase())) return;

        const target = state.target as HPFields | null;
        const correct = !!target && name.toLowerCase() === target.name.toLowerCase();

        dispatch({ type: "guess", name });
        setTyped("");

        if (correct && target) {
            if (advanceTimeout.current) window.clearTimeout(advanceTimeout.current);
            advanceTimeout.current = window.setTimeout(() => {
                setSolved((prev) => [...prev, target]);
                dispatch({ type: "next-target", target: pickRandom(all) });
            }, 1200);
        } else if (!correct && target) {
            // On a miss, remember the current target as the potential "last missed"
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

    // End the run explicitly when mistakes hit 5
    useEffect(() => {
        if (state.status === "playing" && state.mistakes >= 5) {
            setEndReason("lost");
            if (state.target?.name) setLastMissed(state.target.name);
            dispatch({ type: "end" });
        }
    }, [state.mistakes, state.status, state.target]);

    // Save PB once per run
    useEffect(() => {
        const endedNow = state.status === "ended" || state.mistakes >= 5;
        if (!endedNow || savedRef.current) return;
        savedRef.current = true;
        (async () => {
            await upsertHighScore(supabase, "harry-potter", state.score);
            if (gameId) {
                const pb = await getPersonalBest(supabase, gameId);
                if (pb !== null) setBest(pb);
            }
        })();
    }, [state.status, state.mistakes, state.score, gameId, supabase]);

    // Clear input helper + Esc-to-clear
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

    return (
        <RequireUsername>
            <div className={styles.hpRoot}>
                <main className="min-h-dvh p-4 text-zinc-100">
                    <div className="max-w-3xl mx-auto space-y-3 game-screen">
                        {state.status === "idle" && <StartScreen onStart={start} />}

                        {state.status === "playing" && state.target && (
                            <div className="space-y-4">
                                <h1 className={styles.hpTitle}>Harry Potter Guessing Game</h1>

                                {/* Compact stats */}
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

                                    {/* PB hidden while playing */}
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
                                                // Timeout end path
                                                setEndReason("timeout");
                                                if (state.target?.name) setLastMissed(state.target.name);
                                                dispatch({ type: "end" });
                                            }}
                                            onTick={(ms) => setMsLeft(ms)}
                                        />
                                    </div>
                                </div>

                                {/* Slim progress bar */}
                                <div className={styles.progressTrack}>
                                    <div
                                        className={styles.progressFill}
                                        style={{ width: `${Math.max(0, Math.min(100, (1 - msLeft / 60000) * 100))}%` }}
                                    />
                                </div>

                                {/* a11y */}
                                <div aria-live="polite" className="sr-only">
                                    {liveMsg}
                                </div>

                                {/* Guess form with clear-X */}
                                <form action={onGuess} className={styles.formColumn} autoComplete="off">
                                    <label htmlFor="guess" className="sr-only">Guess</label>

                                    <div
                                        style={{
                                            position: "relative",
                                            display: "flex",
                                            alignItems: "center",
                                            width: "100%",
                                            overflow: "visible",
                                        }}
                                    >
                                        <input
                                            id="guess"
                                            name="guess"
                                            list="hp-names"
                                            autoComplete="off"
                                            autoCorrect="off"
                                            autoCapitalize="off"
                                            spellCheck={false}
                                            ref={inputRef}
                                            value={typed}
                                            onChange={(e) => setTyped(e.target.value)}
                                            className={`${styles.hpInput} ${styles.hpInputWide} ${styles.hpInputFlex}`}
                                            placeholder="Type a character name…"
                                            aria-label="Guess input"
                                            style={{ paddingRight: 36 }}   // make room for ×
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
                                                    zIndex: 20,
                                                    color: "#4b2e2e",   // <— add this
                                                    opacity: 1,         // <— ensure visible
                                                    fontWeight: 700,
                                                }}
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>

                                    <datalist id="hp-names">
                                        {all.map((c) => (<option key={c.name} value={c.name} />))}
                                    </datalist>

                                    <button type="submit" className={styles.hpButtonSm}>Guess</button>
                                </form>

                                {/* Guess log */}
                                <div className={styles.tableWrap}>
                                    <GuessLogHP target={state.target} characters={all} attempts={state.attempts} />
                                </div>

                                {/* Correct list */}
                                {solved.length > 0 && (
                                    <div className="space-y-2 text-center">
                                        <h2 className="text-lg font-semibold">Correct this session</h2>
                                        <ul className="space-y-2 max-w-2xl mx-auto">
                                            {solved.map((c, i) => (
                                                <li
                                                    key={`${c.name}-${i}`}
                                                    className="flex items-center gap-3 bg-[#d3ba93] border border-[#a47148] rounded p-2 text-[#4b2e2e]"
                                                >
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
                                                        <div className="text-sm opacity-80">{c.house}</div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {state.status === "idle" && (
                            <div className="flex justify-center">
                                <Link href="/g/harry-potter/leaderboard" className={styles.hpButton}>
                                    Leaderboard
                                </Link>
                            </div>
                        )}

                        {ended && (
                            <div
                                role="dialog"
                                aria-labelledby="gameOverTitle"
                                className="space-y-4 text-center"
                                style={{
                                    marginTop: 12,
                                    padding: 16,
                                    borderRadius: 12,
                                    border: "1px solid #a47148",
                                    background: "#f3e6cf",
                                }}
                            >
                                {/* larger title */}
                                <h2
                                    id="gameOverTitle"
                                    className={styles.hpTitle}
                                    style={{ margin: 0, fontSize: "clamp(1.6rem, 5.5vw, 2.4rem)" }}
                                >
                                    {endReason === "timeout" ? "Time’s up" : "Game over"}
                                </h2>

                                {/* score + PB */}
                                <div className={styles.statsRow} style={{ justifyContent: "center" }}>
                                    <div className={styles.stat}>
                                        <span className={styles.statLabel}>Final Score</span> {state.score}
                                    </div>
                                    {best !== null && (
                                        <div className={styles.stat}>
                                            <span className={styles.statLabel}>Personal Best</span> {best}
                                        </div>
                                    )}
                                </div>

                                {/* full-width MISSED box with centered text + image */}
                                {lastMissed && (
                                    <div
                                        style={{
                                            width: "100%",
                                            display: "grid",
                                            placeItems: "center",
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: "100%",
                                                maxWidth: 720, // keeps it readable on wide screens
                                                border: "1px solid #a47148",
                                                background: "#ead7b7",
                                                borderRadius: 12,
                                                padding: 12,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.06em",
                                                    fontWeight: 600,
                                                    textAlign: "center",
                                                    color: "#a47148",
                                                }}
                                            >
                                                Missed: {lastMissed}
                                            </div>

                                            {/* small portrait so buttons still fit below */}
                                            {(() => {
                                                const missed = all.find((c) => c.name === lastMissed);
                                                const img = missed?.image || "";
                                                return img ? (
                                                    <div style={{ marginTop: 8, display: "grid", placeItems: "center" }}>
                                                        <Image
                                                            src={img}
                                                            alt={lastMissed}
                                                            width={96}
                                                            height={128}
                                                            className="rounded object-cover"
                                                            unoptimized
                                                        />
                                                    </div>
                                                ) : null;
                                            })()}
                                        </div>
                                    </div>
                                )}

                                {/* actions */}
                                <div className="flex justify-center gap-3">
                                    <button className={styles.hpButton} onClick={start}>
                                        Play again
                                    </button>
                                    <Link href="/g/harry-potter/leaderboard" className={styles.hpButton}>
                                        View leaderboard
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </RequireUsername>
    );
}
