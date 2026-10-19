import { useEffect, useRef, useState, type ElementType } from 'react'
import { Box, Typography, type TypographyProps } from '@mui/material'
import { seg, usePrefersReducedMotion, useReveal } from './useScrollProgress'

const ease = 'cubic-bezier(.2,.8,.2,1)'

/**
 * Heading whose words slide up from behind a mask, one after another, the first
 * time it scrolls into view.
 */
export function RevealTitle({ text, component = 'h2', delay = 0, sx, ...props }: Omit<TypographyProps, 'children'> & { text: string; component?: ElementType; delay?: number }) {
  const reducedMotion = usePrefersReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || seen) return
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setSeen(true) }, { rootMargin: '0px 0px -12% 0px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [seen])

  const shown = seen || reducedMotion
  return (
    <Typography ref={ref} component={component} sx={sx} {...props}>
      {text.split(' ').map((word, i) => (
        <Box key={i} component="span" sx={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', pb: '0.08em', mb: '-0.08em' }}>
          <Box component="span" sx={{
            display: 'inline-block', transform: shown ? 'none' : 'translateY(105%)',
            transition: reducedMotion ? 'none' : `transform .8s ${ease} ${delay + i * 70}ms`,
          }}>
            {word}{i < text.split(' ').length - 1 ? ' ' : ''}
          </Box>
        </Box>
      ))}
    </Typography>
  )
}

/**
 * Large statement whose words light up one by one as it scrolls through the
 * viewport, in the style of a scroll-driven manifesto.
 */
export function ScrollStatement({ text, sx }: { text: string; sx?: TypographyProps['sx'] }) {
  const { ref, p } = useReveal<HTMLParagraphElement>(0.85, 0.45)
  const words = text.split(' ')
  return (
    <Typography ref={ref} sx={sx}>
      {words.map((word, i) => {
        const lit = seg(p, i / words.length - 0.02, (i + 1) / words.length + 0.04)
        return (
          <Box key={i} component="span" sx={{ opacity: 0.16 + 0.84 * lit, transition: 'opacity .15s linear' }}>
            {word}{i < words.length - 1 ? ' ' : ''}
          </Box>
        )
      })}
    </Typography>
  )
}
