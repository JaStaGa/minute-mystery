"use client";
import Image from "next/image";
import React from "react";

interface SilhouetteHintProps {
    imageUrl: string;
    show: boolean;
}

export default function SilhouetteHint({ imageUrl, show }: SilhouetteHintProps) {
    if (!show) return null;

    return (
        <div className="silhouette-container">
            <Image
                src={imageUrl || "https://via.placeholder.com/150x200"}
                alt="Silhouette Hint"
                width={200}
                height={260}
                className="silhouette"
                unoptimized
            />
        </div>
    );
}
