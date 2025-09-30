// src/game/components/GuessLogNG.tsx
"use client";

import React from "react";
import type { NGFields } from "@/game/types";
import { getNewSharedTraitsNG } from "@/game/engine/traits";
import ngAdapter from "@/game/themes/new-game/adapter";
import styles from "@/app/g/new-game/ng-theme.module.css";

type Guess = { text: string; ts: number };
type Round = { targetId: string; guesses: Guess[] };

type Props = {
    round: Round;
    characters: NGFields[];
};

/** Parse "fieldX: value" -> { key: "fieldX", value: "value" } */
function parseSharedTag(tag: string) {
    const idx = tag.indexOf(":");
    if (idx === -1) return { key: tag.trim() as keyof NGFields, value: "" };
    return {
        key: tag.slice(0, idx).trim() as keyof NGFields,
        value: tag.slice(idx + 1).trim(),
    };
}

const GuessLogNG: React.FC<Props> = ({ round, characters }) => {
    const { traitKeys, traitLabels } = ngAdapter;

    if (!round?.guesses?.length) return null;

    const last = round.guesses[round.guesses.length - 1];
    const guessRow =
        characters.find((c) => c.name.toLowerCase() === last.text.toLowerCase()) ||
        null;

    const newShared = getNewSharedTraitsNG(round, characters);

    return (
        <div className={styles.guessCard} style={{ padding: 12 }}>
            <div className={styles.panel} style={{ margin: 0 }}>
                <div
                    className={styles.ngTitle}
                    style={{ fontSize: 20, marginBottom: 8 }}
                >
                    {guessRow ? guessRow.name : last.text}
                </div>

                {/* New shared traits for this guess */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {newShared.length === 0 ? (
                        <span className={styles.pillMuted}>No new shared traits</span>
                    ) : (
                        newShared.map((tag) => {
                            const { key, value } = parseSharedTag(tag);
                            const label =
                                traitLabels[key as keyof typeof traitLabels] ?? String(key);
                            return (
                                <span key={tag} className={styles.pillSuccess}>
                                    {label}: {value}
                                </span>
                            );
                        })
                    )}
                </div>

                {/* Trait table for the latest guess */}
                {guessRow && (
                    <div className={styles.tableWrap}>
                        <table
                            style={{
                                width: "100%",
                                borderCollapse: "separate",
                                borderSpacing: "0 6px",
                                fontSize: ".95rem",
                            }}
                        >
                            <tbody>
                                {traitKeys.map((k) => {
                                    const label =
                                        traitLabels[k as keyof typeof traitLabels] ?? k;
                                    const val = (guessRow[k] as string) || "";
                                    return (
                                        <tr key={k}>
                                            <td
                                                style={{
                                                    width: "32%",
                                                    padding: "6px 8px",
                                                    color: "#ddd",
                                                    opacity: 0.9,
                                                }}
                                            >
                                                {label}
                                            </td>
                                            <td
                                                style={{
                                                    padding: "6px 8px",
                                                    color: "#eee",
                                                    border: "1px solid rgba(255,255,255,.08)",
                                                    background: "#0a0a0a",
                                                    borderRadius: 8,
                                                }}
                                            >
                                                {val || <span className={styles.pillMuted}>—</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GuessLogNG;
