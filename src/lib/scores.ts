import type { SupabaseClient } from "@supabase/supabase-js";

export async function getGameId(client: SupabaseClient, slug: string): Promise<string | null> {
    const { data, error } = await client.from("games").select("id").eq("slug", slug).maybeSingle();
    if (error) console.error("getGameId", error);
    return data?.id ?? null;
}

export async function getPersonalBest(
    supabase: SupabaseClient,
    gameId: string
): Promise<number | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
        .from("high_scores")
        .select("score")
        .eq("game_id", gameId)
        .eq("user_id", user.id)      // <-- filter by current user
        .order("score", { ascending: false })
        .limit(1)
        .maybeSingle();

    return data?.score ?? null;
}

export async function writeScoreAndMaybeBest(
    client: SupabaseClient,
    gameId: string,
    score: number
): Promise<number | null> {
    const { data: u } = await client.auth.getUser();
    const user = u.user;
    if (!user) return null;

    // 1) insert raw score
    const { error: e1 } = await client.from("scores").insert({ user_id: user.id, game_id: gameId, score });
    if (e1) {
        console.error("insert score", e1);
        return null;
    }

    // 2) check/update high score only if improved
    const current = await getPersonalBest(client, gameId);
    const best = current === null ? score : Math.max(current, score);
    if (current === null || score > current) {
        const { error: e2 } = await client
            .from("high_scores")
            .upsert({ user_id: user.id, game_id: gameId, score: best }, { onConflict: "user_id,game_id" });
        if (e2) console.error("upsert high_scores", e2);
    }
    return best;
}
