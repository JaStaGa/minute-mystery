// Shared game types and trait order

export type ThemeId = 'harry-potter'

export type TraitKey = 'role' | 'house' | 'gender' | 'hair' | 'ancestry'
export const TRAIT_KEYS: readonly TraitKey[] = [
    'role',
    'house',
    'gender',
    'hair',
    'ancestry',
] as const

// Dataset shape
export type HPFields = {
    name: string
    role: string
    house: string
    gender: 'male' | 'female' | 'other'
    hair: string
    ancestry: string
    image?: string // placeholder now
    note: string
}

// Back-compat aliases
export type HPCharacter = HPFields
export type Character = HPFields

// Guess/round/session (engine will consume these next)
export type Guess = { text: string; ts: number }

export type Round = {
    targetId: string // v1: use the character name as the id
    guesses: Guess[]
    correct: boolean
    revealed: boolean // set true on timeout reveal
}

export type Session = {
    theme: ThemeId
    startedAt: number
    endsAt: number // startedAt + 60_000
    rounds: Round[]
    score: number
}

export type SWFields = {
    name: string
    role: string
    affiliation: string      // comma-separated tokens
    type: 'human' | 'alien' | 'droid'
    forceSensitive: 'Y' | 'N'
    weapon: string
    era: string              // comma-separated tokens
    image?: string
    note: string
}
export type SWTraitKey = 'role' | 'affiliation' | 'type' | 'forceSensitive' | 'weapon' | 'era'
export const SW_TRAIT_KEYS: readonly SWTraitKey[] =
    ['role', 'affiliation', 'type', 'forceSensitive', 'weapon', 'era'] as const
export const SW_MULTI_KEYS = new Set<SWTraitKey>(['affiliation', 'era', 'weapon'])
