// Lightweight runtime checks for the dataset
import { characters } from './characters'
import { HPCharacter, TRAIT_KEYS, TraitKey } from '../../types'

export function validateCharacters(list: HPCharacter[]): string[] {
    const issues: string[] = []
    if (list.length !== 20) issues.push(`Expected 20 characters, found ${list.length}`)

    const seen = new Set<string>()
    for (const c of list) {
        if (seen.has(c.name.toLowerCase())) issues.push(`Duplicate name: ${c.name}`)
        seen.add(c.name.toLowerCase())

        for (const k of TRAIT_KEYS as readonly TraitKey[]) {
            const v = String((c as Record<TraitKey, string | undefined>)[k] ?? '').trim()
            if (!v) issues.push(`Missing ${k} for ${c.name}`)
        }
        if (!String(c.note ?? '').trim()) issues.push(`Missing note for ${c.name}`)
    }
    return issues
}

// Optional: run once in dev to spot problems
export const datasetIssues =
    process.env.NODE_ENV !== 'production' ? validateCharacters(characters) : []
