"use client";
import { useEffect, useRef, useState } from "react";

export default function Countdown({
    ms = 60_000,
    onEnd,
}: { ms?: number; onEnd: () => void }) {
    const onEndRef = useRef(onEnd);
    useEffect(() => { onEndRef.current = onEnd; }, [onEnd]);

    const [left, setLeft] = useState(ms);

    useEffect(() => {
        const start = performance.now();
        const id = setInterval(() => {
            const elapsed = performance.now() - start;
            const remain = Math.max(0, ms - elapsed);
            setLeft(remain);
            if (remain <= 0) {
                clearInterval(id);
                onEndRef.current();
            }
        }, 100);
        return () => clearInterval(id);
    }, [ms]); // restart only when ms (or key) changes

    return <div className="font-mono">{Math.ceil(left / 1000)}s</div>;
}
