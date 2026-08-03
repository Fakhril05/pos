'use client'

import { useState, useEffect } from 'react'

export function LoadingBar() {
  const [width, setWidth] = useState(0)
  const [visible, setVisible] = useState(true)
  const [opacity, setOpacity] = useState(1)

  useEffect(() => {
    // Animate from 0 to 90%
    const interval = setInterval(() => {
      setWidth((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        // Slow down as we approach 90%
        const increment = Math.max(1, (90 - prev) * 0.08)
        return Math.min(prev + increment, 90)
      })
    }, 100)

    // After 1.2s, snap to 100% and fade out
    const timeout = setTimeout(() => {
      clearInterval(interval)
      setWidth(100)
      setOpacity(0)
      setTimeout(() => setVisible(false), 400)
    }, 1200)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className="nprogress-bar neon-glow"
      style={{
        width: `${width}%`,
        opacity,
        transition: opacity === 0 ? 'opacity 0.4s ease' : undefined,
      }}
    />
  )
}
