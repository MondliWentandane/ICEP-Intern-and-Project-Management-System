import { useEffect, useRef } from 'react'
import { Box, Typography } from '@mui/material'
import { keyframes } from '@mui/material/styles'

// Cyclist loading animation in ICEP colours: navy rider and bike, green accents.
// Wheels and speed lines are CSS animations; the legs pedal via a small per-frame
// calculation (knee position from hip + pedal) written straight to the SVG, so React
// does not re-render every frame. Everything is still for reduced-motion readers.

const NAVY = '#1B3A5C'
const INK = '#1A202C'
const GREEN = '#16A34A'
const SKIN = '#F1D3B8'

const spin = keyframes`to { transform: rotate(360deg); }`
const stream = keyframes`
  0% { transform: translateX(14px); opacity: 0; }
  30% { opacity: 1; }
  100% { transform: translateX(-26px); opacity: 0; }
`
const road = keyframes`to { stroke-dashoffset: -24; }`
const bob = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(1.2px); }
`
const dot = keyframes`
  0%, 20% { opacity: 0; }
  40%, 100% { opacity: 1; }
`

const REAR = { x: 52, y: 96 }
const FRONT = { x: 150, y: 96 }
const WHEEL_R = 27
const CRANK = { x: 98, y: 96 }
const CRANK_R = 9
const HIP = { x: 86, y: 50 }
const THIGH = 31
const SHIN = 31
const PEDAL_SECONDS = 0.9

/** Knee and foot for a pedal at `angle`, with the knee bending forward. */
function leg(angle: number) {
  const foot = { x: CRANK.x + CRANK_R * Math.cos(angle), y: CRANK.y + CRANK_R * Math.sin(angle) }
  const dx = foot.x - HIP.x
  const dy = foot.y - HIP.y
  const d = Math.min(Math.hypot(dx, dy), THIGH + SHIN - 0.01)
  const bend = Math.acos((THIGH * THIGH + d * d - SHIN * SHIN) / (2 * THIGH * d))
  const toward = Math.atan2(dy, dx)
  const knee = { x: HIP.x + THIGH * Math.cos(toward - bend), y: HIP.y + THIGH * Math.sin(toward - bend) }
  return { knee, foot }
}

const legPoints = (angle: number) => {
  const { knee, foot } = leg(angle)
  return `${HIP.x},${HIP.y} ${knee.x.toFixed(1)},${knee.y.toFixed(1)} ${foot.x.toFixed(1)},${foot.y.toFixed(1)}`
}

const reduceMotion = { '@media (prefers-reduced-motion: reduce)': { animation: 'none' } }
const spinSx = (seconds: number) => ({ transformBox: 'fill-box', transformOrigin: 'center', animation: `${spin} ${seconds}s linear infinite`, ...reduceMotion })

function Wheel({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={WHEEL_R} fill="none" stroke={NAVY} strokeWidth="5" />
      <Box component="g" sx={spinSx(0.7)}>
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4
          return <line key={i} x1={x} y1={y} x2={x + (WHEEL_R - 3) * Math.cos(a)} y2={y + (WHEEL_R - 3) * Math.sin(a)} stroke={NAVY} strokeWidth="1.1" opacity=".55" />
        })}
        {/* Valve mark so the spin is visible even at a glance */}
        <circle cx={x + WHEEL_R - 4} cy={y} r="1.6" fill={GREEN} />
      </Box>
      <circle cx={x} cy={y} r="3.2" fill={NAVY} />
    </g>
  )
}

export interface BikeLoaderProps {
  /** Text under the bike. Animated dots are added after it. */
  label?: string
  /** Width of the illustration in px (height follows). */
  size?: number
}

export function BikeLoader({ label = 'Please wait', size = 150 }: BikeLoaderProps) {
  const nearLeg = useRef<SVGPolylineElement>(null)
  const farLeg = useRef<SVGPolylineElement>(null)
  const crank = useRef<SVGLineElement>(null)

  useEffect(() => {
    const draw = (angle: number) => {
      nearLeg.current?.setAttribute('points', legPoints(angle))
      farLeg.current?.setAttribute('points', legPoints(angle + Math.PI))
      const a = { x: CRANK.x + CRANK_R * Math.cos(angle), y: CRANK.y + CRANK_R * Math.sin(angle) }
      const b = { x: CRANK.x - CRANK_R * Math.cos(angle), y: CRANK.y - CRANK_R * Math.sin(angle) }
      crank.current?.setAttribute('x1', a.x.toFixed(1)); crank.current?.setAttribute('y1', a.y.toFixed(1))
      crank.current?.setAttribute('x2', b.x.toFixed(1)); crank.current?.setAttribute('y2', b.y.toFixed(1))
    }
    draw(Math.PI / 4)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      draw(Math.PI / 4 + ((now - start) / 1000 / PEDAL_SECONDS) * Math.PI * 2)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <Box role="status" aria-live="polite" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <Box component="svg" viewBox="0 0 200 135" aria-hidden="true" sx={{ width: size, height: 'auto', display: 'block', overflow: 'visible' }}>
        {/* Speed lines */}
        {[{ y: 34, w: 26, d: 0 }, { y: 50, w: 18, d: 0.25 }, { y: 66, w: 22, d: 0.5 }].map((l) => (
          <Box key={l.y} component="line" x1={30} y1={l.y} x2={30 + l.w} y2={l.y} stroke={l.y === 50 ? GREEN : '#A8B8CC'} strokeWidth="3.5" strokeLinecap="round"
            sx={{ animation: `${stream} 1s linear ${l.d}s infinite`, ...reduceMotion }} />
        ))}

        {/* Road */}
        <Box component="line" x1="10" y1="126" x2="192" y2="126" stroke="#D1D9E2" strokeWidth="2" strokeLinecap="round" strokeDasharray="14 10"
          sx={{ animation: `${road} .45s linear infinite`, ...reduceMotion }} />

        <Wheel x={REAR.x} y={REAR.y} />
        <Wheel x={FRONT.x} y={FRONT.y} />

        {/* Far leg (behind the frame) */}
        <polyline ref={farLeg} fill="none" stroke="#3B5577" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Frame */}
        <g fill="none" stroke={NAVY} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round">
          <polyline points={`${REAR.x},${REAR.y} ${CRANK.x},${CRANK.y} 88,58 ${REAR.x},${REAR.y}`} />
          <polyline points={`88,58 136,60 ${CRANK.x},${CRANK.y}`} />
          <polyline points={`136,60 140,52 ${FRONT.x},${FRONT.y}`} />
        </g>
        {/* Green accent stripe on the top tube + bottle */}
        <line x1="96" y1="58.4" x2="126" y2="59.6" stroke={GREEN} strokeWidth="1.8" strokeLinecap="round" />
        <rect x="104" y="68" width="6" height="14" rx="2" transform="rotate(-38 107 75)" fill={GREEN} />
        {/* Saddle and handlebar */}
        <line x1="80" y1="53" x2="93" y2="53" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
        <path d="M140 52 C146 48 152 49 152 55 C152 59 149 60 147 59" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />

        {/* Rider (gentle bob) */}
        <Box component="g" sx={{ animation: `${bob} ${PEDAL_SECONDS / 2}s ease-in-out infinite`, ...reduceMotion }}>
          {/* Torso */}
          <path d="M80 52 C86 36 104 26 124 28 L128 38 C112 40 96 46 92 56 Z" fill={NAVY} />
          {/* Shorts with green side panel */}
          <path d="M78 50 C80 44 88 42 96 46 L98 56 L84 58 Z" fill={INK} />
          <path d="M82 47 L92 45" stroke={GREEN} strokeWidth="2" strokeLinecap="round" />
          {/* Arm */}
          <polyline points="122,32 134,44 147,51" fill="none" stroke={NAVY} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="147.5" cy="51.5" r="3" fill={SKIN} />
          {/* Head and helmet */}
          <circle cx="133" cy="20" r="7.5" fill={SKIN} />
          <path d="M124.5 19 C124.5 10 133 7 139 10 C143 12 143.5 15 142 17 Z" fill={NAVY} />
          <path d="M127 13 L138 11" stroke={GREEN} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M136 21 L142 21" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
        </Box>

        {/* Near leg, crank and chainring (in front of the frame) */}
        <circle cx={CRANK.x} cy={CRANK.y} r="6" fill="none" stroke={NAVY} strokeWidth="2" />
        <line ref={crank} stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
        <polyline ref={nearLeg} fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      </Box>
      {label && (
        <Typography sx={{ fontWeight: 600, color: 'primary.main', letterSpacing: '.02em' }}>
          {label}
          {[0, 1, 2].map((i) => (
            <Box key={i} component="span" aria-hidden="true" sx={{ animation: `${dot} 1.4s ease-in-out ${i * 0.2}s infinite alternate`, ...reduceMotion }}>.</Box>
          ))}
        </Typography>
      )}
    </Box>
  )
}

export default BikeLoader
