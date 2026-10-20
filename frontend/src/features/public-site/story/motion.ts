import { useEffect, useRef, useState } from 'react'
import { keyframes } from '@mui/material/styles'

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: none; }
`

const float = keyframes`
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-24px, 18px) scale(1.05); }
`

/** One-off entrance: fade up after `delay` ms. Skipped for reduced-motion readers. */
export const introSx = (delay: number) => ({
  animation: `${fadeUp} .9s cubic-bezier(.2,.8,.2,1) ${delay}ms both`,
  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
})

/**
 * Fade-up entrance that waits until the element is on screen. Anything visible when the
 * page opens keeps its staggered `loadDelay`; anything below the fold stays hidden and
 * rises in (with no delay) the first time it is scrolled into view.
 *
 * With `replay`, after that first entrance the element dims slightly and shifts 12px once it
 * is fully off screen, then eases back as it returns — settling down from above when the
 * reader scrolls back up. It is never fully hidden. Without `replay` it plays once.
 */
export function useEntrance<T extends HTMLElement>(loadDelay = 0, { replay = false } = {}) {
  const ref = useRef<T>(null)
  const [delay, setDelay] = useState<number | null>(null)
  const [settled, setSettled] = useState(false)
  const [away, setAway] = useState<'above' | 'below' | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const mountedAt = performance.now()
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setDelay((current) => current ?? (performance.now() - mountedAt < 400 ? loadDelay : 0))
        setAway(null)
        if (!replay) observer.disconnect()
      } else if (replay) {
        setAway(entry.boundingClientRect.top < 0 ? 'above' : 'below')
      }
    }, { rootMargin: '0px 0px -8% 0px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadDelay, replay])

  // Once the entrance animation has finished, hand over to transitions for the scroll replay.
  useEffect(() => {
    if (!replay || delay === null) return
    const timer = setTimeout(() => setSettled(true), delay + 950)
    return () => clearTimeout(timer)
  }, [replay, delay])

  const sx = delay === null
    ? { opacity: 0, transform: 'translateY(18px)', '@media (prefers-reduced-motion: reduce)': { opacity: 1, transform: 'none' } }
    : !settled
      ? introSx(delay)
      : {
          opacity: away ? 0.5 : 1,
          transform: away === 'above' ? 'translateY(-12px)' : away === 'below' ? 'translateY(12px)' : 'none',
          transition: 'opacity .6s ease, transform .6s cubic-bezier(.2,.8,.2,1)',
          '@media (prefers-reduced-motion: reduce)': { opacity: 1, transform: 'none', transition: 'none' },
        }
  return { ref, delay, sx }
}

/** Slow ambient drift for decorative shapes. */
export const floatSx = (seconds: number, delay = 0) => ({
  animation: `${float} ${seconds}s ease-in-out ${delay}s infinite`,
  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
})

/**
 * Writes `--hero-p` (0 at the top of the page, 1 once the element has scrolled
 * out above the viewport) onto the element, so children can parallax with
 * `calc(var(--hero-p) * …)` without React re-rendering on scroll.
 */
export function useScrollVar<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // Measured straight in the scroll handler: one rect read and one style write is
    // cheap, and keeps the effect in step with the scroll position.
    const measure = () => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const p = Math.min(1, Math.max(0, -rect.top / rect.height))
      el.style.setProperty('--hero-p', p.toFixed(3))
    }
    measure()
    window.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [])
  return ref
}
