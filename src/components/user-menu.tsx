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
    const [version, setVersion] = useState(0); // bust avatar cache after changes

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

    // Initial load
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

    // React to auth changes (sign in/out)
    useEffect(() => {
        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
            const id = session?.user?.id ?? null;
            if (!id) {
                setUid(null);
                setProfile(null);
                setVersion((v) => v + 1);
                return;
            }
            setUid(id);
            fetchProfile(id);
        });
        return () => {
            sub.subscription.unsubscribe();
        };
    }, [supabase, fetchProfile]);

    // React to profile saves from the Profile page
    useEffect(() => {
        function onProfileUpdated() {
            if (uid) fetchProfile(uid);
        }
        window.addEventListener("mm-profile-updated", onProfileUpdated);
        return () => window.removeEventListener("mm-profile-updated", onProfileUpdated);
    }, [uid, fetchProfile]);

    const isAuthed = !!uid;
    const initial =
        (profile?.username || "").trim().slice(0, 1).toUpperCase() || "?" as const;

    const onSignOut = async () => {
        try {
            await supabase.auth.signOut();
        } finally {
            window.location.href = "/";
        }
    };

    return (
        <div className="flex items-center gap-3">
            <Link href={isAuthed ? "/profile" : "/profile"} aria-label={isAuthed ? "Open profile" : "Log in"} className="inline-block">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-800 border border-zinc-600 grid place-items-center">
                    {isAuthed && profile?.icon_url ? (
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

            {isAuthed && profile?.username && (
                <span className="text-sm text-zinc-200 truncate max-w-[10ch]">{profile.username}</span>
            )}

            {isAuthed ? (
                <button onClick={onSignOut} className="text-sm opacity-80 hover:opacity-100">Sign out</button>
            ) : (
                <Link href="/profile" className="text-sm opacity-80 hover:opacity-100">Log in</Link>
            )}
        </div>
    );
}
