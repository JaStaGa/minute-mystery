// src/app/auth/page.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { sb } from "@/lib/supabase";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";

export default function AuthPage() {
    const supabase = sb();
    const router = useRouter();

    // Redirect if already signed in or after sign-in
    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) router.replace("/");
        });
        const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
            if (session) router.replace("/");
        });
        return () => sub.subscription.unsubscribe();
    }, [supabase, router]);

    return (
        <main className="min-h-dvh p-6 flex justify-center items-start">
            <div className="w-full max-w-md">
                <Auth
                    supabaseClient={supabase}
                    theme="dark"
                    appearance={{
                        theme: ThemeSupa,
                        variables: {
                            default: {
                                colors: {
                                    inputText: "white",
                                    inputPlaceholder: "rgba(255,255,255,0.7)",
                                    inputBackground: "rgb(24,24,27)",
                                    inputBorder: "rgb(63,63,70)",
                                    brand: "#8B5E3C",
                                    brandAccent: "#6f472d",
                                },
                                radii: { inputBorderRadius: "8px", buttonBorderRadius: "8px" },
                            },
                        },
                    }}
                    providers={[]}
                />
            </div>
        </main>
    );
}
