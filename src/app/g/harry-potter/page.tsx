"use client";
import { useEffect, useReducer, useRef, useState } from "react";
import Image from "next/image";
import RequireUsername from "@/components/require-username";
import Countdown from "@/game/components/Countdown";
import { reducer, pickRandom } from "@/game/engine/session";
import type { SessionState } from "@/game/engine/session";
import { fetchHP } from "@/game/themes/harry-potter/adapter";
import type { Character } from "@/game/types";
import GuessLogHP from "@/game/components/GuessLogHP";
import StartScreen from "@/game/themes/harry-potter/components/StartScreen";
import styles from "./hp-theme.module.css";
import Link from "next/link";

import { sb } from "@/lib/supabase";
import {
    getGameId,
    getPersonalBest,
    writeScoreAndMaybeBest,
} from "@/lib/scores";

export default function HPGame() {
    const [all, setAll] = useState<Character[]>([]);
    const [ready, setReady] = useState(false);
    const [timerKey, setTimerKey] = useState(0);
    const [solved, setSolved] = useState<Character[]>([]);
    const advanceTimeout = useRef<number | null>(null);

    const [state, dispatch] = useReducer(reducer, {
        status: "idle",
        target: null,
        attempts: [],
        score: 0,
        mistakes: 0,
        round: 0,
    } as SessionState);

    // scoring persistence
    const supabase = sb();
    const [gameId, setGameId] = useState<string | null>(null);
    const [best, setBest] = useState<number | null>(null);
    const savedRef = useRef(false);

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
        setTimerKey((k) => k + 1);
        dispatch({ type: "start", target: pickRandom(all) });
    }

    function onGuess(fd: FormData) {
        const name = String(fd.get("guess") || "");
        const target = state.target as Character | null;
        const correct = !!target && name.toLowerCase() === target.name.toLowerCase();

        dispatch({ type: "guess", name });

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

    const ended = state.status === "ended" || state.mistakes >= 5;

    // write score on session end, then refresh personal best
    useEffect(() => {
        const endedNow = state.status === "ended" || state.mistakes >= 5;
        if (!endedNow || savedRef.current || !gameId) return;
        savedRef.current = true;
        writeScoreAndMaybeBest(supabase, gameId, state.score).then((newBest) => {
            if (newBest !== null) setBest(newBest);
        });
    }, [state.status, state.mistakes, state.score, gameId, supabase]);

    return (
        <RequireUsername>
            <div className={styles.hpRoot}>
                <main className="min-h-dvh p-6 text-zinc-100">
                    <div className="max-w-3xl mx-auto space-y-4 game-screen">
                        {state.status === "idle" && <StartScreen onStart={start} />}

                        {state.status === "playing" && state.target && (
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center gap-4">
                                    <div>Score: <strong>{state.score}</strong></div>
                                    <div>Round: <strong>{state.round}</strong></div>
                                    <div>Mistakes: <strong>{state.mistakes}</strong>/5</div>
                                    {best !== null && <div>Personal Best: <strong>{best}</strong></div>}
                                    <Countdown key={timerKey} ms={60_000} onEnd={() => dispatch({ type: "end" })} />
                                </div>

                                <Link href="/g/harry-potter/leaderboard" className={styles.hpButton}>
                                    Leaderboard
                                </Link>

                                <form action={onGuess} className="flex gap-2" autoComplete="off">
                                    <input
                                        name="guess"
                                        list="hp-names"
                                        autoComplete="off"
                                        autoCorrect="off"
                                        autoCapitalize="off"
                                        spellCheck={false}
                                        className={styles.hpInput}
                                        placeholder="Type a character name…"
                                    />
                                    <datalist id="hp-names">
                                        {all.map((c) => (
                                            <option key={c.id} value={c.name} />
                                        ))}
                                    </datalist>
                                    <button type="submit" className={styles.hpButton}>
                                        Guess
                                    </button>
                                </form>

                                <GuessLogHP target={state.target} characters={all} attempts={state.attempts} />

                                {solved.length > 0 && (
                                    <div className="space-y-2">
                                        <h2 className="text-lg font-semibold">Correct this session</h2>
                                        <ul className="space-y-2">
                                            {solved.map((c) => (
                                                <li
                                                    key={c.id}
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
                                                    <div className="leading-tight">
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
                            <div className="space-y-3">
                                <div className="text-xl font-semibold">Session ended</div>
                                <div>Final score: {state.score}</div>
                                {best !== null && <div>Personal Best: {best}</div>}
                                <button
                                    className={styles.hpButton}
                                    onClick={() => dispatch({ type: "reset" })}
                                >
                                    Reset
                                </button>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </RequireUsername>
    );
}
