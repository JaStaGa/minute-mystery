"use client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { sb } from "@/lib/supabase";

export default function AuthPage() {
    const supabase = sb();
    return (
        <main className="min-h-dvh flex items-center justify-center p-6">
            <div className="w-full max-w-sm">
                <Auth
                    supabaseClient={supabase}
                    appearance={{ theme: ThemeSupa }}
                    providers={[]}                 // hide GitHub/Google/Azure for now
                    redirectTo="http://localhost:3000/"
                    view="sign_in"
                />
            </div>
        </main>
    );
}
