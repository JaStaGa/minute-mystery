"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { sb } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Game = { id: string; slug: string; name: string };
type BestMap = Record<string, number>;

export default function Home() {
  const supabase = sb();
  const [games, setGames] = useState<Game[]>([]);
  const [bests, setBests] = useState<BestMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // 1) list games
      const { data: gameRows } = await supabase
        .from("games")
        .select("id,slug,name")
        .order("name");
      setGames(gameRows ?? []);

      // 2) user’s personal bests (by game)
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: hs } = await supabase
          .from("high_scores")
          .select("game_id,score")
          .eq("user_id", user.id);

        const map: BestMap = {};
        (hs ?? []).forEach((r: { game_id: string; score: number }) => {
          map[r.game_id] = Math.max(map[r.game_id] ?? 0, r.score);
        });
        setBests(map);
      }

      setLoading(false);
    })();
  }, [supabase]);

  return (
    <main className="min-h-dvh p-6 text-zinc-100">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="text-center space-y-1">
          <h1 className="text-3xl font-bold">Minute Mystery</h1>
          <p className="text-zinc-400">Pick a theme and set a new personal best.</p>
        </header>

        {loading ? (
          <p className="text-zinc-400">Loading games…</p>
        ) : games.length === 0 ? (
          <p className="text-zinc-400">No games yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {games.map((g) => (
              <Card
                key={g.id}
                className="bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900 transition"
              >
                <CardHeader>
                  <CardTitle className="text-xl">{g.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-zinc-400">
                    Personal best:{" "}
                    <span className="font-medium text-zinc-100">
                      {bests[g.id] ?? "—"}
                    </span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild>
                    <Link href={`/g/${g.slug}`}>Play</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
