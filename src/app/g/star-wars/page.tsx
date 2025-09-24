"use client";
import { useEffect, useReducer, useRef, useState } from "react";
import RequireUsername from "@/components/require-username";
import Countdown from "@/game/components/Countdown";
import { reducerSW as reducer, pickRandom } from "@/game/engine/session";
import type { SessionStateSW as SessionState } from "@/game/engine/session";
import { fetchSW } from "@/game/themes/star-wars/adapter";
import type { SWFields } from "@/game/types";
import GuessLogSW from "@/game/components/GuessLogSW";
import sw from "./sw-theme.module.css";
import { Orbitron } from "next/font/google";
const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-sw" });

export default function SWGame() {
    const [all, setAll] = useState<SWFields[]>([]);
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

    useEffect(() => {
        fetchSW().then((cs) => { setAll(cs); setReady(true); });
    }, []);

    function start() {
        if (!ready) return;
        setMsLeft(60_000);
        setTimerKey((k) => k + 1);
        dispatch({ type: "start", target: pickRandom(all) });
    }

    function onGuess(fd: FormData) {
        if (state.status === "ended" || state.mistakes >= 5) return;
        const name = String(fd.get("guess") || "").trim();
        if (!name) return;
        const known = new Set(all.map(c => c.name.toLowerCase()));
        if (!known.has(name.toLowerCase())) return;
        if (state.attempts.some(a => a.toLowerCase() === name.toLowerCase())) return;

        const target = state.target as SWFields | null;
        const correct = !!target && name.toLowerCase() === target.name.toLowerCase();

        dispatch({ type: "guess", name });
        setTyped("");

        if (correct && target) {
            if (advanceTimeout.current) window.clearTimeout(advanceTimeout.current);
            advanceTimeout.current = window.setTimeout(() => {
                dispatch({ type: "next-target", target: pickRandom(all) });
            }, 1200);
        }
    }

    const ended = state.status === "ended" || state.mistakes >= 5;
    const liveMsg =
        ended ? "Session ended."
            : state.attempts.length ? `Guess ${state.attempts.length} submitted.`
                : "";

    return (
        <RequireUsername>
            <div className={`${orbitron.variable} ${sw.swRoot}`}>
                <main className="min-h-dvh p-6 text-zinc-100">
                    <div className={sw.panel}>
                        {state.status === "idle" && (
                            <div className="space-y-3 text-center">
                                <h1 className={sw.swTitle}>Star Wars Guessing Game</h1>
                                <button className={sw.swButton} onClick={start}>Start</button>
                            </div>
                        )}

                        {state.status === "playing" && state.target && (
                            <div className="space-y-6">
                                <h1 className={sw.swTitle}>Star Wars Guessing Game</h1>

                                <div className={sw.statsRow}>
                                    <div className={sw.stat}><span className={sw.statLabel}>Score</span> {state.score}</div>
                                    <div className={sw.stat}><span className={sw.statLabel}>Round</span> {state.round}</div>
                                    <div className={sw.stat}><span className={sw.statLabel}>Mistakes</span> {Math.min(state.mistakes, 5)}/5</div>
                                    <div className={sw.stat}>
                                        <span className={sw.statLabel}>Time</span>
                                        <Countdown
                                            key={timerKey}
                                            ms={60_000}
                                            onEnd={() => dispatch({ type: "end" })}
                                            onTick={(ms) => setMsLeft(ms)}
                                        />
                                    </div>
                                </div>

                                {/* progress bar */}
                                <div className={sw.timeTrack}>
                                    <div
                                        className={sw.timeFill}
                                        style={{ width: `${Math.max(0, Math.min(100, (1 - msLeft / 60000) * 100))}%` }}
                                    />
                                </div>

                                <div aria-live="polite" className="sr-only">{liveMsg}</div>

                                <form action={onGuess} className={sw.formColumn} autoComplete="off">
                                    <label htmlFor="guess" className="sr-only">Guess</label>
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
                                        className={`${sw.swInput} ${sw.swInputWide}`}
                                        placeholder="Type a character name…"
                                    />
                                    <datalist id="sw-names">
                                        {all.map((c) => (<option key={c.name} value={c.name} />))}
                                    </datalist>
                                    <button type="submit" className={sw.swButton}>Guess</button>
                                </form>

                                <div className={sw.tableWrap}>
                                    <GuessLogSW target={state.target} characters={all} attempts={state.attempts} />
                                </div>
                            </div>
                        )}

                        {ended && (
                            <div className={`space-y-5 text-center ${sw.endBlock}`}>
                                <h1 className={sw.swTitle}>Star Wars Guessing Game</h1>
                                <div className={sw.statsRow}>
                                    <div className={sw.stat}><span className={sw.statLabel}>Final Score</span> {state.score}</div>
                                </div>
                                <button className={sw.swButton} onClick={start}>Play again</button>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </RequireUsername>
    );
}
