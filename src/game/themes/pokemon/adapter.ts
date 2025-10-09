// src/game/themes/pok/adapter.ts
import characters from "@/game/data/pok/characters";
import type { POKFields } from "@/game/types";

// --- Theme identity ---
export const POK_SLUG = "pok";
export const POK_DISPLAY = "Pokémon";

// --- Trait keys and labels (order controls GuessLog grouping/order) ---
export type POKKey =
    | "type"
    | "weakness"
    | "generation"
    | "region"
    | "classification"
    | "color";

export const POK_KEYS: POKKey[] = [
    "type",
    "weakness",
    "generation",
    "region",
    "classification",
    "color",
];

export const POK_LABELS: Record<POKKey, string> = {
    type: "Type",
    weakness: "Weakness",
    generation: "Generation",
    region: "Region",
    classification: "Classification",
    color: "Color",
};

// --- Data access ---
export function getPOKCharacters(): POKFields[] {
    return characters;
}

export function getPOKNames(): string[] {
    return characters.map((c) => c.name);
}

export function getPOKByName(name: string): POKFields | undefined {
    const n = norm(name);
    return characters.find((c) => norm(c.name) === n);
}

// --- Image path helper (adjust if you use kebab vs plain names) ---
export function pokImagePath(name: string): string {
    return `/images/pok/${slugify(name)}.png`;
}

// --- Comparison logic for green / yellow / gray ---
// Exact match => "match" (green)
// Partial overlap for multi-value traits (Type, Weakness) => "close" (yellow)
// Everything else => "miss" (gray)
export type Tone = "match" | "close" | "miss";

export type POKCompare = Record<POKKey, Tone>;

export function comparePOK(guess: POKFields, answer: POKFields): POKCompare {
    return {
        type: compareMulti(guess.type, answer.type),
        weakness: compareMulti(guess.weakness, answer.weakness),
        generation: compareScalar(guess.generation, answer.generation),
        region: compareScalar(guess.region, answer.region),
        classification: compareScalar(guess.classification, answer.classification),
        color: compareScalar(guess.color, answer.color),
    };
}

// --- Pill helpers for GuessLog ---
export function pillValues(key: POKKey, value: string): string[] {
    if (key === "type" || key === "weakness") return splitMulti(value);
    return [value.trim()];
}

// --- Internals ---
function compareScalar(a: string, b: string): Tone {
    return eq(a, b) ? "match" : "miss";
}

function compareMulti(a: string, b: string): Tone {
    const A = new Set(splitMulti(a));
    const B = new Set(splitMulti(b));
    if (setEq(A, B)) return "match";
    if (intersects(A, B)) return "close";
    return "miss";
}

function splitMulti(s: string): string[] {
    // Accept "Fire/Steel" or "Fire, Steel" or "Fire Steel" or numeric tags like "Ground(2)"
    // We normalize by removing parenthetical notes and splitting on "/" or ",".
    const cleaned = s
        .replace(/\(\d+\)/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();

    const parts = cleaned.split(/[\/,]/).map((x) => x.trim()).filter(Boolean);
    // Fallback: if no delimiter but contains spaces like "Dragon Ground"
    if (parts.length <= 1) {
        const spaced = cleaned.split(/\s+/).map((x) => x.trim()).filter(Boolean);
        return spaced.length > 1 ? spaced.map(title) : [title(cleaned)];
    }
    return parts.map(title);
}

function setEq<A>(A: Set<A>, B: Set<A>): boolean {
    if (A.size !== B.size) return false;
    for (const x of A) if (!B.has(x)) return false;
    return true;
}

function intersects<A>(A: Set<A>, B: Set<A>): boolean {
    for (const x of A) if (B.has(x)) return true;
    return false;
}

function eq(a: string, b: string): boolean {
    return norm(a) === norm(b);
}

function norm(s: string): string {
    return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function title(s: string): string {
    if (!s) return s;
    const t = s.toLowerCase();
    return t.charAt(0).toUpperCase() + t.slice(1);
}

function slugify(s: string): string {
    return s
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
}

// --- Theme export shape that your page can import like Naruto's ---
export const POK_ADAPTER = {
    slug: POK_SLUG,
    display: POK_DISPLAY,
    keys: POK_KEYS,
    labels: POK_LABELS,
    all: getPOKCharacters,
    names: getPOKNames,
    byName: getPOKByName,
    imagePath: pokImagePath,
    compare: comparePOK,
    pillValues,
};

export type { POKFields };
