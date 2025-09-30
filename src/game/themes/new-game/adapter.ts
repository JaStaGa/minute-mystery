// src/game/themes/new-game/adapter.ts
import type { NGFields } from "@/game/types";
import characters from "@/game/data/ng/characters";

// Local trait typing for NG
export type NGTraitKey = "field1" | "field2" | "field3" | "field4" | "field5" | "field6";
export const NG_TRAIT_KEYS: readonly NGTraitKey[] = [
    "field1",
    "field2",
    "field3",
    "field4",
    "field5",
    "field6",
] as const;

// Treat some fields as multi-valued
export const NG_MULTI_KEYS = new Set<NGTraitKey>(["field2", "field3", "field5"]);

export const TRAIT_LABELS: Record<NGTraitKey, string> = {
    field1: "Field 1",
    field2: "Field 2",
    field3: "Field 3",
    field4: "Field 4",
    field5: "Field 5",
    field6: "Field 6",
};

// Basic normalizer + splitter
const norm = (s: string) =>
    s.toLowerCase().replace(/[_\-./]+/g, " ").replace(/\s+/g, " ").trim();

const splitMulti = (s: string) =>
    s
        .split(/[;,/]| and |\|/gi)
        .map((t) => t.trim())
        .filter(Boolean);

// Adapter shape consumed by engine/components
type Row = NGFields;
type Key = NGTraitKey;

const getId = (r: Row) => r.name; // using name as id
const getName = (r: Row) => r.name;
const getImage = (r: Row) => r.image ?? "";

const getValues = (r: Row, k: Key): string[] => {
    const raw = (r[k] as string) || "";
    if (!raw) return [];
    return NG_MULTI_KEYS.has(k) ? splitMulti(raw) : [raw];
};

const normalizeGuess = (s: string) => norm(s);
const isMatch = (guess: string, token: string) => norm(guess) === norm(token);

const adapter = {
    themeId: "new-game",
    themeName: "New Game",
    list: characters,
    traitKeys: NG_TRAIT_KEYS,
    traitLabels: TRAIT_LABELS,
    getId,
    getName,
    getImage,
    getValues,
    normalizeGuess,
    isMatch,
};

export default adapter;


