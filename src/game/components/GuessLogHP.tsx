'use client'
import type { HPFields } from '@/game/types'
import { getNewSharedTraitsHP } from '@/game/engine/traits'
import styles from '@/app/g/harry-potter/hp-theme.module.css'

type Props = { target: HPFields; characters: HPFields[]; attempts: string[] }

export default function GuessLogHP({ target, characters, attempts }: Props) {
    // Build rows once so we don’t recompute in render
    const rows = attempts.map((name, i) => {
        const guess = characters.find(c => c.name.toLowerCase() === name.toLowerCase())
        const isCorrect = !!guess && guess.name === target.name
        const traits = guess
            ? getNewSharedTraitsHP(
                {
                    targetId: target.name,
                    guesses: [
                        ...attempts.slice(0, i).map(g => ({ text: g, ts: 0 })),
                        { text: name, ts: 0 },
                    ],
                },
                characters,
            )
            : []
        return { name, traits, isCorrect, idx: i + 1 }
    })

    return (
        <div className={styles.logWrap}>
            <div className={styles.logHeadRow}>
                <div className={styles.logHead}>Guesses</div>
                <div className={styles.logHead}>Similarities</div>
            </div>

            {rows.map((r, i) => (
                <div key={i} className={styles.logRow}>
                    <div className={styles.logGuessCell}>
                        <span className={r.isCorrect ? styles.pillSuccessSm : styles.namePill}>
                            <strong className={styles.guessIndex}>{r.idx}:</strong>
                            <span className={styles.guessName}>{r.name}</span>
                        </span>
                    </div>

                    <div className={styles.logTraitsCell}>
                        {r.traits.length ? (
                            r.traits.map((t, j) => (
                                <span key={j} className={styles.traitPill}>{t}</span>
                            ))
                        ) : (
                            <span className={styles.traitPillMuted}>No new shared traits</span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
