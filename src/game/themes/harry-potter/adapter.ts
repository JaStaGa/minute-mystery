import type { Character } from "@/game/types";

const HP_API = "https://hp-api.onrender.com/api/characters";
const HOUSES = new Set(["Gryffindor", "Slytherin", "Hufflepuff", "Ravenclaw"]);

type HPApiRow = {
    name?: string | null;
    actor?: string | null;
    house?: string | null;
    gender?: string | null;
    yearOfBirth?: number | string | null;
    hairColour?: string | null;
    ancestry?: string | null;
    alive?: boolean | null;
    image?: string | null;
};

const toYear = (v: unknown): number | null => {
    if (v === null || v === undefined) return null;
    if (typeof v === "number") return Number.isFinite(v) && v > 0 ? v : null;
    if (typeof v === "string") {
        const s = v.trim();
        if (s === "" || s === "0") return null;
        const n = Number(s);
        return Number.isFinite(n) && n > 0 ? n : null;
    }
    return null;
};

const fallback: ReadonlyArray<HPApiRow> = [
    { name: "Harry Potter", actor: "Daniel Radcliffe", house: "Gryffindor", gender: "male", yearOfBirth: 1980, hairColour: "black", ancestry: "half-blood", alive: true, image: "https://hp-api.onrender.com/images/harry.jpg" },
    { name: "Hermione Granger", actor: "Emma Watson", house: "Gryffindor", gender: "female", yearOfBirth: 1979, hairColour: "brown", ancestry: "muggleborn", alive: true, image: "https://hp-api.onrender.com/images/hermione.jpeg" },
    { name: "Ron Weasley", actor: "Rupert Grint", house: "Gryffindor", gender: "male", yearOfBirth: 1980, hairColour: "red", ancestry: "pure-blood", alive: true, image: "https://hp-api.onrender.com/images/ron.jpg" },
    { name: "Draco Malfoy", actor: "Tom Felton", house: "Slytherin", gender: "male", yearOfBirth: 1980, hairColour: "blonde", ancestry: "pure-blood", alive: true, image: "https://hp-api.onrender.com/images/draco.jpg" },
    { name: "Severus Snape", actor: "Alan Rickman", house: "Slytherin", gender: "male", yearOfBirth: 1960, hairColour: "black", ancestry: "half-blood", alive: false, image: "https://hp-api.onrender.com/images/snape.jpg" },
];

function normalize(r: HPApiRow): Character {
    return {
        id: `${(r.name ?? "").toLowerCase()}-${(r.actor ?? "").toLowerCase()}`.replace(/\s+/g, "_"),
        name: r.name ?? "",
        image: r.image ?? "",
        house: r.house ?? "",
        gender: r.gender ?? "",
        yearOfBirth: toYear(r.yearOfBirth),
        hairColour: r.hairColour ?? "",
        ancestry: r.ancestry ?? "",
        alive: typeof r.alive === "boolean" ? r.alive : null,
    };
}

const keep = (c: Character) =>
    !!c.name &&
    HOUSES.has(c.house ?? "") &&
    !!c.gender &&
    !!c.hairColour &&
    !!c.ancestry &&
    !!c.image &&
    c.alive !== null &&
    c.yearOfBirth !== null;

export async function fetchHP(): Promise<Character[]> {
    const dedupeSort = (arr: Character[]) => {
        const seen = new Set<string>();
        return arr
            .filter((c) => {
                const k = c.name.toLowerCase();
                if (seen.has(k)) return false;
                seen.add(k);
                return true;
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    };

    try {
        const raw = (await (await fetch(HP_API, { cache: "no-store" })).json()) as unknown;
        const rows: HPApiRow[] = Array.isArray(raw) ? (raw as HPApiRow[]) : [];
        return dedupeSort(rows.map(normalize).filter(keep));
    } catch {
        return dedupeSort(fallback.map(normalize).filter(keep));
    }
}
