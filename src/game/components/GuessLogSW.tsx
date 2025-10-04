'use client'

import type { SWFields, SWTraitKey } from '@/game/types'
import { SW_TRAIT_KEYS, SW_MULTI_KEYS } from '@/game/types'
import styles from '@/app/g/star-wars/sw-theme.module.css'

type Props = { target: SWFields; characters: SWFields[]; attempts: string[] }

const canon = (s: string) => s.trim().toLowerCase()
const split = (s: string) =>
    s.split(',').map(t => canon(t)).filter(Boolean)

function fieldMatchKind(k: SWTraitKey, guessV: string, targetV: string):
    | 'none'
    | 'partial'
    | 'exact' {
    if (!guessV || !targetV) return 'none'
    if (!SW_MULTI_KEYS.has(k)) {
        return canon(guessV) === canon(targetV) ? 'exact' : 'none'
    }
    const g = split(guessV)
    const t = split(targetV)
    const inter = g.filter(x => t.includes(x))
    if (inter.length === 0) return 'none'
    const exact = inter.length === g.length && g.length === t.length
    return exact ? 'exact' : 'partial'
}

/** Return the exact tokens (by key) that the guess shares with the target. */
function overlappingTokensByKey(
    k: SWTraitKey,
    guessV: string,
    targetV: string
): string[] {
    if (!SW_MULTI_KEYS.has(k)) {
        return canon(guessV) && canon(guessV) === canon(targetV) ? [guessV.trim()] : []
    }
    const g = split(guessV)
    const t = split(targetV)
    return g.filter(x => t.includes(x))
}

export default function GuessLogSW({ target, characters, attempts }: Props) {
    // ---- Build cumulative HINTS (only overlapping values; no leaks) ----
    const hintsTokens = new Set<string>() // e.g. "role:kage"
    const hintsLabelOrder: string[] = []   // stable order for render

    attempts.forEach(name => {
        const g = characters.find(c => canon(c.name) === canon(name))
        if (!g) return

        SW_TRAIT_KEYS.forEach(k => {
            const gv = String(g[k] ?? '')
            const tv = String(target[k] ?? '')
            if (!gv || !tv) return
            overlappingTokensByKey(k, gv, tv).forEach(tokRaw => {
                const tok = tokRaw.trim()
                const id = `${k}:${canon(tok)}`
                if (!hintsTokens.has(id)) {
                    hintsTokens.add(id)
                    hintsLabelOrder.push(`${k}: ${tok}`)
                }
            })
        })
    })

    // ---- Prepare newest row display (group values per key) ----
    const ordered = [...attempts].reverse()
    const newestName = ordered[0]
    const newest = characters.find(c => canon(c.name) === canon(newestName ?? ''))

    return (
        <div style={{ marginTop: 8 }}>
            {/* Hints so far */}
            <div style={{ marginBottom: 8, textAlign: 'center' }}>
                {hintsLabelOrder.length ? (
                    hintsLabelOrder.map((label, i) => (
                        <span
                            key={i}
                            className={styles.pillExact}
                            style={{ marginRight: 6, marginBottom: 4 }}
                        >
                            {label}
                        </span>
                    ))
                ) : (
                    <span className={styles.pillMuted}>No hints yet</span>
                )}
            </div>

            {/* Header */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    textAlign: 'center',
                    fontWeight: 800,
                    color: '#ffe81f',
                    fontSize: 'clamp(0.95rem, 2.8vw, 1.25rem)',
                    marginBottom: 6,
                }}
            >
                <div>Guesses</div>
                <div>Traits</div>
            </div>

            {/* Rows */}
            {ordered.map((name, idx) => {
                const isNewest = idx === 0
                const guess = characters.find(c => canon(c.name) === canon(name))
                const isCorrect = !!guess && guess.name === target.name

                // For newest row, group trait values into a single pill per key.
                let newestPills: React.ReactNode = <span className={styles.pillMuted}>—</span>
                if (isNewest && newest) {
                    newestPills = (
                        <>
                            {SW_TRAIT_KEYS.map(k => {
                                const gv = String(newest[k] ?? '')
                                if (!gv) return null
                                const tv = String(target[k] ?? '')
                                const kind = fieldMatchKind(k, gv, tv)

                                // Build label. If multi, keep original (pretty) tokens order.
                                const valueLabel = gv.trim()
                                const cls =
                                    kind === 'exact'
                                        ? styles.pillExact
                                        : kind === 'partial'
                                            ? styles.pillPartial
                                            : styles.pill

                                return (
                                    <span
                                        key={k}
                                        className={cls}
                                        style={{ marginRight: 6, marginBottom: 4 }}
                                    >
                                        {k}: {valueLabel}
                                    </span>
                                )
                            })}
                        </>
                    )
                }

                return (
                    <div
                        key={`${name}-${idx}`}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 8,
                            alignItems: 'center',
                            padding: '6px 0',
                            borderTop: idx === 0 ? '1px solid rgba(255,255,255,.08)' : undefined,
                            borderBottom: '1px solid rgba(255,255,255,.08)',
                        }}
                    >
                        <div style={{ textAlign: 'center' }}>
                            <span
                                className={isCorrect ? styles.pillExact : styles.pill}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                            >
                                <strong style={{ opacity: 0.9 }}>{ordered.length - idx}:</strong>
                                <span>{name}</span>
                            </span>
                        </div>

                        <div style={{ textAlign: 'center' }}>{newestPills}</div>
                    </div>
                )
            })}
        </div>
    )
}
