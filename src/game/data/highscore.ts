// src/game/data/highscore.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureGameId } from "@/lib/scores";

/** Save best score via RPC; if it fails, fall back to a direct upsert. */
export async function upsertHighScore(
    supabase: SupabaseClient,
    slug: string,
    score: number
): Promise<void> {
    // Try RPC first
    const rpc = await supabase.rpc("upsert_high_score", {
        p_game_slug: slug,
        p_score: score,
    });
    if (!rpc.error) return;

    // Fallback path (RLS: insert/update own)
    console.warn("RPC upsert_high_score failed; using fallback upsert", rpc.error?.message);

    const { data: au } = await supabase.auth.getUser();
    const uid = au?.user?.id;
    if (!uid) return;

    const game_id = await ensureGameId(supabase, slug);

    const { data: cur } = await supabase
        .from("high_scores")
        .select("score")
        .eq("game_id", game_id)
        .eq("user_id", uid)
        .maybeSingle();

    if (cur?.score != null && cur.score >= score) return;

    const existing = !!cur;
    if (existing) {
        const { error } = await supabase
            .from("high_scores")
            .update({ score })
            .eq("game_id", game_id)
            .eq("user_id", uid);
        if (error) throw error;
    } else {
        const { error } = await supabase
            .from("high_scores")
            .insert({ game_id, user_id: uid, score });
        if (error) throw error;
    }
}
