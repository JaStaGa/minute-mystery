// Re-exports and helpers for the HP dataset
import { HPCharacter } from '../../types'
import { characters } from './characters'

export { characters }

export const names = characters.map((c) => c.name)

export function findByNameInsensitive(name: string): HPCharacter | undefined {
    const n = name.trim().toLowerCase()
    return characters.find((c) => c.name.toLowerCase() === n)
}

export function matchNames(query: string): string[] {
    const q = query.trim().toLowerCase()
    if (!q) return names
    return names.filter((n) => n.toLowerCase().includes(q)).slice(0, 20)
}
