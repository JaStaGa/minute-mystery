// src/game/components/GuessLogPOK.tsx
"use client";

import React from "react";
import type { POKFields } from "@/game/types";
import { POK_ADAPTER } from "@/game/themes/pokemon/adapter";
import styles from "@/app/g/pokemon/pok-theme.module.css";

type Guess = { text: string; ts: number };
type Round = { targetId: string; guesses: Guess[] };

type Props = { round: Round; characters: POKFields[] };

type Tone = "green" | "yellow" | "neutral";
type Item = { key: keyof POKFields; value: string; tone: Tone };

const KEYS = POK_ADAPTER.keys as ReadonlyArray<keyof POKFields>;
const LABELS = POK_ADAPTER.labels as Record<keyof POKFields, string>;
const MULTI = new Set<keyof POKFields>(["type", "weakness"]);

const norm = (s: string) => s.trim().toLowerCase();
const splitMulti = (s: unknown) =>
    String(s ?? "")
        .split(/[;,/]/g)
        .map((t) => t.replace(/\(\d+\)/g, "").trim())
        .filter(Boolean);

function compareForDisplay(target: POKFields, guess: POKFields): Item[] {
    const out: Item[] = [];
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

        const overlaps = new Set(gVals.filter((v) => tSet.has(norm(v))));
        for (const val of gVals) {
            out.push({ key: k, value: val, tone: overlaps.has(val) ? "yellow" : "neutral" });
        }
    }
    return out;
}

function accumulateHints(target: POKFields, guesses: POKFields[]) {
    const map = new Map<string, { key: keyof POKFields; value: string }>();
    for (const g of guesses) {
        for (const k of KEYS) {
            const tVals = MULTI.has(k) ? splitMulti(target[k]) : [String(target[k] ?? "")];
            const gVals = MULTI.has(k) ? splitMulti(g[k]) : [String(g[k] ?? "")];

            if (!MULTI.has(k)) {
                const tv = tVals[0] ?? "";
                const gv = gVals[0] ?? "";
                if (tv && gv && norm(tv) === norm(gv)) map.set(`${String(k)}:${norm(tv)}`, { key: k, value: tv });
                continue;
            }

            const tSet = new Set(tVals.map(norm));
            for (const val of gVals) {
                if (tSet.has(norm(val))) map.set(`${String(k)}:${norm(val)}`, { key: k, value: val });
            }
        }
    }
    return Array.from(map.values());
}

function groupByKey(items: Item[]) {
    const groups = new Map<keyof POKFields, { values: string[]; tones: Tone[]; seen: Set<string> }>();
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
    const decide = (tones: Tone[]): Tone => (tones.every((t) => t === "green") ? "green" : tones.some((t) => t === "yellow") ? "yellow" : "neutral");
    return Array.from(groups.entries()).map(([key, { values, tones }]) => ({
        key,
        text: `${LABELS[key] ?? String(key)}: ${values.join(", ")}`,
        tone: decide(tones),
    }));
}

export default function GuessLogPOK({ round, characters }: Props) {
    if (!round?.guesses?.length) return null;

    const target = characters.find((c) => c.name.toLowerCase() === round.targetId.toLowerCase()) ?? null;
    if (!target) return null;

    const resolved: POKFields[] = round.guesses
        .map((g) => characters.find((c) => c.name.toLowerCase() === g.text.toLowerCase()) || null)
        .filter((x): x is POKFields => Boolean(x));

    const rows = resolved
        .map((g, i) => {
            const isCorrect = g.name.toLowerCase() === target.name.toLowerCase();
            const grouped = groupByKey(compareForDisplay(target, g));
            return { guess: g, index: i + 1, isCorrect, grouped };
        })
        .reverse();

    const hintsSoFar = accumulateHints(target, resolved);

    const pillBase: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, marginRight: 6, marginBottom: 6 };
    const toneStyle = (tone: Tone): React.CSSProperties =>
        tone === "green" ? { backgroundColor: "rgba(46,204,113,.22)", borderColor: "rgba(46,204,113,.5)" }
            : tone === "yellow" ? { backgroundColor: "rgba(241,196,15,.22)", borderColor: "rgba(241,196,15,.5)" }
                : {};

    return (
        <div style={{ marginTop: 8 }}>
            <div className={styles.glassBox}>
                <div className={styles.glassRowHeader}>Hints so far</div>
                <div style={{ textAlign: "center" }}>
                    {hintsSoFar.length ? (
                        hintsSoFar.map((h, i) => (
                            <span key={`hint-${i}`} className={styles.pill} style={{ ...pillBase, backgroundColor: "rgba(46,204,113,.18)", border: "1px solid rgba(46,204,113,.45)" }}>
                                {LABELS[h.key] ?? String(h.key)}: {h.value}
                            </span>
                        ))
                    ) : (
                        <span className={styles.pillMuted}>None yet</span>
                    )}
                </div>
            </div>

            <div className={styles.glassRowHeader}>Guesses • Traits</div>

            {rows.map((r, i) => (
                <div key={r.guess.name + i} className={styles.glassRow}>
                    <div style={{ textAlign: "center" }}>
                        <span className={r.isCorrect ? styles.pillSuccess : styles.pill} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                            <strong style={{ opacity: 0.9 }}>{rows.length - i}:</strong>
                            <span>{r.guess.name}</span>
                        </span>
                    </div>
                    <div className={styles.pillRow}>
                        {r.grouped.length ? (
                            r.grouped.map((g, j) => (
                                <span key={j} className={`${styles.pill} ${styles.pillWrap}`} style={{ ...pillBase, ...toneStyle(g.tone) }}>
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
