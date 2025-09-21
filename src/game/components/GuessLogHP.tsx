'use client'
import type { HPFields } from '@/game/types'
import { getNewSharedTraits } from '@/game/engine/traits'

type Props = {
    target: HPFields
    characters: HPFields[]
    attempts: string[] // raw names in the order guessed
}

export default function GuessLogHP({ target, characters, attempts }: Props) {
    // Track prior concrete guesses to avoid repeating traits
    const prior: HPFields[] = []

    return (
        <div className="space-y-2">
            {attempts.map((name, i) => {
                const guess = characters.find(c => c.name.toLowerCase() === name.toLowerCase())
                const traits = guess ? getNewSharedTraits({
                    targetId: target.name,
                    guesses: [
                        // build a minimal Round.guesses array ending with this guess
                        ...prior.map(p => ({ text: p.name, ts: 0 })),
                        { text: name, ts: 0 }
                    ],
                    correct: !!guess && guess.name === target.name,
                    revealed: false,
                }) : []

                if (guess) prior.push(guess)

                return (
                    <div key={i} className="grid grid-cols-1 sm:grid-cols-[240px_1fr] gap-2 items-start border rounded p-2 bg-white/5">
                        <div className="font-medium">Guess {i + 1}: {name}</div>
                        <div className="flex flex-wrap gap-2">
                            {traits.length > 0
                                ? traits.map((t, j) => (
                                    <span key={j} className="px-2 py-1 text-sm border rounded bg-white/10">{t}</span>
                                ))
                                : <span className="text-sm opacity-70">No new shared traits</span>}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
