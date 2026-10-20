import { useEffect, useState } from 'react'
import { Box, ButtonBase, Typography } from '@mui/material'
import { keyframes } from '@emotion/react'
import { Check } from 'lucide-react'
import { railSteps } from './steps'

const visuallyHidden = { position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' } as const

/**
 * Navy step rail on the left of the application pop-up (md and up; smaller screens use ApplicationStepper).
 * activeStep is 0-based; pass railSteps.length to show every step as complete. Completed steps are clickable when onSelect is given.
 */
export function ApplicationRail({ activeStep, onSelect }: { activeStep: number; onSelect?: (step: number) => void }) {
  return (
    <Box component="nav" aria-label="Application steps" sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', justifyContent: 'center', flex: '0 0 250px', bgcolor: 'primary.main', color: '#fff', py: 4, position: 'relative', zIndex: 1 }}>
      <RailWaves />
      <Box component="ol" sx={{ listStyle: 'none', p: 0, m: 0, display: 'grid', gap: 1.5, position: 'relative' }}>
        {railSteps.map((item, index) => {
          const done = index < activeStep
          const current = index === activeStep
          const clickable = done && Boolean(onSelect)
          return (
            <Box component="li" key={item.title} aria-current={current ? 'step' : undefined}>
              <ButtonBase disabled={!clickable} onClick={() => onSelect?.(index)}
                sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, pl: 3, py: 1.25, textAlign: 'left', '&:hover .rail-title': { textDecoration: 'underline' }, '&.Mui-focusVisible .rail-title': { textDecoration: 'underline' } }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography className="rail-title" sx={{ fontSize: 14, lineHeight: 1.35, fontWeight: current ? 700 : 500, color: current || done ? '#fff' : '#B5D4F4' }}>{item.title}</Typography>
                  <Typography sx={{ fontSize: 12, color: '#B5D4F4', mt: 0.25 }}>
                    {item.caption}{done && <Box component="span" sx={visuallyHidden}> (complete, select to edit)</Box>}
                  </Typography>
                </Box>
                <Box aria-hidden="true" sx={{
                  width: 34, height: 34, flex: '0 0 34px', mr: '-17px', borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 700,
                  bgcolor: done ? 'success.main' : '#fff', color: done ? '#fff' : 'primary.main', border: '2px solid', borderColor: done || current ? 'success.main' : '#fff',
                  boxShadow: current ? '0 0 0 4px rgba(22,163,74,.22)' : '0 1px 4px rgba(18,40,63,.18)', transition: 'background-color .2s, box-shadow .2s, border-color .2s',
                }}>
                  {done ? <Check size={17} strokeWidth={3} /> : index + 1}
                </Box>
              </ButtonBase>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

const drift = keyframes`from { transform: translateX(0) } to { transform: translateX(-50%) }`

/** One seamless wave period (250 wide) drawn twice, so sliding the layer left by half loops without a seam. */
const wavePath = (y: number, amp: number) => `M0 ${y} C 62.5 ${y - amp}, 187.5 ${y + amp}, 250 ${y} S 437.5 ${y + amp}, 500 ${y}`

function WaveLayer({ y, amp, height, seconds, reverse = false, fill, stroke, anchor }: {
  y: number; amp: number; height: number; seconds: number; reverse?: boolean; fill?: string; stroke?: string; anchor: 'top' | 'bottom'
}) {
  const d = wavePath(y, amp) + (fill ? ` L500 ${height} L0 ${height} Z` : '')
  return (
    <Box component="svg" viewBox={`0 0 500 ${height}`} preserveAspectRatio="none"
      sx={{ position: 'absolute', [anchor]: 0, left: 0, width: '200%', height, animation: `${drift} ${seconds}s linear infinite`, animationDirection: reverse ? 'reverse' : 'normal', '@media (prefers-reduced-motion: reduce)': { animation: 'none' } }}>
      <path d={d} fill={fill ?? 'none'} stroke={stroke} strokeWidth={stroke ? 1.5 : undefined} vectorEffect="non-scaling-stroke" />
    </Box>
  )
}

/** Decorative, slowly drifting waves behind the rail steps: thin lines at the top, layered swells at the bottom. */
function RailWaves() {
  return (
    <Box aria-hidden="true" sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <WaveLayer anchor="top" height={160} y={40} amp={22} seconds={18} stroke="rgba(255,255,255,.18)" />
      <WaveLayer anchor="top" height={160} y={70} amp={26} seconds={24} reverse stroke="rgba(255,255,255,.13)" />
      <WaveLayer anchor="top" height={160} y={100} amp={22} seconds={30} stroke="rgba(255,255,255,.09)" />
      <WaveLayer anchor="bottom" height={260} y={90} amp={30} seconds={16} fill="rgba(34,71,111,.6)" />
      <WaveLayer anchor="bottom" height={260} y={150} amp={28} seconds={12} reverse fill="rgba(18,40,63,.55)" />
      <WaveLayer anchor="bottom" height={260} y={205} amp={22} seconds={9} fill="rgba(18,40,63,.85)" />
    </Box>
  )
}

/** Tabs that scroll the dialog content to each section of the current step, and highlight the section in view. */
export function SectionTabs({ sections, scrollContainerId }: { sections: ReadonlyArray<{ id: string; label: string }>; scrollContainerId: string }) {
  const [active, setActive] = useState(sections[0]?.id)
  useEffect(() => {
    setActive(sections[0]?.id)
    const container = document.getElementById(scrollContainerId)
    if (!container) return
    const onScroll = () => {
      const top = container.getBoundingClientRect().top + 90
      const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 4
      const inView = atBottom ? sections[sections.length - 1] : [...sections].reverse().find(({ id }) => (document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) <= top)
      setActive(inView?.id ?? sections[0]?.id)
    }
    container.addEventListener('scroll', onScroll, { passive: true })
    return () => container.removeEventListener('scroll', onScroll)
  }, [sections, scrollContainerId])

  if (!sections.length) return null
  return (
    <Box component="nav" aria-label="Sections in this step" sx={{ display: 'flex', gap: 3, borderBottom: '1px solid', borderColor: 'divider', overflowX: 'auto', overflowY: 'hidden', scrollbarWidth: 'none', position: 'sticky', top: -24, zIndex: 2, bgcolor: 'var(--icep-page)' }}>
      {sections.map(({ id, label }) => (
        <ButtonBase key={id} aria-current={active === id ? 'location' : undefined}
          onClick={() => { setActive(id); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}
          sx={{ py: 1.25, fontSize: 14, whiteSpace: 'nowrap', fontWeight: active === id ? 700 : 500, color: active === id ? 'primary.main' : 'text.secondary', borderBottom: '2px solid', borderColor: active === id ? 'primary.main' : 'transparent', mb: '-1px', '&:hover': { color: 'primary.main' } }}>
          {label}
        </ButtonBase>
      ))}
    </Box>
  )
}
