"use client";
import type { Character } from "@/game/types";

export default function RevealCard({ c }: { c: Character }) {
    return (
        <div className="character-reveal-box">
            <img src={c.image || "https://via.placeholder.com/150"} alt={c.name} className="character-image" />
            <div className="character-info">
                <h2>{c.name}</h2>
                {c.house && <p><strong>House:</strong> {c.house}</p>}
                {c.gender && <p><strong>Gender:</strong> {c.gender}</p>}
                {typeof c.yearOfBirth === "number" && <p><strong>Year:</strong> {c.yearOfBirth}</p>}
                {c.hairColour && <p><strong>Hair:</strong> {c.hairColour}</p>}
                {c.ancestry && <p><strong>Ancestry:</strong> {c.ancestry}</p>}
                {typeof c.alive === "boolean" && <p><strong>Status:</strong> {c.alive ? "Alive" : "Deceased"}</p>}
            </div>
        </div>
    );
}
