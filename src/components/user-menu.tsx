"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { sb } from "@/lib/supabase";

type Profile = { id: string; username: string | null; icon_url: string | null };

export default function UserMenu() {
    const supabase = sb();
    const [uid, setUid] = useState<string | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [version, setVersion] = useState(0); // bust image cache when updated

    const fetchProfile = useCallback(
        async (id: string) => {
            const { data } = await supabase
                .from("profiles")
                .select("id,username,icon_url")
                .eq("id", id)
                .maybeSingle();
            setProfile((data as Profile) ?? { id, username: null, icon_url: null });
            setVersion((v) => v + 1);
        },
        [supabase],
    );

    useEffect(() => {
        let active = true;
        (async () => {
            const { data } = await supabase.auth.getUser();
            const id = data.user?.id ?? null;
            if (!active) return;
            setUid(id);
            if (id) fetchProfile(id);
            else setProfile(null);
        })();
        return () => {
            active = false;
        };
    }, [supabase, fetchProfile]);

    // Update when profile page saves
    useEffect(() => {
        function onProfileUpdated() {
            if (uid) fetchProfile(uid);
        }
        window.addEventListener("mm-profile-updated", onProfileUpdated);
        return () => window.removeEventListener("mm-profile-updated", onProfileUpdated);
    }, [uid, fetchProfile]);

    const initial =
        (profile?.username || "").trim().slice(0, 1).toUpperCase() || "?";

    return (
        <div className="flex items-center gap-3">
            <Link href="/profile" aria-label="Open profile" className="inline-block">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-800 border border-zinc-600 grid place-items-center">
                    {profile?.icon_url ? (
                        <Image
                            src={`${profile.icon_url}?v=${version}`}
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
            {profile?.username && (
                <span className="text-sm text-zinc-200 truncate max-w-[10ch]">
                    {profile.username}
                </span>
            )}
        </div>
    );
}
