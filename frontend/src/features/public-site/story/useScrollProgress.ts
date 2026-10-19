import { useEffect, useRef, useState } from 'react'

export type StoryPosition = { active: number; t: number }

/**
 * Tracks which chapter crosses a horizontal "focus line" in the viewport and how far
 * through that chapter the line is (t: 0 at its top, 1 at its bottom). Measures once
 * per frame while scrolling and only re-renders when the rounded value changes.
 */
export function useScrollStory(count: number, focusRatio: number) {
  const chapters = useRef<Array<HTMLElement | null>>([])
  const [position, setPosition] = useState<StoryPosition>({ active: 0, t: 0 })

  useEffect(() => {
    let frame = 0
    const measure = () => {
      frame = 0
      const focus = window.innerHeight * focusRatio
      let next: StoryPosition = { active: 0, t: 0 }
      for (let i = 0; i < count; i++) {
        const el = chapters.current[i]
        if (!el) continue
        const rect = el.getBoundingClientRect()
        if (focus < rect.top) break
        const t = Math.min(1, (focus - rect.top) / rect.height)
        next = { active: i, t: Math.round(t * 100) / 100 }
      }
      setPosition((prev) => (prev.active === next.active && prev.t === next.t ? prev : next))
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure) }
    measure()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [count, focusRatio])

  const register = (index: number) => (el: HTMLElement | null) => { chapters.current[index] = el }
  return { ...position, register }
}

/**
 * 0..1 progress of an element moving up through the viewport: 0 when its top reaches
 * `start` (a fraction of viewport height), 1 when its bottom reaches `end`.
 */
export function useElementProgress<T extends HTMLElement>(start = 0.85, end = 0.6) {
  const ref = useRef<T>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0
    const measure = () => {
      frame = 0
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight
      const distance = vh * (start - end) + rect.height
      const raw = (vh * start - rect.top) / distance
      const next = Math.round(Math.min(1, Math.max(0, raw)) * 100) / 100
      setProgress((prev) => (prev === next ? prev : next))
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure) }
    measure()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [start, end])

  return { ref, progress }
}

export function usePrefersReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)'
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const media = window.matchMedia(query)
    const onChange = () => setReduced(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])
  return reduced
}

/** Progress of `p` through the window [from, to], clamped to 0..1. */
export const seg = (p: number, from: number, to: number) => Math.min(1, Math.max(0, (p - from) / (to - from)))

/** Scroll progress through an element, pinned to 1 when the reader prefers reduced motion. */
export function useReveal<T extends HTMLElement>(start = 0.95, end = 0.8) {
  const reducedMotion = usePrefersReducedMotion()
  const { ref, progress } = useElementProgress<T>(start, end)
  return { ref, p: reducedMotion ? 1 : progress }
}

/** Styles for item `index` of a staggered group rising into place as `p` goes 0 → 1. */
export function riseSx(p: number, index: number, { step = 0.16, length = 0.5, distance = 40 } = {}) {
  const s = seg(p, index * step, index * step + length)
  return { opacity: s, transform: `translateY(${(1 - s) * distance}px) scale(${0.96 + 0.04 * s})` }
}
