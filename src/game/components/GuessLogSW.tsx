'use client'
import type { SWFields } from '@/game/types'
import { getNewSharedTraitsSW } from '@/game/engine/traits'
import sw from '@/app/g/star-wars/sw-theme.module.css'

type Props = { target: SWFields; characters: SWFields[]; attempts: string[] }

export default function GuessLogSW({ target, characters, attempts }: Props) {
    const prior: SWFields[] = []

    return (
        <div className="space-y-3">
            {attempts.map((name, i) => {
                const guess = characters.find(c => c.name.toLowerCase() === name.toLowerCase())
                const isCorrect = !!guess && guess.name === target.name

                const traits = guess
                    ? getNewSharedTraitsSW({
                        targetId: target.name,
                        guesses: [...prior.map(p => ({ text: p.name, ts: 0 })), { text: name, ts: 0 }],
                    }, characters)
                    : []

                if (guess) prior.push(guess)

                return (
                    <div
                        key={i}
                        className={`${sw.guessCard} p-3 md:grid md:grid-cols-[220px_1fr] md:gap-3`}
                    >
                        <div>
                            <span className={isCorrect ? sw.pillSuccess : sw.pill}>
                                <strong className="mr-1">Guess {i + 1}:</strong>{name}
                            </span>
                        </div>

                        <div className="mt-2 md:mt-0 flex flex-wrap gap-2">
                            {traits.length
                                ? traits.map((t: string, j: number) => <span key={j} className={sw.pill}>{t}</span>)
                                : <span className={sw.pillMuted}>No new shared traits</span>}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
