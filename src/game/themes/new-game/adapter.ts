// src/game/themes/new-game/adapter.ts
import type { NGFields } from "@/game/types";
import characters from "@/game/data/ng/characters";

export type NGTraitKey = "field1" | "field2" | "field3" | "field4" | "field5" | "field6";
export const NG_TRAIT_KEYS: readonly NGTraitKey[] = ["field1", "field2", "field3", "field4", "field5", "field6"] as const;

// multi-valued fields
const NG_MULTI_KEYS_SET = new Set<NGTraitKey>(["field2", "field3", "field5"]);
export const NG_MULTI_KEYS = NG_MULTI_KEYS_SET; // keep named export for any direct imports

export const TRAIT_LABELS: Record<NGTraitKey, string> = {
    field1: "Field 1",
    field2: "Field 2",
    field3: "Field 3",
    field4: "Field 4",
    field5: "Field 5",
    field6: "Field 6",
};

const norm = (s: string) => s.toLowerCase().replace(/[_\-./]+/g, " ").replace(/\s+/g, " ").trim();
const splitMulti = (s: string) => s.split(/[;,/]| and |\|/gi).map((t) => t.trim()).filter(Boolean);

type Row = NGFields;
type Key = NGTraitKey;

const getId = (r: Row) => r.name;
const getName = (r: Row) => r.name;
const getImage = (r: Row) => r.image ?? "";
const getValues = (r: Row, k: Key): string[] => {
    const raw = (r[k] as string) || "";
    if (!raw) return [];
    return NG_MULTI_KEYS_SET.has(k) ? splitMulti(raw) : [raw];
};

const normalizeGuess = (s: string) => norm(s);
const isMatch = (guess: string, token: string) => norm(guess) === norm(token);

const adapter = {
    themeId: "new-game",
    themeName: "New Game",
    list: characters,
    traitKeys: NG_TRAIT_KEYS,
    traitLabels: TRAIT_LABELS,
    multiKeys: Array.from(NG_MULTI_KEYS_SET) as NGTraitKey[], // <-- used by GuessLogNG
    getId,
    getName,
    getImage,
    getValues,
    normalizeGuess,
    isMatch,
};

export default adapter;
