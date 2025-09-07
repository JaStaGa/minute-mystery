import type { Character } from "@/game/types";

export type SessionStatus = "idle" | "playing" | "ended";

export type SessionState = {
    status: SessionStatus;
    target: Character | null;
    attempts: string[];
    score: number;
    mistakes: number;      // wrong-in-a-row
    round: number;         // starts at 1 each run
};

type Start = { type: "start"; target: Character };
type Guess = { type: "guess"; name: string };
type Next = { type: "next-target"; target: Character };
type End = { type: "end" };
type Reset = { type: "reset" };
export type SessionAction = Start | Guess | Next | End | Reset;

export function reducer(state: SessionState, action: SessionAction): SessionState {
    switch (action.type) {
        case "start":
            return {
                status: "playing",
                target: action.target,
                attempts: [],
                score: 0,
                mistakes: 0,
                round: 1,
            };

        case "guess": {
            if (state.status !== "playing" || !state.target) return state;
            const name = action.name.trim();
            if (!name) return state;

            const correct = name.toLowerCase() === state.target.name.toLowerCase();
            if (correct) {
                const already = state.attempts.some(a => a.toLowerCase() === name.toLowerCase());
                const attempts = already ? state.attempts : [...state.attempts, name];
                return {
                    ...state,
                    attempts,
                    score: state.score + state.round, // score grows by round number
                    mistakes: 0,                      // reset streak on correct
                };
            }

            const already = state.attempts.some(a => a.toLowerCase() === name.toLowerCase());
            const attempts = already ? state.attempts : [...state.attempts, name];
            const mistakes = already ? state.mistakes : state.mistakes + 1;
            return { ...state, attempts, mistakes };
        }

        case "next-target":
            if (state.status !== "playing") return state;
            return { ...state, target: action.target, attempts: [], round: state.round + 1 };

        case "end":
            return { ...state, status: "ended" };

        case "reset":
            return { status: "idle", target: null, attempts: [], score: 0, mistakes: 0, round: 0 };

        default:
            return state;
    }
}

// helper used elsewhere
export const pickRandom = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
