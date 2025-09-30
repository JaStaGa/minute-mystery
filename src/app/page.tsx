// src/app/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { sb } from "@/lib/supabase";
import { getGameId, getPersonalBest } from "@/lib/scores";
import { useRef } from "react";

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
    return () => {
      alive = false;
    };
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
  const detRef = useRef<HTMLDetailsElement>(null);

  const closeOnBackgroundClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    // ignore clicks on interactive elements
    if ((e.target as HTMLElement).closest("a,button,input,textarea,select,summary")) return;
    detRef.current?.removeAttribute("open");
  };

  return (
    <main className="min-h-dvh p-6 text-zinc-100">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Hero */}
        <header className="text-center">
          <h1 className="text-4xl font-extrabold">Minute Mystery</h1>
          <p className="mt-2 text-zinc-400">Pick a theme and set a new personal best.</p>
        </header>

        {/* How it works (collapsible) */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40">
          <details ref={detRef} className="group">
            <summary className="flex items-center justify-between cursor-pointer list-none px-5 py-4 text-2xl font-bold select-none">
              <span>What is this place?</span>
              <svg aria-hidden viewBox="0 0 20 20" className="h-5 w-5 text-zinc-400 transition-transform duration-200 group-open:rotate-180">
                <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z" fill="currentColor" />
              </svg>
            </summary>

            <div className="px-5 pb-5 pt-1" onClick={closeOnBackgroundClick}>
              <p className="mt-1">
                Minute Mystery is a fast, friendly character-guessing game. You have one minute to
                solve as many characters as you can from a pool of about 20 per theme. Type a name,
                hit <em>Guess</em>, and use the hints to zero in on the target.
              </p>

              <h3 className="mt-4 text-lg font-semibold">How it works</h3>
              <ul className="mt-2 list-disc space-y-2 pl-6">
                <li>
                  <span className="font-semibold">You get 60 seconds.</span> A secret character is
                  chosen. Keep guessing until you get it or the timer runs out.
                </li>
                <li>
                  After each guess you’ll see <span className="font-semibold">similarity hints</span>.
                  Single-value traits (for example: gender, hair) must match exactly to count. Multi-value
                  traits (for example: affiliations, roles, abilities) count if there is any overlap.
                </li>
                <li>
                  The <span className="font-semibold">Hints so far</span> section keeps every confirmed
                  similarity you’ve found, so you can build knowledge across guesses.
                </li>
                <li>
                  <span className="font-semibold">Five mistakes</span> end your run. When you solve a
                  character, a new one appears immediately and your mistake counter resets.
                </li>
              </ul>

              <h3 className="mt-4 text-lg font-semibold">Scoring</h3>
              <p className="mt-2">
                Points depend on attempts taken to land the correct name in that round:
              </p>
              <ul className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2 pl-6 list-disc">
                <li>Correct on your 1st guess: <span className="font-semibold">5 points</span></li>
                <li>2nd guess: <span className="font-semibold">4 points</span></li>
                <li>3rd guess: <span className="font-semibold">3 points</span></li>
                <li>4th guess: <span className="font-semibold">2 points</span></li>
                <li>5th guess: <span className="font-semibold">1 point</span></li>
              </ul>
              <p className="mt-2">
                Your score is the sum of all solved characters within the 60-second session. Beat your
                Personal Best to climb the leaderboards.
              </p>
            </div>
          </details>
        </section>

        {/* Game grid */}
        <section>
          <h2 className="mb-3 text-2xl font-bold">Pick a theme</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <ThemeCard name="Harry Potter" slug="harry-potter" />
            <ThemeCard name="Star Wars" slug="star-wars" />
            <ThemeCard name="Naruto" slug="naruto" />
            <ThemeCard name="New Game" slug="new-game" />
          </div>
        </section>
      </div>
    </main>
  );
}
