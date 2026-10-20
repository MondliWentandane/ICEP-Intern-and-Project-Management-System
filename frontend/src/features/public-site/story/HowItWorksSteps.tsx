import { Box, Paper, Typography } from '@mui/material'
import { Check, FileUp, GraduationCap, Send, UserRound } from 'lucide-react'
import { useElementProgress, usePrefersReducedMotion } from './useScrollProgress'

const icons = [UserRound, GraduationCap, FileUp, Send]
const ease = 'cubic-bezier(.2,.8,.2,1)'
const GAP = 16
const DOT = 40

/** Progress of `p` through the window [from, to], clamped to 0..1. */
const seg = (p: number, from: number, to: number) => Math.min(1, Math.max(0, (p - from) / (to - from)))

/**
 * "How it works" steps that build up as you scroll: each card rises in, its number
 * fills, and a connector draws on to the next step. Horizontal on desktop,
 * vertical on phones.
 */
export function HowItWorksSteps({ steps }: { steps: Array<{ title: string; text: string }> }) {
  const reducedMotion = usePrefersReducedMotion()
  const { ref, progress } = useElementProgress<HTMLOListElement>(0.85, 0.55)
  const p = reducedMotion ? 1 : progress
  const span = 0.84 / steps.length

  return (
    <Box ref={ref} component="ol" sx={{
      listStyle: 'none', p: 0, m: 0, display: 'grid', gap: `${GAP}px`,
      gridTemplateColumns: { xs: '1fr', md: `repeat(${steps.length}, 1fr)` },
    }}>
      {steps.map((step, i) => {
        const shown = seg(p, i * span, i * span + span * 0.8)
        const done = shown >= 0.6
        const link = seg(p, i * span + span * 0.5, (i + 1) * span + span * 0.1)
        const Icon = icons[i % icons.length]
        return (
          <Box component="li" key={step.title} sx={{
            position: 'relative', display: 'flex', flexDirection: { xs: 'row', md: 'column' }, alignItems: { xs: 'flex-start', md: 'center' }, gap: 2,
          }}>
            {/* Connector to the next step */}
            {i < steps.length - 1 && (
              <Box aria-hidden="true" sx={{
                position: 'absolute', bgcolor: 'divider', borderRadius: 2,
                top: { xs: DOT / 2, md: DOT / 2 - 1 }, left: { xs: DOT / 2 - 1, md: '50%' },
                width: { xs: 2, md: `calc(100% + ${GAP}px)` }, height: { xs: `calc(100% + ${GAP}px)`, md: 2 },
              }}>
                <Box sx={{
                  width: '100%', height: '100%', borderRadius: 2, bgcolor: 'primary.main',
                  transformOrigin: { xs: 'top', md: 'left' }, transform: { xs: `scaleY(${link})`, md: `scaleX(${link})` },
                }} />
              </Box>
            )}

            <Box sx={{
              position: 'relative', zIndex: 1, width: DOT, height: DOT, flexShrink: 0, borderRadius: '50%', display: 'grid', placeItems: 'center',
              fontSize: 14, fontWeight: 700, border: '2px solid', boxShadow: '0 0 0 6px var(--icep-page)',
              borderColor: done ? 'primary.main' : 'divider', bgcolor: done ? 'primary.main' : '#fff', color: done ? '#fff' : 'text.secondary',
              transform: `scale(${0.85 + 0.15 * shown})`, transition: `background-color .3s ${ease}, border-color .3s ${ease}, color .3s ${ease}`,
            }}>
              {p >= 1 && i === steps.length - 1 ? <Check size={18} /> : i + 1}
            </Box>

            <Paper sx={{
              flex: 1, width: { md: '100%' }, boxSizing: 'border-box', p: 3, borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: done ? 'primary.main' : 'divider',
              opacity: shown, transform: `translateY(${(1 - shown) * 24}px)`, transition: `border-color .3s ${ease}`,
            }}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: '#E4EBF5', color: 'primary.main' }}>
                <Icon size={18} aria-hidden="true" />
              </Box>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'primary.main', mt: 2 }}>Step {i + 1}</Typography>
              <Typography component="h3" sx={{ fontWeight: 700, mt: 0.25 }}>{step.title}</Typography>
              <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.5 }}>{step.text}</Typography>
            </Paper>
          </Box>
        )
      })}
    </Box>
  )
}
