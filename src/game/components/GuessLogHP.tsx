'use client'
import type { HPFields } from '@/game/types'
import { getNewSharedTraitsHP } from '@/game/engine/traits'
import styles from '@/app/g/harry-potter/hp-theme.module.css'

type Props = { target: HPFields; characters: HPFields[]; attempts: string[] }

export default function GuessLogHP({ target, characters, attempts }: Props) {
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

    // theme color
    const brown = '#4b2e2e'

    return (
        <div className={styles.logWrap}>
            {/* Header row */}
            <div className={styles.logHeadRow}>
                <div
                    className={styles.logHead}
                    style={{
                        textAlign: 'center',
                        color: brown,
                        fontSize: 'clamp(0.95rem, 2.8vw, 1.25rem)',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                    }}
                >
                    Guesses
                </div>
                <div
                    className={styles.logHead}
                    style={{
                        textAlign: 'center',
                        color: brown,
                        fontSize: 'clamp(0.95rem, 2.8vw, 1.25rem)',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                    }}
                >
                    Similarities
                </div>
            </div>

            {rows.map((r, i) => (
                <div key={i} className={styles.logRow}>
                    <div
                        className={styles.logGuessCell}
                        style={{ textAlign: 'center', justifyContent: 'center' }}
                    >
                        <span className={r.isCorrect ? styles.pillSuccessSm : styles.namePill}>
                            <strong className={styles.guessIndex}>{r.idx}:</strong>
                            <span className={styles.guessName}>{r.name}</span>
                        </span>
                    </div>

                    <div
                        className={styles.logTraitsCell}
                        style={{ textAlign: 'center', justifyContent: 'center' }}
                    >
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
