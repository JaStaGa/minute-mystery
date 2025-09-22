'use client'
import type { HPFields } from '@/game/types'
import { getNewSharedTraits } from '@/game/engine/traits'
import styles from '@/app/g/harry-potter/hp-theme.module.css'

type Props = { target: HPFields; characters: HPFields[]; attempts: string[] }

export default function GuessLogHP({ target, characters, attempts }: Props) {
    const prior: HPFields[] = []

    return (
        <div className="space-y-3">
            {attempts.map((name, i) => {
                const guess = characters.find(c => c.name.toLowerCase() === name.toLowerCase())
                const isCorrect = !!guess && guess.name === target.name

                const traits = guess
                    ? getNewSharedTraits({
                        targetId: target.name,
                        guesses: [...prior.map(p => ({ text: p.name, ts: 0 })), { text: name, ts: 0 }],
                        correct: isCorrect,
                        revealed: false,
                    })
                    : []

                if (guess) prior.push(guess)

                return (
                    <div
                        key={i}
                        className="rounded-xl border border-[#a47148]/40 bg-white/8 p-3 md:grid md:grid-cols-[220px_1fr] md:gap-3"
                    >
                        {/* Left: Guess N: Name (stat pill style; green if correct) */}
                        <div>
                            <span className={isCorrect ? styles.pillSuccess : styles.pill}>
                                <strong className="mr-1">Guess {i + 1}:</strong> {name}
                            </span>
                        </div>

                        {/* Right: shared-trait chips (muted pill if none) */}
                        <div className="mt-2 md:mt-0 flex flex-wrap gap-2">
                            {traits.length > 0 ? (
                                traits.map((t, j) => (
                                    <span key={j} className={styles.pill}>{t}</span>
                                ))
                            ) : (
                                <span className={styles.pillMuted}>No new shared traits</span>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
