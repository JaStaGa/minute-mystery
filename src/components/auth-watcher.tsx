"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { sb } from "@/lib/supabase";

export default function AuthWatcher() {
    const router = useRouter();

    useEffect(() => {
        const supabase = sb();
        const { data: { subscription } } =
            supabase.auth.onAuthStateChange((_event, _session) => {
                router.refresh();            // revalidate app router cache
                // window.location.reload();  // use this instead if you want a hard reload
            });
        return () => subscription.unsubscribe();
    }, [router]);

    return null;
}
