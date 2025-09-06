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
    } as SessionState);

    useEffect(() => {
        fetchHP().then((cs) => {
            setAll(cs);
            setReady(true);
        });
    }, []);

    function start() {
        if (!ready) return;
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

    useEffect(() => {
        return () => {
            if (advanceTimeout.current) window.clearTimeout(advanceTimeout.current);
        };
    }, []);

    const ended = state.status === "ended" || state.mistakes >= 5;

    return (
        <RequireUsername>
            <main className="min-h-dvh p-6 text-zinc-100">
                <div className="max-w-3xl mx-auto space-y-4">
                    <h1 className="text-2xl font-bold">Harry Potter</h1>

                    {state.status !== "playing" && (
                        <button className="px-4 py-2 rounded bg-white text-black" onClick={start}>
                            Start 60s Session
                        </button>
                    )}

                    {state.status === "playing" && state.target && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div>
                                    Score: <strong>{state.score}</strong>
                                </div>
                                <div>
                                    Mistakes: <strong>{state.mistakes}</strong>/5
                                </div>
                                <Countdown key={timerKey} ms={60_000} onEnd={() => dispatch({ type: "end" })} />
                            </div>

                            <form action={onGuess} className="flex gap-2">
                                <input
                                    name="guess"
                                    list="hp-names"
                                    className="flex-1 rounded px-3 py-2 text-black"
                                    placeholder="Type a character name…"
                                />
                                <datalist id="hp-names">
                                    {all.map((c) => (
                                        <option key={c.id} value={c.name} />
                                    ))}
                                </datalist>
                                <button className="px-3 py-2 rounded bg-white text-black" type="submit">
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
                            <button className="px-4 py-2 rounded bg-white text-black" onClick={() => dispatch({ type: "reset" })}>
                                Reset
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </RequireUsername>
    );
}
