"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sb } from "@/lib/supabase";
import { fetchHP } from "@/game/themes/harry-potter/adapter";
import { fetchSW } from "@/game/themes/star-wars/adapter";

type ProfileRow = { id: string; username: string | null; icon_url: string | null };

export default function ProfilePage() {
    const supabase = sb();
    const router = useRouter();

    const [userId, setUserId] = useState<string | null>(null);
    const [email, setEmail] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const [username, setUsername] = useState("");
    const [iconUrl, setIconUrl] = useState<string | null>(null);

    const [hp, setHp] = useState<{ name: string; image?: string | null }[]>([]);
    const [sw, setSw] = useState<{ name: string; image?: string | null }[]>([]);

    useEffect(() => {
        (async () => {
            const { data } = await supabase.auth.getUser();
            const uid = data.user?.id ?? null;
            setUserId(uid);
            setEmail(data.user?.email ?? "");

            if (!uid) {
                setErr("Not signed in.");
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
                setHp(hpAll.map((c) => ({ name: c.name, image: c.image })));
            } catch { }

            try {
                const swAll = await fetchSW();
                setSw(swAll.map((c) => ({ name: c.name, image: c.image })));
            } catch { }

            setLoading(false);
        })();
    }, [supabase]);

    const hpOptions = useMemo(() => {
        const list = hp.filter((c) => c.image).map((c) => ({ name: c.name, image: c.image as string }));
        const seen = new Set<string>();
        return list.filter((o) => (seen.has(o.image) ? false : (seen.add(o.image), true)));
    }, [hp]);

    const swOptions = useMemo(() => {
        const list = sw.filter((c) => c.image).map((c) => ({ name: c.name, image: c.image as string }));
        const seen = new Set<string>();
        return list.filter((o) => (seen.has(o.image) ? false : (seen.add(o.image), true)));
    }, [sw]);

    async function save() {
        if (!userId) return;
        setSaving(true);
        setErr(null);
        const { error } = await supabase.from("profiles").upsert(
            { id: userId, username: username.trim() || null, icon_url: iconUrl ?? null },
            { onConflict: "id" },
        );
        setSaving(false);
        if (error) {
            setErr(error.message);
            return;
        }
        // notify header to refresh avatar immediately
        window.dispatchEvent(new CustomEvent("mm-profile-updated"));
    }

    async function signOut() {
        await supabase.auth.signOut();
        router.push("/auth");
    }

    if (loading) {
        return (
            <main className="min-h-dvh p-6 text-zinc-100">
                <div className="max-w-3xl mx-auto">Loading…</div>
            </main>
        );
    }

    if (err) {
        return (
            <main className="min-h-dvh p-6 text-zinc-100">
                <div className="max-w-3xl mx-auto space-y-3">
                    <p className="text-red-300">{err}</p>
                    <Link href="/" className="underline">Go home</Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-dvh p-6 text-zinc-100">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-semibold">Profile</h1>
                    <div className="flex gap-2">
                        <Link href="/" className="px-3 py-2 rounded bg-white text-black">Back</Link>
                        <button onClick={signOut} className="px-3 py-2 rounded border border-zinc-700 text-zinc-200">
                            Sign out
                        </button>
                    </div>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full overflow-hidden border border-zinc-700 bg-zinc-800 grid place-items-center">
                            {iconUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={iconUrl} alt="icon" width={64} height={64} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-lg font-bold">{username?.slice(0, 2) || "?"}</span>
                            )}
                        </div>

                        <div className="flex-1">
                            <label className="block text-sm text-zinc-300 mb-1">Email</label>
                            <input
                                value={email}
                                readOnly
                                disabled
                                className="w-full rounded-lg border border-zinc-800 big-zinc-950/60 px-3 py-2 text-zinc-400 cursor-not-allowed"
                            />
                        </div>      
                    </div>                  

                    <div className="mt-4">
                        <label htmlFor="username" className="block text-base font-medium text-zinc-200 mb-1">
                            Edit Username
                        </label>
                        <input
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:ring-2 focus:ring-zinc-600"
                            placeholder="Enter a username"
                        />
                    </div>

                    <h2 className="mt-5 mb-1 text-base font-medium text-zinc-200">Update Profile Image</h2>

                    <section className="space-y-3">
                        <details className="rounded-lg border border-zinc-800 group">
                            <summary className="cursor-pointer select-none px-3 py-2 font-medium text-zinc-200 bg-zinc-950/60 rounded-lg flex items-center justify-between">
                                <span>Harry Potter</span>
                                <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 transition-transform duration-200 group-open:rotate-180">
                                    <path d="M5 7l5 6 5-6" fill="currentColor" />
                                </svg>
                            </summary>
                            <div className="p-3">
                                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                                    {hpOptions.map((o) => {
                                        const selected = iconUrl === o.image;
                                        return (
                                            <button
                                                key={o.image}
                                                type="button"
                                                onClick={() => setIconUrl(o.image)}
                                                title={o.name}
                                                className={`rounded-lg overflow-hidden border ${selected ? "border-zinc-100 ring-2 ring-zinc-300" : "border-zinc-700"} bg-zinc-800`}
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={o.image} alt={o.name} className="w-full h-16 object-cover" />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </details>

                        <details className="rounded-lg border border-zinc-800 group">
                            <summary className="cursor-pointer select-none px-3 py-2 font-medium text-zinc-200 bg-zinc-950/60 rounded-lg flex items-center justify-between">
                                <span>Star Wars</span>
                                <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 transition-transform duration-200 group-open:rotate-180">
                                    <path d="M5 7l5 6 5-6" fill="currentColor" />
                                </svg>
                            </summary>
                            <div className="p-3">
                                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                                    {swOptions.map((o) => {
                                        const selected = iconUrl === o.image;
                                        return (
                                            <button
                                                key={o.image}
                                                type="button"
                                                onClick={() => setIconUrl(o.image)}
                                                title={o.name}
                                                className={`rounded-lg overflow-hidden border ${selected ? "border-zinc-100 ring-2 ring-zinc-300" : "border-zinc-700"} bg-zinc-800`}
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={o.image} alt={o.name} className="w-full h-16 object-cover" />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </details>
                    </section>

                    <div className="mt-4">
                        <label htmlFor="iconurl" className="block text-sm text-zinc-300 mb-1">Or paste image URL</label>
                        <input
                            id="iconurl"
                            value={iconUrl ?? ""}
                            onChange={(e) => setIconUrl(e.target.value || null)}
                            placeholder="https://…"
                            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:ring-2 focus:ring-zinc-600"
                        />
                    </div>

                    <div className="mt-4 flex gap-3">
                        <button
                            onClick={save}
                            disabled={saving}
                            className="px-4 py-2 rounded-lg bg-zinc-100 text-black font-semibold disabled:opacity-60"
                        >
                            {saving ? "Saving…" : "Save changes"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setIconUrl(null)}
                            className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-200"
                        >
                            Remove icon
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
