// src/game/components/GuessLogHP.tsx
'use client'

import styles from '@/app/g/harry-potter/hp-theme.module.css'
import type { CSSProperties } from 'react'

type HPFields = {
    name: string
    image?: string | null
} & Record<string, string | undefined | null>

type Props = { target: HPFields; characters: HPFields[]; attempts: string[] }

const norm = (s: string) => s.toLowerCase().trim()

function kvPairs(row: HPFields): Array<[string, string]> {
    return Object.entries(row)
        .filter(([k, v]) => k !== 'name' && k !== 'image' && typeof v === 'string' && v.trim().length > 0)
        .map(([k, v]) => [k, String(v)] as [string, string])
}

export default function GuessLogHP({ target, characters, attempts }: Props) {
    const latestIdx = attempts.length - 1

    // PERSISTENT HINTS: accumulate exact matches from *all* guesses this round
    const hintsMap = new Map<string, string>()
    attempts.forEach((name) => {
        const g = characters.find((c) => c.name.toLowerCase() === name.toLowerCase())
        if (!g) return
        kvPairs(g).forEach(([k, v]) => {
            const tv = (target as HPFields)[k]
            if (typeof tv === 'string' && norm(v) === norm(tv)) {
                hintsMap.set(k, String(tv)) // one per key (target is single-valued)
            }
        })
    })
    const hints = Array.from(hintsMap.entries())

    // Rows: only the latest guess shows its attributes (others collapse),
    // newest guess at the top.
    const rows = attempts.map((name, i) => {
        const guess = characters.find((c) => c.name.toLowerCase() === name.toLowerCase())
        const isCorrect = !!guess && guess.name === target.name

        const attrs: Array<{ key: string; value: string; exact: boolean }> = []
        if (guess && i === latestIdx) {
            kvPairs(guess).forEach(([k, v]) => {
                const tv = (target as HPFields)[k]
                const exact = typeof tv === 'string' && norm(v) === norm(tv)
                attrs.push({ key: k, value: v, exact })
            })
        }

        return { name, attrs, idx: i + 1, isCorrect }
    })
    const display = [...rows].reverse()

    const headerStyle: CSSProperties = {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        textAlign: 'center',
        fontWeight: 700,
        color: '#4b2e2e',
        marginBottom: 6,
    }

    return (
        <div style={{ marginTop: 8 }}>
            {/* Hints persist until the round ends or the target is guessed */}
            {hints.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 8 }}>
                    {hints.map(([k, v]) => (
                        <span key={k} className={styles.pillSuccess}>
                            {k}: {v}
                        </span>
                    ))}
                </div>
            )}

            <div style={headerStyle}>
                <div>Guesses</div>
                <div>Attributes</div>
            </div>

            {display.map((r, i) => (
                <div
                    key={`${r.name}-${r.idx}`}
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 8,
                        alignItems: 'center',
                        padding: '6px 0',
                        borderTop: i === 0 ? '1px solid rgba(0,0,0,.1)' : undefined,
                        borderBottom: '1px solid rgba(0,0,0,.1)',
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

                    <div style={{ textAlign: 'center', minHeight: 28 }}>
                        {r.attrs.length ? (
                            r.attrs.map((t) => (
                                <span
                                    key={t.key}
                                    className={t.exact ? styles.pillSuccess : styles.pill}
                                    style={{ marginRight: 6, marginBottom: 4 }}
                                >
                                    {t.key}: {t.value}
                                </span>
                            ))
                        ) : (
                            <span className={styles.pillMuted}>—</span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
