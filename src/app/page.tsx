"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { sb } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Game = { slug: string; name: string };

export default function Home() {
  const supabase = sb();
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    supabase.from("games").select("slug,name").order("id").then(({ data }) => setGames(data ?? []));
  }, [supabase]);

  return (
    <main className="min-h-dvh bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Minute Mystery</h1>

        <div className="grid sm:grid-cols-2 gap-4">
          {games.map((g) => (
            <Card key={g.slug} className="bg-zinc-900/60">
              <CardHeader>
                <CardTitle>{g.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button asChild><Link href={`/g/${g.slug}`}>Play</Link></Button>
                <Button variant="outline" asChild>
                  <Link href={`/g/${g.slug}/leaderboard`}>Leaderboard</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" asChild><Link href="/auth">Auth</Link></Button>
          <Button variant="outline" asChild><Link href="/profile">Profile</Link></Button>
          <Button variant="outline" asChild><Link href="/debug/db">DB/RLS</Link></Button>
          <Button variant="outline" asChild><Link href="/g/dev">Dev game</Link></Button>
        </div>
      </div>
    </main>
  );
}
