"use client";

import React from 'react';

interface SilhouetteHintProps {
    imageUrl: string;
    show: boolean;
}

const SilhouetteHint: React.FC<SilhouetteHintProps> = ({ imageUrl, show }) => {
    if (!show) return null;

    return (
        <div className="silhouette-container">
            <img src={imageUrl} alt="Silhouette Hint" className="silhouette" />
        </div>
    );
};

export default SilhouetteHint;