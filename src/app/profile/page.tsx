// src/app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { sb } from "@/lib/supabase";
import { fetchHP } from "@/game/themes/harry-potter/adapter";
import { fetchSW } from "@/game/themes/star-wars/adapter";
import { fetchNaruto } from "@/game/themes/naruto/adapter";
import RequireUsername from "@/components/require-username";

type ProfileRow = { id: string; username: string | null; icon_url: string | null };
type Opt = { name: string; image: string };

export default function ProfilePage() {
    const supabase = sb();

    const [userId, setUserId] = useState<string | null>(null);
    const [email, setEmail] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const [username, setUsername] = useState("");
    const [iconUrl, setIconUrl] = useState<string | null>(null);

    const [hp, setHp] = useState<Opt[]>([]);
    const [sw, setSw] = useState<Opt[]>([]);
    const [nrt, setNrt] = useState<Opt[]>([]);

    useEffect(() => {
        (async () => {
            const { data } = await supabase.auth.getUser();
            const uid = data.user?.id ?? null;
            setUserId(uid);
            setEmail(data.user?.email ?? "");

            if (!uid) {
                setLoading(false);
                return;
            }

            const { data: prof, error } = await supabase
                .from("profiles")
                .select("id,username,icon_url")
                .eq("id", uid)
                .maybeSingle();

            if (error) setErr(error.message);
            const row = (prof ?? { username: "", icon_url: null }) as ProfileRow;
            setUsername(row.username ?? "");
            setIconUrl(row.icon_url ?? null);

            try {
                const hpAll = await fetchHP();
                setHp(
                    dedupeByImage(
                        hpAll.filter(c => c.image).map(c => ({ name: c.name, image: c.image as string }))
                    )
                );
            } catch { }

            try {
                const swAll = await fetchSW();
                setSw(
                    dedupeByImage(
                        swAll.filter(c => c.image).map(c => ({ name: c.name, image: c.image as string }))
                    )
                );
            } catch { }

            try {
                const nrtAll = await fetchNaruto();
                setNrt(
                    dedupeByImage(
                        nrtAll.filter(c => c.image).map(c => ({ name: c.name, image: c.image as string }))
                    )
                );
            } catch { }

            setLoading(false);
        })();
    }, [supabase]);

    async function save() {
        if (!userId) return;
        setSaving(true);
        setErr(null);

        const want = username.trim() || null;
        if (want) {
            const { data: taken } = await supabase
                .from("profiles")
                .select("id")
                .eq("username", want)
                .neq("id", userId)
                .maybeSingle();
            if (taken) {
                setSaving(false);
                setErr("Username already taken. Please choose another.");
                return;
            }
        }

        const { error } = await supabase
            .from("profiles")
            .upsert({ id: userId, username: want, icon_url: iconUrl ?? null }, { onConflict: "id" });

        setSaving(false);

        if (error) {
            const friendly =
                error.code === "23505" || /profiles_username_key/i.test(error.message || "")
                    ? "Username already taken. Please choose another."
                    : error.message;
            setErr(friendly);
            return;
        }

        window.dispatchEvent(new CustomEvent("mm-profile-updated"));
    }

    async function signOut() {
        try {
            await supabase.auth.signOut();
        } finally {
            window.location.href = "/";
        }
    }

    return (
        <RequireUsername>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-semibold">Profile</h1>
                    <div className="flex gap-2">
                        <Link href="/" className="btn">Back</Link>
                        <button onClick={signOut} className="btn-outline">Sign out</button>
                    </div>
                </div>

                {err && <p className="text-[var(--danger)]">{err}</p>}

                {loading ? (
                    <div className="panel">Loading…</div>
                ) : (
                    <div className="panel space-y-5">
                        {/* Top row */}
                        <div className="flex items-center gap-4">
                            <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface)]">
                                {iconUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={iconUrl}
                                        alt="icon"
                                        width={64}
                                        height={64}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span className="text-lg font-bold">
                                        {username?.slice(0, 2) || "?"}
                                    </span>
                                )}
                            </div>

                            <div className="flex-1">
                                <label className="label" htmlFor="email">Email</label>
                                <input
                                    id="email"
                                    value={email}
                                    readOnly
                                    disabled
                                    className="input cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {/* Username */}
                        <div className="card space-y-2">
                            <label htmlFor="username" className="label">Edit Username</label>
                            <input
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="input"
                                placeholder="Enter a username"
                            />
                        </div>

                        {/* Avatar pickers */}
                        <div className="space-y-3">
                            <Picker
                                title="Harry Potter"
                                options={hp}
                                selected={iconUrl}
                                onSelect={setIconUrl}
                            />
                            <Picker
                                title="Star Wars"
                                options={sw}
                                selected={iconUrl}
                                onSelect={setIconUrl}
                            />
                            <Picker
                                title="Naruto"
                                options={nrt}
                                selected={iconUrl}
                                onSelect={setIconUrl}
                            />
                        </div>

                        {/* Direct URL */}
                        <div className="card space-y-2">
                            <label htmlFor="iconurl" className="label">Or paste image URL</label>
                            <input
                                id="iconurl"
                                value={iconUrl ?? ""}
                                onChange={(e) => setIconUrl(e.target.value || null)}
                                placeholder="https://…"
                                className="input"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button onClick={save} disabled={saving} className="btn-accent">
                                {saving ? "Saving…" : "Save changes"}
                            </button>
                            <button type="button" onClick={() => setIconUrl(null)} className="btn-outline">
                                Remove icon
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </RequireUsername>
    );
}

function Picker({
    title,
    options,
    selected,
    onSelect,
}: {
    title: string;
    options: Opt[];
    selected: string | null;
    onSelect: (s: string) => void;
}) {
    return (
        <details className="accordion group">
            <summary className="flex items-center justify-between">
                <span className="font-medium">{title}</span>
                <svg
                    aria-hidden
                    viewBox="0 0 20 20"
                    className="h-4 w-4 transition-transform duration-200 group-open:rotate-180"
                >
                    <path d="M5 7l5 6 5-6" fill="currentColor" />
                </svg>
            </summary>
            <div className="content">
                <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8">
                    {options.map((o) => {
                        const isSel = selected === o.image;
                        return (
                            <button
                                key={o.image}
                                type="button"
                                onClick={() => onSelect(o.image)}
                                title={o.name}
                                className={`overflow-hidden rounded-lg border bg-[var(--surface)] ${isSel ? "border-[var(--accent)]" : "border-[var(--border)]"
                                    }`}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={o.image} alt={o.name} className="h-16 w-full object-cover" />
                            </button>
                        );
                    })}
                </div>
            </div>
        </details>
    );
}

function dedupeByImage(list: Opt[]): Opt[] {
    const seen = new Set<string>();
    const out: Opt[] = [];
    for (const o of list) {
        if (seen.has(o.image)) continue;
        seen.add(o.image);
        out.push(o);
    }
    return out;
}
