import type { SWFields } from '@/game/types'
import { swCharacters } from '@/game/data/sw/characters'

export async function fetchSW(): Promise<SWFields[]> {
    return [...swCharacters].sort((a, b) => a.name.localeCompare(b.name))
}
