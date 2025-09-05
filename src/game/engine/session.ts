import { Character } from "../types";

export type Status = "idle" | "playing" | "ended";

export type SessionState = {
    status: Status;
    target: Character | null;
    attempts: string[];
    score: number;
    mistakes: number; // stop at 5
};

export type Action =
    | { type: "start"; target: Character }
    | { type: "guess"; name: string }
    | { type: "next-target"; target: Character } // after correct
    | { type: "end" }
    | { type: "reset" };

export function reducer(state: SessionState, action: Action): SessionState {
    switch (action.type) {
        case "start":
            return { status: "playing", target: action.target, attempts: [], score: 0, mistakes: 0 };
        case "guess": {
            if (state.status !== "playing" || !state.target) return state;
            const name = action.name.trim();
            if (!name) return state;
            const correct = name.toLowerCase() === state.target.name.toLowerCase();
            if (correct) {
                // score increments; target changed by "next-target"
                return { ...state, score: state.score + 1, attempts: [] };
            }
            const already = state.attempts.some(a => a.toLowerCase() === name.toLowerCase());
            const attempts = already ? state.attempts : [...state.attempts, name];
            const mistakes = already ? state.mistakes : state.mistakes + 1;
            return { ...state, attempts, mistakes };
        }
        case "next-target":
            if (state.status !== "playing") return state;
            return { ...state, target: action.target, attempts: [] };
        case "end":
            return { ...state, status: "ended" };
        case "reset":
            return { status: "idle", target: null, attempts: [], score: 0, mistakes: 0 };
        default:
            return state;
    }
}

export function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}
