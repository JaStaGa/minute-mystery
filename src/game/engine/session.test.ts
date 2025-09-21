import { describe, it, expect, vi } from 'vitest'
import { startSession, startRound, submitGuess, scoreForRound, timeLeft, onTimeout } from './session'

describe('scoring map', () => {
    it('maps guesses to points', () => {
        expect(scoreForRound(1)).toBe(5)
        expect(scoreForRound(2)).toBe(4)
        expect(scoreForRound(3)).toBe(3)
        expect(scoreForRound(4)).toBe(2)
        expect(scoreForRound(5)).toBe(1)
        expect(scoreForRound(6)).toBe(0)
    })
})

describe('guess limit', () => {
    it('reveals after 5 wrong guesses', () => {
        let s = startSession()
        s = startRound(s)
        const target = s.rounds.at(-1)!.targetId
        for (let i = 0; i < 5; i++) s = submitGuess(s, 'not ' + target)
        const r = s.rounds.at(-1)!
        expect(r.correct).toBe(false)
        expect(r.revealed).toBe(true)
    })
})

describe('timeout behavior', () => {
    it('reveals on timeout and freezes score', () => {
        // fake a session that already ended
        vi.setSystemTime(new Date(0))
        let s = startSession({ durationMs: 1 })
        s = startRound(s)
        // one wrong guess
        s = submitGuess(s, 'nope')
        // advance clock beyond end
        vi.setSystemTime(new Date(10_000))
        expect(timeLeft(s)).toBe(0)
        s = onTimeout(s)
        const r = s.rounds.at(-1)!
        expect(r.revealed).toBe(true)
        expect(r.correct).toBe(false)
    })
})
