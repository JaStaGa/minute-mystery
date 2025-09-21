// Trait comparison helpers for “shared attributes” hints
import type { HPFields, TraitKey, Round } from '@/game/types'
import { TRAIT_KEYS } from '@/game/types'
import { characters } from '@/game/data/hp/characters'

function canon(v: string) {
    return v.trim().toLowerCase()
}
function label(k: TraitKey, v: string) {
    return `${k}: ${v}`
}

/**
 * Compare two characters and list the shared traits using “field: value” strings,
 * in the order defined by TRAIT_KEYS (role, house, gender, hair, ancestry).
 */
export function compareTraits(a: HPFields, b: HPFields) {
    const shared: string[] = []
    for (const k of TRAIT_KEYS) {
        const va = String(a[k] ?? '')
        const vb = String(b[k] ?? '')
        if (va && vb && canon(va) === canon(vb)) {
            // Keep the original casing for display
            shared.push(label(k, vb))
        }
    }
    return {
        shared,
        newSince(prevShared: Set<string>) {
            return shared.filter(t => !prevShared.has(t))
        },
    }
}

/**
 * Given a Round and the dataset, return the NEW shared traits for the most
 * recent guess, excluding any traits already revealed by earlier guesses
 * in the same round.
 */
export function getNewSharedTraits(round: Round): string[] {
    const target = characters.find(c => canon(c.name) === canon(round.targetId))
    if (!target) return []

    // Build a set of all traits already revealed by prior guesses this round.
    const seen = new Set<string>()
    for (let i = 0; i < round.guesses.length - 1; i++) {
        const g = round.guesses[i]
        const guess = characters.find(c => canon(c.name) === canon(g.text))
        if (!guess) continue
        for (const t of compareTraits(guess, target).shared) {
            seen.add(t)
        }
    }

    // Now compute only the NEW traits for the latest guess.
    const last = round.guesses[round.guesses.length - 1]
    if (!last) return []
    const guess = characters.find(c => canon(c.name) === canon(last.text))
    if (!guess) return []
    return compareTraits(guess, target).newSince(seen)
}

// Optional re-export for docs consistency
export const FIELDS_ORDER = TRAIT_KEYS
