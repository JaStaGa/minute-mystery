// Framework-agnostic game engine for Minute Mystery (HP v1)
import { characters } from '@/game/data/hp/characters'
import type { Session, Round } from '@/game/types'
import type { HPFields } from '@/game/types'

const DURATION_MS = 60_000

// ----- utilities
const now = () => Date.now()
const canon = (s: string) => s.trim().toLowerCase()
const allNames = characters.map(c => c.name)
const unseen = (s: Session) =>
    allNames.filter(n => !s.rounds.some(r => r.targetId === n))

// ----- scoring
export function scoreForRound(guessesUsed: number): number {
    switch (guessesUsed) {
        case 1: return 5
        case 2: return 4
        case 3: return 3
        case 4: return 2
        case 5: return 1
        default: return 0
    }
}

export function tallyScore(s: Session): number {
    return s.rounds.reduce((acc, r) => {
        if (r.correct) return acc + scoreForRound(r.guesses.length)
        return acc
    }, 0)
}

// ----- timers
export function startSession({ theme = 'harry-potter' as const, durationMs = DURATION_MS } = {}): Session {
    const t = now()
    return {
        theme,
        startedAt: t,
        endsAt: t + durationMs,
        rounds: [],
        score: 0,
    }
}

export function timeLeft(s: Session): number {
    return Math.max(0, s.endsAt - now())
}

// If time hits 0, reveal current round and freeze score
export function onTimeout(s: Session): Session {
    if (timeLeft(s) > 0) return s
    const rounds = s.rounds.slice()
    const cur = rounds[rounds.length - 1]
    if (cur && !cur.correct) cur.revealed = true
    return { ...s, rounds, score: tallyScore({ ...s, rounds }) }
}

// ----- rounds
export function startRound(s: Session): Session {
    if (timeLeft(s) === 0) return onTimeout(s)
    const options = unseen(s)
    if (options.length === 0) return s // nothing left to pick
    const targetId = options[Math.floor(Math.random() * options.length)]
    const round: Round = { targetId, guesses: [], correct: false, revealed: false }
    return { ...s, rounds: [...s.rounds, round] }
}

// Accept a free-text guess. Correct on exact canonical name match.
export function submitGuess(s: Session, guessText: string): Session {
    if (timeLeft(s) === 0) return onTimeout(s)
    if (s.rounds.length === 0) return s
    const rounds = s.rounds.slice()
    const cur = rounds[rounds.length - 1]
    if (cur.correct || cur.revealed) return s

    const g = { text: guessText, ts: now() }
    cur.guesses = [...cur.guesses, g]

    const correct = canon(guessText) === canon(cur.targetId)
    if (correct) {
        cur.correct = true
    } else if (cur.guesses.length >= 5) {
        // 5 wrong guesses ends the round without points
        cur.revealed = true
    }

    const next = { ...s, rounds }
    next.score = tallyScore(next)
    return next
}

/* -------- Optional shims for existing UI (keeps imports compiling) -------- */
// Random pick helper used in your page.tsx
export function pickRandom<T>(list: T[]): T {
    return list[Math.floor(Math.random() * list.length)]
}

// Minimal reducer that mirrors your legacy shape.
// You can delete this once page.tsx is fully migrated to the engine API.
export type SessionState = {
    status: 'idle' | 'playing' | 'ended'
    target: HPFields | null
    attempts: string[]
    score: number
    mistakes: number
    round: number
}

type Action =
    | { type: 'start'; target: HPFields }
    | { type: 'guess'; name: string }
    | { type: 'next-target'; target: HPFields }
    | { type: 'end' }

export function reducer(state: SessionState, action: Action): SessionState {
    switch (action.type) {
        case 'start':
            return { status: 'playing', target: action.target, attempts: [], score: 0, mistakes: 0, round: 1 }
        case 'guess': {
            const attempts = [...state.attempts, action.name]
            const correct =
                state.target && action.name.trim().toLowerCase() === state.target.name.toLowerCase()
            if (correct) {
                return {
                    ...state,
                    attempts,
                    score: state.score + scoreForRound(attempts.length),
                    round: state.round + 1,
                    mistakes: 0,
                }
            }
            const mistakes = state.mistakes + 1
            return mistakes >= 5
                ? { ...state, attempts, mistakes, status: 'ended' }
                : { ...state, attempts, mistakes }
        }
        case 'next-target':
            return { ...state, target: action.target, attempts: [], mistakes: 0 }
        case 'end':
            return { ...state, status: 'ended' }
        default:
            return state
    }
}

import type { SWFields } from '@/game/types'

export type SessionStateSW = {
    status: 'idle' | 'playing' | 'ended'
    target: SWFields | null
    attempts: string[]
    score: number
    mistakes: number         // mistakes for the current round
    round: number
}

type ActionSW =
    | { type: 'start'; target: SWFields }
    | { type: 'guess'; name: string }
    | { type: 'next-target'; target: SWFields }
    | { type: 'end' }

export function reducerSW(state: SessionStateSW, action: ActionSW): SessionStateSW {
    switch (action.type) {
        case 'start':
            return { status: 'playing', target: action.target, attempts: [], score: 0, mistakes: 0, round: 1 }

        case 'guess': {
            if (!state.target || state.status !== 'playing') return state;

            const attempts = [...state.attempts, action.name];
            const correct = action.name.trim().toLowerCase() === state.target.name.toLowerCase();

            if (correct) {
                // award per-guess score; mistakes stay as-is for this round until next-target resets
                const gained = scoreForRound(attempts.length);
                return { ...state, attempts, score: state.score + gained, round: state.round + 1 };
            }

            // wrong guess -> bump mistakes; end at 5
            const mistakes = Math.min(5, state.mistakes + 1);
            const status = mistakes >= 5 ? 'ended' : 'playing';
            return { ...state, attempts, mistakes, status };
        }

        case 'next-target':
            // new round -> clear attempts and mistakes
            return { ...state, target: action.target, attempts: [], mistakes: 0 };

        case 'end':
            return { ...state, status: 'ended' };

        default:
            return state;
    }
}
