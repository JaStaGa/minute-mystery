'use client'
import { useEffect, useRef, useState } from 'react'

type Props = { ms: number; onEnd?: () => void; onTick?: (msLeft: number) => void }

export default function Countdown({ ms, onEnd, onTick }: Props) {
    const [left, setLeft] = useState(ms)

    // keep latest callbacks without retriggering the interval
    const onEndRef = useRef(onEnd)
    const onTickRef = useRef(onTick)
    useEffect(() => { onEndRef.current = onEnd }, [onEnd])
    useEffect(() => { onTickRef.current = onTick }, [onTick])

    useEffect(() => {
        setLeft(ms)
        const started = Date.now()
        const id = setInterval(() => {
            const remain = Math.max(0, ms - (Date.now() - started))
            setLeft(remain)
            onTickRef.current?.(remain)
            if (remain <= 0) {
                clearInterval(id)
                onEndRef.current?.()
            }
        }, 200)
        return () => clearInterval(id)
    }, [ms]) // <- only depends on ms

    const totalSeconds = Math.ceil(left / 1000)
    const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
    const ss = String(totalSeconds % 60).padStart(2, '0')
    return <span>{mm}:{ss}</span>
}
