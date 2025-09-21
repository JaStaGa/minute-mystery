"use client";
import { useEffect, useReducer, useState } from "react";
import RequireUsername from "@/components/require-username";
import Countdown from "@/game/components/Countdown";
import { reducer, pickRandom } from "@/game/engine/session";
import type { SessionState } from "@/game/engine/session";
import { FakeAdapter } from "@/game/themes/fake/adapter";
import type { HPFields } from "@/game/types";

export default function DevGame() {
    // Use HPFields[] instead of {id,name}[]
    const [all, setAll] = useState<HPFields[]>([]);
    const [ready, setReady] = useState(false);

    const [state, dispatch] = useReducer(reducer, {
        status: "idle",
        target: null,
        attempts: [],
        score: 0,
        mistakes: 0,
        round: 0,
    } as SessionState);

    // Fetch characters with a typed result
    useEffect(() => {
        (async () => {
            const cs: HPFields[] = await FakeAdapter.fetchCharacters();
            setAll(cs);
            setReady(true);
        })();
    }, []);

    function start() {
        if (!ready) return;
        dispatch({ type: "start", target: pickRandom(all) });
    }

    function onGuess(form: FormData) {
        const name = String(form.get("guess") || "");
        const correct =
            state.target && name.toLowerCase() === state.target.name.toLowerCase();

        dispatch({ type: "guess", name });
        if (correct) dispatch({ type: "next-target", target: pickRandom(all) });
    }

    const ended = state.status === "ended" || state.mistakes >= 5;
    const namesList = all.map((c) => c.name).join(", ");

    return (
        <RequireUsername>
            <main className="min-h-dvh p-6 text-zinc-100">
                <div className="max-w-xl mx-auto space-y-4">
                    <h1 className="text-2xl font-bold">Dev Session</h1>

                    {state.status !== "playing" && (
                        <button className="px-4 py-2 rounded bg-white text-black" onClick={start}>
                            Start 60s Session
                        </button>
                    )}

                    {state.status === "playing" && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-4">
                                <div>
                                    Score: <strong>{state.score}</strong>
                                </div>
                                <div>
                                    Mistakes: <strong>{state.mistakes}</strong>/5
                                </div>
                                <Countdown ms={60_000} onEnd={() => dispatch({ type: "end" })} />
                            </div>

                            <div className="text-sm text-zinc-400">
                                Guess the name exactly. Target is one of: {namesList}
                            </div>

                            <form action={(fd) => onGuess(fd)} className="flex gap-2">
                                <input
                                    name="guess"
                                    className="flex-1 rounded px-3 py-2 text-black"
                                    placeholder="Type a name..."
                                />
                                <button className="px-3 py-2 rounded bg-white text-black" type="submit">
                                    Guess
                                </button>
                            </form>

                            <ul className="list-disc pl-6">
                                {state.attempts.map((a, i) => (
                                    <li key={i}>{a}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {ended && (
                        <div className="space-y-3">
                            <div className="text-xl font-semibold">Session ended</div>
                            <div>Final score: {state.score}</div>
                            {/* No 'reset' action in reducer; just start again */}
                            <button className="px-4 py-2 rounded bg-white text-black" onClick={start}>
                                Start New Session
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </RequireUsername>
    );
}
