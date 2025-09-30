"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { sb } from "@/lib/supabase";

type Stage = "loading" | "mustLogin" | "needsUsername" | "ok";

export default function RequireUsername({ children }: { children: React.ReactNode }) {
    const [stage, setStage] = useState<Stage>("loading");
    const router = useRouter();
    const pathname = usePathname();
    const supabase = sb();

    useEffect(() => {
        let alive = true;

        async function check() {
            try {
                const { data: au, error } = await supabase.auth.getUser();
                if (!alive) return;

                if (error || !au?.user) {
                    setStage("mustLogin");
                    return;
                }

                const uid = au.user.id;
                const { data: p, error: e2 } = await supabase
                    .from("profiles")
                    .select("username")
                    .eq("id", uid)
                    .maybeSingle();

                if (!alive) return;

                if (e2) {
                    setStage("ok"); // don’t hang if profile lookup fails
                    return;
                }
                if (!p?.username) {
                    setStage("needsUsername");
                    return;
                }
                setStage("ok");
            } catch {
                if (alive) setStage("mustLogin");
            }
        }

        // initial check
        check();

        // live updates (login/logout)
        const { data: sub } = supabase.auth.onAuthStateChange(() => {
            check();
        });

        return () => {
            alive = false;
            sub.subscription.unsubscribe();
        };
    }, [supabase]);

    // Redirects happen in an effect (never during render)
    useEffect(() => {
        if (stage === "mustLogin" && pathname !== "/auth") {
            router.replace("/auth");
        } else if (stage === "needsUsername" && pathname !== "/profile") {
            router.replace("/profile");
        }
    }, [stage, pathname, router]);

    if (stage === "loading") {
        return (
            <div className="min-h-dvh grid place-items-center text-zinc-200">
                <div className="rounded-xl bg-zinc-900/70 border border-zinc-700 p-6 shadow">
                    <div className="text-xl font-semibold">Minute Mystery</div>
                    <div className="mt-2 opacity-80">Checking your session...</div>
                </div>
            </div>
        );
    }

    // While redirecting, render nothing (effect above will navigate)
    if (stage === "mustLogin" || stage === "needsUsername") return null;

    return <>{children}</>;
}
