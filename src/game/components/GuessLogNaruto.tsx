"use client";

import type { NarutoFields } from "@/game/types";
import styles from "@/app/g/naruto/naruto-theme.module.css";

type Props = { target: NarutoFields; characters: NarutoFields[]; attempts: string[] };

const KEYS: Array<keyof NarutoFields> = ["village", "gender", "hair", "debut", "role", "abilities"];
const MULTI = new Set<keyof NarutoFields>(["village", "role", "abilities"]);

function splitMulti(s: string) {
    return (s || "")
        .split(/[;,]/g)
        .map((t) => t.trim())
        .filter(Boolean);
}

type Hint = { key: keyof NarutoFields; value: string; tone: "green" | "yellow" };

function compareTraits(target: NarutoFields, guess: NarutoFields): Hint[] {
    const out: Hint[] = [];
    for (const k of KEYS) {
        const tVals = MULTI.has(k) ? splitMulti(String(target[k] ?? "")) : [String(target[k] ?? "")];
        const gVals = MULTI.has(k) ? splitMulti(String(guess[k] ?? "")) : [String(guess[k] ?? "")];

        // exact match for single-value fields
        if (!MULTI.has(k)) {
            if (tVals[0] && gVals[0] && tVals[0].toLowerCase() === gVals[0].toLowerCase()) {
                out.push({ key: k, value: tVals[0], tone: "green" });
            }
            continue;
        }

        // partial overlap for multi-value fields
        const tSet = new Set(tVals.map((v) => v.toLowerCase()));
        const overlaps = gVals.filter((v) => tSet.has(v.toLowerCase()));
        for (const v of overlaps) out.push({ key: k, value: v, tone: "yellow" });
    }
    return out;
}

function uniqueHints(hints: Hint[]): Hint[] {
    const seen = new Set<string>();
    const res: Hint[] = [];
    for (const h of hints) {
        const id = `${h.key}:${h.value.toLowerCase()}:${h.tone}`;
        if (!seen.has(id)) {
            seen.add(id);
            res.push(h);
        }
    }
    return res;
}

export default function GuessLogNaruto({ target, characters, attempts }: Props) {
    const resolved = attempts
        .map((name) => characters.find((c) => c.name.toLowerCase() === name.toLowerCase()))
        .filter(Boolean) as NarutoFields[];

    // newest on top for display
    const rows = resolved.map((g, i) => {
        const isCorrect = g.name === target.name;
        const hints = compareTraits(target, g);
        return { guess: g, index: i + 1, isCorrect, hints };
    });
    const display = rows.slice().reverse(); // newest first

    // persistent “hints so far” = union over all attempts
    const hintsSoFar = uniqueHints(rows.flatMap((r) => r.hints));

    const pillStyle = {
        base: {
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginRight: 6,
            marginBottom: 4,
        } as React.CSSProperties,
        green: {
            backgroundColor: "rgba(46, 204, 113, 0.18)",
            border: "1px solid rgba(46, 204, 113, 0.45)",
        } as React.CSSProperties,
        yellow: {
            backgroundColor: "rgba(241, 196, 15, 0.18)",
            border: "1px solid rgba(241, 196, 15, 0.45)",
        } as React.CSSProperties,
    };

    return (
        <div style={{ marginTop: 8 }}>
            {/* Hints so far */}
            <div
                style={{
                    border: "1px solid rgba(255,255,255,.12)",
                    borderRadius: 10,
                    padding: 10,
                    marginBottom: 10,
                    background: "rgba(255,255,255,.03)",
                }}
            >
                <div
                    style={{
                        fontWeight: 800,
                        color: "var(--nrt-accent)",
                        fontSize: "clamp(0.9rem, 2.4vw, 1.05rem)",
                        marginBottom: 6,
                        textAlign: "center",
                    }}
                >
                    Hints so far
                </div>
                <div style={{ textAlign: "center" }}>
                    {hintsSoFar.length ? (
                        hintsSoFar.map((h, i) => (
                            <span
                                key={`sofar-${i}`}
                                className={styles.pill}
                                style={{
                                    ...pillStyle.base,
                                    ...(h.tone === "green" ? pillStyle.green : pillStyle.yellow),
                                }}
                            >
                                {String(h.key)}: {h.value}
                            </span>
                        ))
                    ) : (
                        <span className={styles.pillMuted}>None yet</span>
                    )}
                </div>
            </div>

            {/* Grid header */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    textAlign: "center",
                    fontWeight: 800,
                    color: "var(--nrt-accent)",
                    fontSize: "clamp(0.95rem, 2.8vw, 1.25rem)",
                    marginBottom: 6,
                }}
            >
                <div>Guesses</div>
                <div>Similarities</div>
            </div>

            {/* Rows */}
            {display.map((r, i) => {
                const isNewest = i === 0;
                const visibleHints = isNewest ? r.hints : [];
                const summaryCount = r.hints.length;

                return (
                    <div
                        key={r.guess.name + i}
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 8,
                            alignItems: "center",
                            padding: "6px 0",
                            borderTop: i === 0 ? "1px solid rgba(255,255,255,.08)" : undefined,
                            borderBottom: "1px solid rgba(255,255,255,.08)",
                        }}
                    >
                        {/* Guess pill */}
                        <div style={{ textAlign: "center" }}>
                            <span
                                className={r.isCorrect ? styles.pillSuccess : styles.pill}
                                style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
                            >
                                <strong style={{ opacity: 0.9 }}>{attempts.length - i}:</strong>
                                <span>{r.guess.name}</span>
                            </span>
                        </div>

                        {/* Similarities column */}
                        <div style={{ textAlign: "center" }}>
                            {isNewest ? (
                                visibleHints.length ? (
                                    visibleHints.map((h, j) => (
                                        <span
                                            key={j}
                                            className={styles.pill}
                                            style={{
                                                ...pillStyle.base,
                                                ...(h.tone === "green" ? pillStyle.green : pillStyle.yellow),
                                            }}
                                        >
                                            {String(h.key)}: {h.value}
                                        </span>
                                    ))
                                ) : (
                                    <span className={styles.pillMuted}>No similarities</span>
                                )
                            ) : (
                                <span className={styles.pillMuted}>
                                    {summaryCount ? `${summaryCount} hint${summaryCount === 1 ? "" : "s"}` : "No similarities"}
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
