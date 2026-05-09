'use client'

import { useEffect, useState } from 'react'

// Client-side wrapper that detects the transition from blurred → revealed
// (per film, persisted in localStorage). On the first render after the admin
// flips the reveal toggle, plays a dramatic reveal animation. Subsequent
// renders show the title normally.

type Props = {
  revealed: boolean
  filmId: string
  title: string
  className?: string
  blockChars?: string
}

export function RevealText({ revealed, filmId, title, className = '', blockChars = '████████████' }: Props) {
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    const key = `reveal:${filmId}`
    if (!revealed) {
      try { localStorage.setItem(key, 'hidden') } catch {}
      return
    }
    let prev: string | null = null
    try { prev = localStorage.getItem(key) } catch {}
    if (prev === 'hidden') {
      setAnimate(true)
      try { localStorage.setItem(key, 'shown') } catch {}
      const t = setTimeout(() => setAnimate(false), 1500)
      return () => clearTimeout(t)
    }
    try { localStorage.setItem(key, 'shown') } catch {}
  }, [revealed, filmId])

  if (!revealed) {
    return (
      <span className={`select-none blur-md ${className}`} aria-hidden>
        {blockChars}
      </span>
    )
  }

  return (
    <span
      className={`${animate ? 'animate-reveal inline-block' : ''} ${className}`}
    >
      {title}
    </span>
  )
}
