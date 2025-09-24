import type { HPFields } from '@/game/types'
import { TRAIT_KEYS as HP_KEYS } from '@/game/types'
import type { SWFields } from '@/game/types'
import { SW_TRAIT_KEYS, SW_MULTI_KEYS } from '@/game/types'

// helpers
const canon = (s: string) => s.trim().toLowerCase()
const tokens = (s: string) => s.split(',').map(t => canon(t)).filter(Boolean)

function sameValue(k: string, a: string, b: string, multiKeys: Set<string>) {
    if (!multiKeys.has(k)) return canon(a) === canon(b)
    const A = new Set(tokens(a))
    return tokens(b).some(t => A.has(t))
}

// ----- HP (exact match on all keys)
export function compareTraitsHP(a: HPFields, b: HPFields) {
    const shared: string[] = []
    for (const k of HP_KEYS) {
        const va = String(a[k] ?? '')
        const vb = String(b[k] ?? '')
        if (va && vb && canon(va) === canon(vb)) shared.push(`${k}: ${vb}`)
    }
    return {
        shared,
        newSince(prev: Set<string>) { return shared.filter(t => !prev.has(t)) },
    }
}

// ----- SW (overlap on affiliation, era; exact else)
export function compareTraitsSW(a: SWFields, b: SWFields) {
    const shared: string[] = []
    for (const k of SW_TRAIT_KEYS) {
        const va = String(a[k] ?? '')
        const vb = String(b[k] ?? '')
        if (va && vb && sameValue(k, va, vb, SW_MULTI_KEYS as Set<string>)) shared.push(`${k}: ${vb}`)
    }
    return {
        shared,
        newSince(prev: Set<string>) { return shared.filter(t => !prev.has(t)) },
    }
}

// round helper (shared logic)
type Guess = { text: string; ts: number }

// HP
export function getNewSharedTraitsHP(round: { targetId: string; guesses: Guess[] }, characters: HPFields[]) {
    const target = characters.find(c => canon(c.name) === canon(round.targetId))
    if (!target) return []
    const seen = new Set<string>()
    for (let i = 0; i < round.guesses.length - 1; i++) {
        const g = round.guesses[i]
        const guess = characters.find(c => canon(c.name) === canon(g.text))
        if (guess) compareTraitsHP(guess, target).shared.forEach(t => seen.add(t))
    }
    const last = round.guesses[round.guesses.length - 1]
    if (!last) return []
    const guess = characters.find(c => canon(c.name) === canon(last.text))
    if (!guess) return []
    return compareTraitsHP(guess, target).newSince(seen)
}

// SW
export function getNewSharedTraitsSW(round: { targetId: string; guesses: Guess[] }, characters: SWFields[]) {
    const target = characters.find(c => canon(c.name) === canon(round.targetId))
    if (!target) return []
    const seen = new Set<string>()
    for (let i = 0; i < round.guesses.length - 1; i++) {
        const g = round.guesses[i]
        const guess = characters.find(c => canon(c.name) === canon(g.text))
        if (guess) compareTraitsSW(guess, target).shared.forEach(t => seen.add(t))
    }
    const last = round.guesses[round.guesses.length - 1]
    if (!last) return []
    const guess = characters.find(c => canon(c.name) === canon(last.text))
    if (!guess) return []
    return compareTraitsSW(guess, target).newSince(seen)
}
