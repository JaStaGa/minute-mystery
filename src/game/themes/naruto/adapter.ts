// src/game/themes/naruto/adapter.ts
import type { NarutoFields } from "@/game/types";
import characters from "@/game/data/naruto/characters";

/** Load Naruto dataset. Keep as async to match other themes. */
export async function fetchNaruto(): Promise<NarutoFields[]> {
    return characters.map((c) => ({
        ...c,
        village: c.village.trim(),
        role: (c.role || "").trim(),
        abilities: (c.abilities || "").trim(),
        hair: c.hair.trim(),
        debut: c.debut.trim(),
        gender: c.gender.trim(),
    }));
}

/* ---- Added, to mirror HP/SW/NG adapter surface ---- */
export type NarutoTraitKey = "village" | "gender" | "hair" | "debut" | "role" | "abilities";
export const NARUTO_TRAIT_KEYS: readonly NarutoTraitKey[] = [
    "village",
    "gender",
    "hair",
    "debut",
    "role",
    "abilities",
] as const;

export const NARUTO_MULTI_KEYS = new Set<NarutoTraitKey>(["village", "role", "abilities"]);

export const NARUTO_TRAIT_LABELS: Record<NarutoTraitKey, string> = {
    village: "Village",
    gender: "Gender",
    hair: "Hair",
    debut: "Debut",
    role: "Role",
    abilities: "Abilities",
};

/** Optional adapter object, for symmetry with other themes */
const narutoAdapter = {
    themeId: "naruto",
    themeName: "Naruto",
    list: characters,
    traitKeys: NARUTO_TRAIT_KEYS,
    traitLabels: NARUTO_TRAIT_LABELS,
    multiKeys: NARUTO_MULTI_KEYS,
};

export default narutoAdapter;
