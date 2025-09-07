// src/game/data/highscore.ts
import { SupabaseClient } from "@supabase/supabase-js";

export async function upsertHighScore(
    supabase: SupabaseClient,
    slug: string,
    score: number
) {
    const { error } = await supabase.rpc("upsert_high_score", {
        p_game_slug: slug,
        p_score: score,
    });
    if (error) console.error("upsert_high_score failed", error);
}
