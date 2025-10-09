// src/lib/accent.ts
"use client";
export function useAccent(slug?: string) {
    // map slugs to accents
    const map: Record<string, "sw" | "hp" | "nrt" | "ng"> = {
        "star-wars": "sw", "harry-potter": "hp", "naruto": "nrt", "new-game": "ng",
    };
    const key = slug && map[slug] ? `accent-${map[slug]}` : "accent-none";
    if (typeof document !== "undefined") {
        const b = document.body;
        b.classList.remove("accent-sw", "accent-hp", "accent-nrt", "accent-ng", "accent-none");
        b.classList.add(key);
    }
}
