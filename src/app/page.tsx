// src/app/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { sb } from "@/lib/supabase";
import { getGameId, getPersonalBest } from "@/lib/scores";

type CardProps = { name: string; slug: string };

function ThemeCard({ name, slug }: CardProps) {
  const supabase = sb();
  const [best, setBest] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const id = await getGameId(supabase, slug);
      if (!alive || !id) return;
      const pb = await getPersonalBest(supabase, id);
      if (alive) setBest(pb);
    })();
    return () => { alive = false; };
  }, [slug, supabase]);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-white">{name}</h2>
      <p className="mt-3 text-sm text-zinc-400">Personal best: {best ?? "—"}</p>
      <div className="mt-4">
        <Link
          href={`/g/${slug}`}
          className="inline-flex items-center rounded-lg bg-white px-3 py-2 text-black"
        >
          Play
        </Link>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-dvh p-6 text-zinc-100">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold">Minute Mystery</h1>
          <p className="mt-2 text-zinc-400">Pick a theme and set a new personal best.</p>
        </header>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <ThemeCard name="Harry Potter" slug="harry-potter" />
          <ThemeCard name="Star Wars" slug="star-wars" />
          <ThemeCard name="Naruto" slug="naruto" />
        </div>
      </div>
    </main>
  );
}
