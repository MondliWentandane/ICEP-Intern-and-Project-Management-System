import { useEffect, useRef } from 'react'
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
