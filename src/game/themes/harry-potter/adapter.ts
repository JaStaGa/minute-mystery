import type { Character } from '@/game/types'
import { characters } from '@/game/data/hp/characters'

/** Return the 20 local characters. No network calls. */
export async function fetchHP(): Promise<Character[]> {
    return characters
}
