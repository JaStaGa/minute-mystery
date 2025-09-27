"use client";

import type { NarutoFields } from "@/game/types";
import styles from "@/app/g/naruto/naruto-theme.module.css";

// simple “new shared traits” computation mirroring SW behavior
function splitMulti(s: string) {
    return (s || "").split(/[;,]/g).map((t) => t.trim()).filter(Boolean);
}
const keys: Array<keyof NarutoFields> = ["village", "gender", "hair", "debut", "role", "abilities"];
const multiKeys = new Set<keyof NarutoFields>(["village", "role", "abilities"]);

function getNewSharedTraitsNaruto(
    target: NarutoFields,
    attempts: string[],
    characters: NarutoFields[],
) {
    const seen = new Set<string>();
    const res: string[] = [];
    for (const name of attempts) {
        const g = characters.find((c) => c.name.toLowerCase() === name.toLowerCase());
        if (!g) continue;
        for (const k of keys) {
            const valsT = multiKeys.has(k) ? splitMulti(target[k] as string) : [String(target[k] ?? "")];
            const valsG = multiKeys.has(k) ? splitMulti(g[k] as string) : [String(g[k] ?? "")];
            const shared = valsG.filter((v) => valsT.map((x) => x.toLowerCase()).includes(v.toLowerCase()));
            for (const v of shared) {
                const label = `${k}: ${v}`;
                if (!seen.has(label)) {
                    seen.add(label);
                    res.push(label);
                }
            }
        }
    }
    return res;
}

type Props = { target: NarutoFields; characters: NarutoFields[]; attempts: string[] };

export default function GuessLogNaruto({ target, characters, attempts }: Props) {
    const rows = attempts.map((name, i) => {
        const guess = characters.find((c) => c.name.toLowerCase() === name.toLowerCase());
        const isCorrect = !!guess && guess.name === target.name;

        const traits = guess
            ? getNewSharedTraitsNaruto(
                target,
                [...attempts.slice(0, i), name],
                characters,
            )
            : [];

        return { name, traits, isCorrect, idx: i + 1 };
    });

    return (
        <div style={{ marginTop: 8 }}>
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

            {rows.map((r, i) => (
                <div
                    key={i}
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
                        <span className={r.isCorrect ? styles.pillSuccess : styles.pill} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                            <strong style={{ opacity: 0.9 }}>{r.idx}:</strong>
                            <span>{r.name}</span>
                        </span>
                    </div>

                    <div style={{ textAlign: "center" }}>
                        {r.traits.length ? (
                            r.traits.map((t, j) => (
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
    );
}
