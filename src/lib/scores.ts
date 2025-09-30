// src/lib/scores.ts
import type { SupabaseClient } from "@supabase/supabase-js";

/** Resolve a game's numeric id by slug. Returns null if not found. */
export async function getGameId(sb: SupabaseClient, slug: string): Promise<number | null> {
    const { data, error } = await sb.from("games").select("id").eq("slug", slug).maybeSingle();
    if (error) return null;
    return (data?.id as number) ?? null; // games.id is BIGINT
}

/** Personal best for current user, preferring `high_scores`, falling back to `scores`. */
export async function getPersonalBest(sb: SupabaseClient, gameId: number): Promise<number | null> {
    const { data: au } = await sb.auth.getUser();
    const uid = au?.user?.id;
    if (!uid) return null;

    // high_scores (best-per-user)
    {
        const { data, error } = await sb
            .from("high_scores")
            .select("score")
            .eq("game_id", gameId)
            .eq("user_id", uid)
            .maybeSingle();
        if (!error && data?.score != null) return data.score as number;
    }

    // scores fallback (max)
    {
        const { data, error } = await sb
            .from("scores")
            .select("score")
            .eq("game_id", gameId)
            .eq("user_id", uid)
            .order("score", { ascending: false })
            .limit(1);
        if (!error && data && data.length) return data[0].score as number;
    }

    return null;
}

/** Ensure a games row exists for slug and return its id. Creates row if missing. */
export async function ensureGameId(sb: SupabaseClient, slug: string): Promise<number> {
    const existing = await sb.from("games").select("id").eq("slug", slug).maybeSingle();
    if (existing.data?.id) return existing.data.id as number;

    const name = slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    const { data, error } = await sb
        .from("games")
        .insert({ slug, name })
        .select("id")
        .single();
    if (error || !data?.id) throw error ?? new Error("failed to insert game");
    return data.id as number;
}

/** Upsert best score into `high_scores` for current user and slug. Keeps the max. */
export async function upsertHighScoreBySlug(sb: SupabaseClient, slug: string, score: number): Promise<void> {
    const { data: au } = await sb.auth.getUser();
    const uid = au?.user?.id;
    if (!uid) throw new Error("Not signed in");

    const game_id = await ensureGameId(sb, slug);

    // read current
    const cur = await sb
        .from("high_scores")
        .select("score")
        .eq("game_id", game_id)
        .eq("user_id", uid)
        .maybeSingle();

    if (!cur.data) {
        const { error } = await sb.from("high_scores").insert({ game_id, user_id: uid, score });
        if (error) throw error;
        return;
    }

    if ((cur.data.score as number) >= score) return;

    const { error } = await sb
        .from("high_scores")
        .update({ score })
        .eq("game_id", game_id)
        .eq("user_id", uid);
    if (error) throw error;
}

/** Fetch top N rows from `high_scores` for a slug. Used by generic leaderboard page. */
export async function fetchLeaderboardBySlug(
    sb: SupabaseClient,
    slug: string,
    limit = 10
): Promise<Array<{ user_id: string; score: number; updated_at: string }>> {
    const gid = await getGameId(sb, slug);
    if (!gid) return [];
    const { data, error } = await sb
        .from("high_scores")
        .select("user_id,score,updated_at")
        .eq("game_id", gid)
        .order("score", { ascending: false })
        .order("updated_at", { ascending: true })
        .limit(limit);
    if (error) throw error;
    const rows = (data ?? []) as Array<{ user_id: string; score: number; updated_at: string }>;
    return rows;
}
