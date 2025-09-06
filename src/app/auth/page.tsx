// src/app/auth/page.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { sb } from "@/lib/supabase";

export default function AuthPage() {
    const supabase = sb();
    const router = useRouter();

    // redirect to "/" after sign-in
    useEffect(() => {
        const { data: sub } = supabase.auth.onAuthStateChange((e) => {
            if (e === "SIGNED_IN") router.replace("/");
        });
        return () => sub.subscription.unsubscribe();
    }, [supabase, router]);

    // dynamic redirect for local + Vercel
    const redirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/` : undefined;

    return (
        <main className="min-h-dvh grid place-items-center p-6">
            <div className="w-full max-w-sm">
                <Auth
                    supabaseClient={supabase}
                    appearance={{ theme: ThemeSupa }}
                    providers={[]}
                    redirectTo={redirectTo}
                    view="sign_in"
                />
            </div>
        </main>
    );
}
