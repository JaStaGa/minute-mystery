"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
// eslint-disable-next-line @next/next/no-img-element
import Image from "next/image";
import { sb } from "@/lib/supabase";

type Profile = { id: string; username: string | null; icon_url: string | null };

export default function UserMenu() {
    const supabase = sb();
    const [uid, setUid] = useState<string | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);

    useEffect(() => {
        let active = true;

        async function load() {
            const { data } = await supabase.auth.getUser();
            const id = data.user?.id ?? null;
            if (!active) return;
            setUid(id);
            if (!id) {
                setProfile(null);
                return;
            }
            await fetchProfile(id);
        }

        async function fetchProfile(id: string) {
            const { data } = await supabase
                .from("profiles")
                .select("id,username,icon_url")
                .eq("id", id)
                .maybeSingle();
            if (!active) return;
            setProfile((data as Profile) ?? { id, username: null, icon_url: null });
        }

        // initial load
        load();

        // reload when tab becomes visible
        function onVis() {
            if (document.visibilityState === "visible" && uid) fetchProfile(uid);
        }
        document.addEventListener("visibilitychange", onVis);

        // realtime updates from this row
        const channel = supabase
            .channel("profiles-user-menu")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "profiles", filter: uid ? `id=eq.${uid}` : undefined },
                (payload) => {
                    const row = payload.new as Profile;
                    if (row?.id) setProfile(row);
                },
            )
            .subscribe();

        return () => {
            active = false;
            document.removeEventListener("visibilitychange", onVis);
            supabase.removeChannel(channel);
        };
    }, [supabase, uid]);

    const initial = (profile?.username || "")
        .trim()
        .slice(0, 1)
        .toUpperCase() || "?";

    return (
        <div className="flex items-center gap-3">
            {/* avatar links to profile */}
            <Link href="/profile" aria-label="Open profile" className="inline-block">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-800 border border-zinc-600 grid place-items-center">
                    {profile?.icon_url ? (
                        // next/image avoids cache if src changes; profile updates re-render src
                        <Image
                            src={profile.icon_url}
                            alt="avatar"
                            width={36}
                            height={36}
                            className="w-full h-full object-cover"
                            unoptimized
                        />
                    ) : (
                        <span className="text-sm font-semibold text-zinc-100">{initial}</span>
                    )}
                </div>
            </Link>

            {/* username (optional) */}
            {profile?.username && (
                <span className="text-sm text-zinc-200 truncate max-w-[10ch]">{profile.username}</span>
            )}

            {/* sign out button stays as you had it, or add here if needed */}
        </div>
    );
}
