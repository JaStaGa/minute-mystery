"use client";
import { useEffect, useRef, useState } from "react";

export default function Countdown({
    ms = 60_000,
    onEnd,
}: { ms?: number; onEnd: () => void }) {
    const start = useRef<number | null>(null);
    const [left, setLeft] = useState(ms);

    useEffect(() => {
        start.current = performance.now();
        const id = setInterval(() => {
            const elapsed = performance.now() - (start.current as number);
            const remain = Math.max(0, ms - elapsed);
            setLeft(remain);
            if (remain <= 0) onEnd();
        }, 100);
        return () => clearInterval(id);
    }, [ms, onEnd]);

    const sec = Math.ceil(left / 1000);
    return <div aria-label="time-left" className="font-mono">{sec}s</div>;
}
