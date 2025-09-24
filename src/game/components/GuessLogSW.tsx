'use client'

import type { SWFields } from '@/game/types'
import { getNewSharedTraitsSW } from '@/game/engine/traits'
import styles from '@/app/g/star-wars/sw-theme.module.css'

type Props = { target: SWFields; characters: SWFields[]; attempts: string[] }

export default function GuessLogSW({ target, characters, attempts }: Props) {
    const rows = attempts.map((name, i) => {
        const guess = characters.find(c => c.name.toLowerCase() === name.toLowerCase())
        const isCorrect = !!guess && guess.name === target.name

        const traits = guess
            ? getNewSharedTraitsSW(
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

    const yellow = '#ffe81f'

    return (
        <div style={{ marginTop: 8 }}>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    textAlign: 'center',
                    fontWeight: 800,
                    color: yellow,
                    fontSize: 'clamp(0.95rem, 2.8vw, 1.25rem)',
                    marginBottom: 6,
                }}
            >
                <div>Guesses</div>
                <div>Similarities</div>
            </div>

            {rows.map((r, i) => (
                <div
                    key={i}
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 8,
                        alignItems: 'center',
                        padding: '6px 0',
                        borderTop: i === 0 ? '1px solid rgba(255,255,255,.08)' : undefined,
                        borderBottom: '1px solid rgba(255,255,255,.08)',
                    }}
                >
                    <div style={{ textAlign: 'center' }}>
                        <span
                            className={r.isCorrect ? styles.pillSuccess : styles.pill}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                        >
                            <strong style={{ opacity: 0.9 }}>{r.idx}:</strong>
                            <span>{r.name}</span>
                        </span>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        {r.traits.length ? (
                            (r.traits as string[]).map((t, j) => (
                                <span key={j} className={styles.pill} style={{ marginRight: 6, marginBottom: 4 }}>
                                    {t}
                                </span>
                            ))
                        ) : (
                            <span className={styles.pillMuted}>No new shared traits</span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
