import type { NarutoFields } from "@/game/types";
import characters from "@/game/data/naruto/characters";

/** Load Naruto dataset. Keep as async to match other themes. */
export async function fetchNaruto(): Promise<NarutoFields[]> {
    // Ensure consistent trimming
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
