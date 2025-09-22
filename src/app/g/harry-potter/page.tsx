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

export default function HPGame() {
    const [all, setAll] = useState<HPFields[]>([]);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [typed, setTyped] = useState("");      // controlled input
    const [msLeft, setMsLeft] = useState(60_000); // for progress bar
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

    // supabase + personal best
    const supabase = sb();
    const [gameId, setGameId] = useState<string | null>(null);
    const [best, setBest] = useState<number | null>(null);
    const savedRef = useRef(false);

    // characters
    useEffect(() => {
        fetchHP().then((cs) => {
            setAll(cs);
            setReady(true);
        });
    }, []);

    // resolve game id + current personal best
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
        setMsLeft(60_000);
        setTimerKey((k) => k + 1);
        dispatch({ type: "start", target: pickRandom(all) });
    }

    function onGuess(fd: FormData) {
        if (state.status === "ended") return
        const name = String(fd.get("guess") || "").trim();
        if (!name) return; // empty -> ignore
        const namesLC = new Set(all.map(c => c.name.toLowerCase()));
        if (!namesLC.has(name.toLowerCase())) return; // not a known character -> ignore
        if (state.attempts.some(a => a.toLowerCase() === name.toLowerCase())) return; // duplicate -> ignore
        const target = state.target as HPFields | null;
        const correct = !!target && name.toLowerCase() === target.name.toLowerCase();

        dispatch({ type: "guess", name });
        setTyped(""); // clear field after any submit

        if (correct && target) {
            if (advanceTimeout.current) window.clearTimeout(advanceTimeout.current);
            advanceTimeout.current = window.setTimeout(() => {
                setSolved((prev) => [...prev, target]);
                dispatch({ type: "next-target", target: pickRandom(all) });
            }, 1200);
        }
    }

    // cleanup pending timeout
    useEffect(() => {
        return () => {
            if (advanceTimeout.current) window.clearTimeout(advanceTimeout.current);
        };
    }, []);

    // focus input whenever we start/advance
    useEffect(() => {
        if (state.status === "playing" && inputRef.current) {
            inputRef.current.focus();
        }
    }, [state.status, state.round]);

    const ended = state.status === "ended" || state.mistakes >= 5;

    const liveMsg =
        ended
            ? "Session ended."
            : state.attempts.length
                ? `Guess ${state.attempts.length} submitted.`
                : "";

    // write score on session end via RPC, then refresh personal best
    useEffect(() => {
        const endedNow = state.status === "ended" || state.mistakes >= 5;
        if (!endedNow || savedRef.current) return;
        savedRef.current = true;

        // upsert by slug; then refresh local "best"
        (async () => {
            await upsertHighScore(supabase, "harry-potter", state.score);
            if (gameId) {
                const pb = await getPersonalBest(supabase, gameId);
                if (pb !== null) setBest(pb);
            }
        })();
    }, [state.status, state.mistakes, state.score, gameId, supabase]);

    return (
        <RequireUsername>
            <div className={styles.hpRoot}>
                <main className="min-h-dvh p-6 text-zinc-100">
                    <div className="max-w-3xl mx-auto space-y-4 game-screen">
                        {state.status === "idle" && <StartScreen onStart={start} />}

                        {state.status === "playing" && state.target && (
                            <div className="space-y-6">
                                {/* Title */}
                                <h1 className={styles.hpTitle}>Harry Potter Guessing Game</h1>

                                {/* Stats bar */}
                                <div className={`${styles.statsRow}`}>
                                    <div className={styles.stat}><span className={styles.statLabel}>Score</span> {state.score}</div>
                                    <div className={styles.stat}><span className={styles.statLabel}>Round</span> {state.round}</div>
                                    <div className={styles.stat}><span className={styles.statLabel}>Mistakes</span> {state.mistakes}/5</div>
                                    {best !== null && (
                                        <div className={styles.stat}><span className={styles.statLabel}>Personal Best</span> {best}</div>
                                    )}
                                    <div className={styles.stat}>
                                        <span className={styles.statLabel}>Time</span>
                                        <Countdown
                                            key={timerKey}
                                            ms={60_000}
                                            onEnd={() => dispatch({ type: "end" })}
                                            onTick={(ms) => setMsLeft(ms)}
                                        />
                                    </div>
                                </div>

                                <div className="w-full h-2 rounded bg-white/20 relative overflow-hidden">
                                    <div
                                        className="absolute left-0 top-0 h-full bg-[#a47148] transition-[width] duration-100"
                                        style={{ width: `${Math.max(0, Math.min(100, (1 - msLeft / 60000) * 100))}%` }}
                                    />
                                </div>

                                {/* a11y announcements */}
                                <div aria-live="polite" className="sr-only">{liveMsg}</div>

                                {/* Actions */}
                                <div className="flex justify-center">
                                    <Link href="/g/harry-potter/leaderboard" className={styles.hpButton}>
                                        Leaderboard
                                    </Link>
                                </div>

                                {/* Guess form: long input + button below */}
                                <form action={onGuess} className={styles.formColumn} autoComplete="off">
                                    <label htmlFor="guess" className="sr-only">Guess</label>
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
                                        className={`${styles.hpInput} ${styles.hpInputWide}`}
                                        placeholder="Type a character name…"
                                    />
                                    <datalist id="hp-names">
                                        {all.map((c) => (<option key={c.name} value={c.name} />))}
                                    </datalist>
                                    <button type="submit" className={styles.hpButton}>Guess</button>
                                </form>

                                {/* Guess log */}
                                <div className={styles.tableWrap}>
                                    <GuessLogHP target={state.target} characters={all} attempts={state.attempts} />
                                </div>

                                {/* Correct list (kept as-is) */}
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

                        {ended && (
                            <div className="space-y-5 text-center">
                                <h1 className={styles.hpTitle}>Harry Potter Guessing Game</h1>
                                <div className={styles.statsRow}>
                                    <div className={styles.stat}><span className={styles.statLabel}>Final Score</span> {state.score}</div>
                                    {best !== null && (
                                        <div className={styles.stat}><span className={styles.statLabel}>Personal Best</span> {best}</div>
                                    )}
                                </div>
                                <div className="flex justify-center gap-3">
                                    <button className={styles.hpButton} onClick={start}>Play again</button>
                                    <Link href="/g/harry-potter/leaderboard" className={styles.hpButton}>View leaderboard</Link>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </RequireUsername>
    );
}
