"use client";
import type { Character } from "@/game/types";
import styles from "@/app/g/harry-potter/hp-theme.module.css";

function eq(a?: string | null, b?: string | null) {
    return (a ?? "").toLowerCase() === (b ?? "").toLowerCase();
}
function toNum(v: unknown): number | null {
    if (v === null || v === undefined || v === "" || Number.isNaN(Number(v))) return null;
    return Number(v);
}

export default function GuessLogHP({
    target,
    characters,
    attempts,
}: {
    target: Character;
    characters: Character[];
    attempts: string[];
}) {
    return (
        <div className={styles.guessWrap}>
            <table className={styles.guessTable}>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>House</th>
                        <th>Gender</th>
                        <th>Year</th>
                        <th>Hair</th>
                        <th>Ancestry</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {attempts.map((attemptName, idx) => {
                        const g = characters.find(c => c.name?.toLowerCase() === attemptName.toLowerCase());

                        const y = toNum(g?.yearOfBirth);
                        const t = toNum(target.yearOfBirth);
                        const yearMatch = y !== null && t !== null && y === t;
                        const yearCell =
                            y === null || t === null ? "—" : y === t ? String(y) : `${y} ${y > t ? "↓" : "↑"}`;

                        const aliveGuess = g?.alive ?? null;
                        const aliveMatch = aliveGuess !== null && aliveGuess === target.alive;
                        const aliveCell = aliveGuess === null ? "—" : aliveGuess ? "Alive" : "Deceased";

                        const td = (match: boolean, v: string) => (
                            <td className={match ? styles.hintMatch : styles.hintMiss}>{v || "—"}</td>
                        );

                        return (
                            <tr key={`${attemptName}-${idx}`}>
                                {td(Boolean(g?.name) && g!.name.toLowerCase() === target.name.toLowerCase(), g?.name ?? "—")}
                                {td(eq(g?.house, target.house), g?.house ?? "—")}
                                {td(eq(g?.gender, target.gender), g?.gender ?? "—")}
                                {td(yearMatch, yearCell)}
                                {td(eq(g?.hairColour, target.hairColour), g?.hairColour ?? "—")}
                                {td(eq(g?.ancestry, target.ancestry), g?.ancestry ?? "—")}
                                {td(aliveMatch, aliveCell)}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
