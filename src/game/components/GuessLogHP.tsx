"use client";
import { Character } from "@/game/types";

function eq(a?: string | null, b?: string | null) {
    return (a ?? "").toLowerCase() === (b ?? "").toLowerCase();
}

function toNum(v: unknown): number | null {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
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
        <div className="overflow-auto">
            <table className="w-full text-sm border-collapse">
                <thead>
                    <tr className="[&>th]:bg-zinc-800 [&>th]:text-white [&>th]:px-3 [&>th]:py-2">
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
                    {attempts.map((name, i) => {
                        const g = characters.find(
                            (c) => c.name.toLowerCase() === name.toLowerCase()
                        );
                        const y = toNum(g?.yearOfBirth);
                        const t = toNum(target.yearOfBirth);
                        const yearMatch = y !== null && t !== null && y === t;
                        const yearText =
                            y === null || t === null
                                ? "—"
                                : y === t
                                    ? String(y)
                                    : `${y} ${y > t ? "↓" : "↑"}`;

                        const aliveGuess = g?.alive;
                        const aliveMatch = aliveGuess !== null && aliveGuess === target.alive;
                        const aliveText =
                            aliveGuess === null ? "—" : aliveGuess ? "Alive" : "Deceased";

                        const cell = (match: boolean, v: string) => (
                            <td
                                className={`px-3 py-2 text-center ${match ? "bg-lime-400 text-black" : "bg-zinc-800 text-white"
                                    }`}
                            >
                                {v || "—"}
                            </td>
                        );

                        return (
                            <tr
                                key={`${name}-${i}`}
                                className="[&>td]:border [&>td]:border-zinc-700"
                            >
                                {cell(eq(g?.name, target.name), g?.name ?? name)}
                                {cell(eq(g?.house, target.house), g?.house ?? "")}
                                {cell(eq(g?.gender, target.gender), g?.gender ?? "")}
                                {cell(yearMatch, yearText)}
                                {cell(eq(g?.hairColour, target.hairColour), g?.hairColour ?? "")}
                                {cell(eq(g?.ancestry, target.ancestry), g?.ancestry ?? "")}
                                {cell(aliveMatch, aliveText)}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
