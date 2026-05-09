'use client'

import { useEffect } from 'react'

// Replaces <meta http-equiv="refresh"> with JS-based reload that pauses
// while a modal is open (data-modal-open on body), so user can read film
// synopsis without the page yanking out from under them.

export function AutoRefresh({ intervalMs = 12000 }: { intervalMs?: number }) {
  useEffect(() => {
    const tick = () => {
      if (document.body.dataset.modalOpen === 'true') return
      window.location.reload()
    }
    const id = setInterval(tick, intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return null
}
