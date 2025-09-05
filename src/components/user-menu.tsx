"use client";
import { useEffect, useState } from "react";
import { sb } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function initials(email?: string | null) {
    if (!email) return "U";
    const name = email.split("@")[0].replace(/[^a-zA-Z0-9]+/g, " ").trim();
    const parts = name.split(" ").filter(Boolean);
    const a = parts[0]?.[0], b = parts[1]?.[0];
    return (a || "U").toUpperCase() + (b ? b.toUpperCase() : "");
}

export default function UserMenu() {
    const supabase = sb();
    const [email, setEmail] = useState<string | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
        const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
            setEmail(s?.user?.email ?? null)
        );
        return () => sub.subscription.unsubscribe();
    }, [supabase]);

    if (!email) return <Button asChild><a href="/auth">Sign in</a></Button>;

    return (
        <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8"><AvatarFallback>{initials(email)}</AvatarFallback></Avatar>
            <span className="text-sm text-zinc-400">{email}</span>
            <Button variant="outline" onClick={() => supabase.auth.signOut()}>Sign out</Button>
        </div>
    );
}
