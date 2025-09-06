"use client";
import Image from "next/image";
import type { Character } from "@/game/types";

export default function RevealCard({ c }: { c: Character }) {
    const src = c.image || "https://via.placeholder.com/150x200";
    return (
        <div className="character-reveal-box">
            <Image
                src={src}
                alt={c.name}
                width={150}
                height={200}
                className="character-image"
                unoptimized
            />
            <div className="character-info">
                <h2>{c.name}</h2>
                {c.house && (
                    <p>
                        <strong>House:</strong> {c.house}
                    </p>
                )}
                {c.gender && (
                    <p>
                        <strong>Gender:</strong> {c.gender}
                    </p>
                )}
                {typeof c.yearOfBirth === "number" && (
                    <p>
                        <strong>Year:</strong> {c.yearOfBirth}
                    </p>
                )}
                {c.hairColour && (
                    <p>
                        <strong>Hair:</strong> {c.hairColour}
                    </p>
                )}
                {c.ancestry && (
                    <p>
                        <strong>Ancestry:</strong> {c.ancestry}
                    </p>
                )}
                {typeof c.alive === "boolean" && (
                    <p>
                        <strong>Status:</strong> {c.alive ? "Alive" : "Deceased"}
                    </p>
                )}
            </div>
        </div>
    );
}
