"use client";

import type { NarutoFields } from "@/game/types";
import styles from "@/app/g/naruto/naruto-theme.module.css";
import React from "react";

type Props = { target: NarutoFields; characters: NarutoFields[]; attempts: string[] };

const KEYS: Array<keyof NarutoFields> = ["village", "gender", "hair", "debut", "role", "abilities"];
const MULTI = new Set<keyof NarutoFields>(["village", "role", "abilities"]);

const norm = (s: string) => s.trim().toLowerCase();
const splitMulti = (s: unknown) =>
    String(s ?? "")
        .split(/[;,]/g)
        .map((t) => t.trim())
        .filter(Boolean);

type Tone = "green" | "yellow" | "neutral";

function compareForDisplay(target: NarutoFields, guess: NarutoFields) {
    // flat list, one item per guessed value
    const out: Array<{ key: keyof NarutoFields; value: string; tone: Tone }> = [];

    for (const k of KEYS) {
        const tVals = MULTI.has(k) ? splitMulti(target[k]) : [String(target[k] ?? "")];
        const gVals = MULTI.has(k) ? splitMulti(guess[k]) : [String(guess[k] ?? "")];

        if (!MULTI.has(k)) {
            const val = gVals[0] ?? "";
            const tone: Tone = tVals[0] && val && norm(tVals[0]) === norm(val) ? "green" : "neutral";
            if (val) out.push({ key: k, value: val, tone });
            continue;
        }

        const tSet = new Set(tVals.map(norm));
        const gSet = new Set(gVals.map(norm));
        const sameAll = tSet.size === gSet.size && [...tSet].every((v) => gSet.has(v));

        if (sameAll) {
            for (const val of gVals) out.push({ key: k, value: val, tone: "green" });
            continue;
        }

        // partial overlap: overlaps yellow, other guessed values neutral
        const overlaps = new Set(gVals.filter((v) => tSet.has(norm(v))));
        for (const val of gVals) {
            out.push({ key: k, value: val, tone: overlaps.has(val) ? "yellow" : "neutral" });
        }
    }
    return out;
}

function accumulateHints(target: NarutoFields, guesses: NarutoFields[]) {
    const map = new Map<string, { key: keyof NarutoFields; value: string }>();

    for (const g of guesses) {
        for (const k of KEYS) {
            const tVals = MULTI.has(k) ? splitMulti(target[k]) : [String(target[k] ?? "")];
            const gVals = MULTI.has(k) ? splitMulti(g[k]) : [String(g[k] ?? "")];

            if (!MULTI.has(k)) {
                const tv = tVals[0] ?? "";
                const gv = gVals[0] ?? "";
                if (tv && gv && norm(tv) === norm(gv)) {
                    map.set(`${String(k)}:${norm(tv)}`, { key: k, value: tv });
                }
                continue;
            }

            const tSet = new Set(tVals.map(norm));
            for (const val of gVals) {
                if (tSet.has(norm(val))) {
                    map.set(`${String(k)}:${norm(val)}`, { key: k, value: val });
                }
            }
        }
    }
    return Array.from(map.values());
}

// ---- NEW: group values of the same trait into one pill ----
function groupByKey(
    items: Array<{ key: keyof NarutoFields; value: string; tone: Tone }>
) {
    const groups = new Map<
        keyof NarutoFields,
        { values: string[]; tones: Tone[]; seen: Set<string> }
    >();

    for (const it of items) {
        const g = groups.get(it.key) ?? { values: [], tones: [], seen: new Set<string>() };
        const id = norm(it.value);
        if (!g.seen.has(id)) {
            g.values.push(it.value);
            g.tones.push(it.tone);
            g.seen.add(id);
        }
        groups.set(it.key, g);
    }

    // decide pill tone per group
    const decideTone = (tones: Tone[]): Tone => {
        if (tones.every((t) => t === "green")) return "green";
        if (tones.some((t) => t === "yellow")) return "yellow";
        return "neutral";
    };

    return Array.from(groups.entries()).map(([key, { values, tones }]) => ({
        key,
        text: `${String(key)}: ${values.join(", ")}`,
        tone: decideTone(tones),
    }));
}

export default function GuessLogNaruto({ target, characters, attempts }: Props) {
    const resolved = attempts
        .map((name) => characters.find((c) => c.name.toLowerCase() === name.toLowerCase()))
        .filter(Boolean) as NarutoFields[];

    const rows = resolved
        .map((g, i) => {
            const isCorrect = g.name.toLowerCase() === target.name.toLowerCase();
            const similarities = compareForDisplay(target, g);
            const grouped = groupByKey(similarities);
            return { guess: g, index: i + 1, isCorrect, grouped };
        })
        .reverse();

    const hintsSoFar = accumulateHints(target, resolved);

    const pillBase: React.CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        marginRight: 6,
        marginBottom: 6,
    };

    const toneStyle = (tone: Tone): React.CSSProperties =>
        tone === "green"
            ? { backgroundColor: "rgba(46, 204, 113, 0.22)", borderColor: "rgba(46, 204, 113, 0.5)" }
            : tone === "yellow"
                ? { backgroundColor: "rgba(241, 196, 15, 0.22)", borderColor: "rgba(241, 196, 15, 0.5)" }
                : {};

    return (
        <div style={{ marginTop: 8 }}>
            {/* Hints so far */}
            <div
                style={{
                    border: "1px solid rgba(255,255,255,.12)",
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 10,
                    background: "rgba(0,0,0,.35)",
                    backdropFilter: "blur(4px)",
                }}
            >
                <div
                    style={{
                        fontWeight: 800,
                        color: "var(--nrt-accent)",
                        fontSize: "clamp(0.9rem, 2.4vw, 1.05rem)",
                        marginBottom: 8,
                        textAlign: "center",
                    }}
                >
                    Hints so far
                </div>
                <div style={{ textAlign: "center" }}>
                    {hintsSoFar.length ? (
                        hintsSoFar.map((h, i) => (
                            <span key={`hint-${i}`} className={`${styles.pill} ${styles.pillGreen}`} style={pillBase}>
                                {String(h.key)}: {h.value}
                            </span>
                        ))
                    ) : (
                        <span className={styles.pillMuted}>None yet</span>
                    )}
                </div>
            </div>

            {/* Header */}
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
                <div>Traits</div>
            </div>

            {/* Rows */}
            {rows.map((r, i) => (
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
                    <div style={{ textAlign: "center" }}>
                        <span
                            className={r.isCorrect ? styles.pillSuccess : styles.pill}
                            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
                        >
                            <strong style={{ opacity: 0.9 }}>{attempts.length - i}:</strong>
                            <span>{r.guess.name}</span>
                        </span>
                    </div>

                    {/* Grouped trait pills */}
                    <div style={{ textAlign: "center" }}>
                        {r.grouped.length ? (
                            r.grouped.map((g, j) => (
                                <span key={j} className={styles.pill} style={{ ...pillBase, ...toneStyle(g.tone) }}>
                                    {g.text}
                                </span>
                            ))
                        ) : (
                            <span className={styles.pillMuted}>No traits</span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
