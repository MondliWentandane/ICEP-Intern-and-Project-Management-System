import { Box, Typography } from '@mui/material'
import { keyframes } from '@mui/material/styles'
import { ArrowLeft, House, LayoutDashboard } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { homeByRole } from '@/routes/paths'

// "Page not found" (404) and "No access" (403, where ProtectedRoute sends the wrong role).
// Original illustration in ICEP colours: a road worker peeking out of a manhole between two cones.

const NAVY = '#1B3A5C'
const DEEP = '#12283F'
const AMBER = '#F59E0B'
const AMBER_DARK = '#D97706'
const SKIN = '#F1D3B8'
const INK = '#1A202C'

const rise = keyframes`
  0% { transform: translateY(78px); }
  70% { transform: translateY(-4px); }
  100% { transform: translateY(0); }
`
const pop = keyframes`
  0% { opacity: 0; transform: scale(.4); }
  70% { opacity: 1; transform: scale(1.06); }
  100% { opacity: 1; transform: scale(1); }
`
const glow = keyframes`
  0%, 100% { opacity: .25; }
  50% { opacity: .7; }
`
const look = keyframes`
  0%, 40%, 100% { transform: rotate(0deg); }
  50%, 70% { transform: rotate(-6deg); }
  80% { transform: rotate(4deg); }
`
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: none; }
`
const still = { '@media (prefers-reduced-motion: reduce)': { animation: 'none', opacity: 1 } }
const origin = (x: string) => ({ transformBox: 'fill-box', transformOrigin: x })

function Cone({ x }: { x: number }) {
  return (
    <g>
      <rect x={x - 26} y="196" width="52" height="9" rx="3" fill={AMBER_DARK} />
      <path d={`M${x - 7} 120 L${x + 7} 120 L${x + 21} 197 L${x - 21} 197 Z`} fill={AMBER} />
      <path d={`M${x - 11} 142 L${x + 11} 142 L${x + 14} 158 L${x - 14} 158 Z`} fill="#fff" />
      <path d={`M${x - 16} 170 L${x + 16} 170 L${x + 19} 184 L${x - 19} 184 Z`} fill="#fff" />
    </g>
  )
}

function Illustration({ bubble }: { bubble: string }) {
  return (
    <Box component="svg" viewBox="0 0 400 250" role="img" aria-label={`Road worker peeking out of a manhole saying "${bubble}"`} sx={{ width: '100%', maxWidth: 440, height: 'auto', display: 'block', mx: 'auto' }}>
      <defs>
        {/* Everything above the hole, plus the hole itself: the worker disappears below its rim. */}
        <clipPath id="nf-hole-clip">
          <rect x="0" y="0" width="400" height="204" />
          <ellipse cx="200" cy="204" rx="78" ry="17" />
        </clipPath>
      </defs>

      {/* Road */}
      <rect x="16" y="104" width="368" height="136" rx="18" fill="#E7ECF2" />
      <path d="M40 228 H120 M160 228 H240 M280 228 H360" stroke="#fff" strokeWidth="5" strokeLinecap="round" />

      <Cone x={78} />
      <Cone x={322} />

      {/* Manhole */}
      <ellipse cx="200" cy="204" rx="84" ry="21" fill="#CBD5E1" />
      <ellipse cx="200" cy="204" rx="78" ry="17" fill={DEEP} />

      {/* Worker, rising out of the hole */}
      <g clipPath="url(#nf-hole-clip)">
        <Box component="g" sx={{ animation: `${rise} .9s cubic-bezier(.2,.8,.2,1) .25s both`, ...still }}>
          {/* Body: navy shirt, amber hi-vis vest with reflective strips */}
          <path d="M140 232 C140 182 156 162 200 162 C244 162 260 182 260 232 Z" fill={NAVY} />
          <path d="M158 232 L162 172 C172 166 186 164 192 164 L196 232 Z" fill={AMBER} />
          <path d="M242 232 L238 172 C228 166 214 164 208 164 L204 232 Z" fill={AMBER} />
          <path d="M160 200 L195 200 M205 200 L240 200" stroke="#fff" strokeWidth="5" />
          <path d="M159 214 L195 214 M205 214 L241 214" stroke="#fff" strokeWidth="3" opacity=".8" />
          <rect x="188" y="150" width="24" height="16" rx="6" fill={SKIN} />

          {/* Head (with a slow look around) */}
          <Box component="g" sx={{ ...origin('50% 90%'), animation: `${look} 5s ease-in-out 1.6s infinite`, ...still }}>
            <circle cx="200" cy="124" r="28" fill={SKIN} />
            <path d="M174 118 C176 104 186 98 200 98 C214 98 224 104 226 118 C218 112 210 110 200 110 C190 110 182 112 174 118 Z" fill="#7A4A2A" />
            <path d="M186 124 L194 122 M206 122 L214 124" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="190" cy="131" r="3" fill={INK} />
            <circle cx="210" cy="131" r="3" fill={INK} />
            <path d="M193 143 C197 140 203 140 207 143" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
            {/* Hard hat with head lamp */}
            <path d="M168 110 C168 84 182 72 200 72 C218 72 232 84 232 110 Z" fill={AMBER} />
            <rect x="162" y="106" width="76" height="9" rx="4.5" fill={AMBER_DARK} />
            <path d="M200 74 L200 106" stroke={AMBER_DARK} strokeWidth="4" opacity=".55" />
            <Box component="circle" cx="200" cy="92" r="20" fill="#FEF3C7" sx={{ animation: `${glow} 1.8s ease-in-out 1.2s infinite`, opacity: 0.25, ...still }} />
            <circle cx="200" cy="92" r="10" fill={NAVY} />
            <circle cx="200" cy="92" r="6.5" fill="#fff" />
          </Box>
        </Box>
      </g>

      {/* Speech bubble */}
      <Box component="g" sx={{ ...origin('0% 100%'), animation: `${pop} .55s cubic-bezier(.2,.8,.2,1) 1.05s both`, ...still }}>
        <path d="M250 18 H364 C376 18 384 26 384 38 V66 C384 78 376 86 364 86 H268 L246 104 L252 86 C240 86 232 78 232 66 V38 C232 26 240 18 250 18 Z" fill={NAVY} />
        <text x="308" y="58" textAnchor="middle" fill="#fff" fontSize="19" fontWeight="800" fontFamily="inherit">{bubble}</text>
      </Box>
    </Box>
  )
}

export function NotFoundPage() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user } = useAuth()
  const forbidden = pathname === '/403'
  const home = user ? homeByRole[user.role] : '/'
  const enter = (delay: number) => ({ animation: `${fadeUp} .7s cubic-bezier(.2,.8,.2,1) ${delay}ms both`, ...still })

  return (
    <Box component="main" sx={{ minHeight: '100vh', bgcolor: 'var(--icep-page)', display: 'grid', placeItems: 'center', px: 2, py: 5 }}>
      <Box sx={{ width: '100%', maxWidth: 560, textAlign: 'center' }}>
        <Illustration bubble={forbidden ? 'No entry' : 'Nothing here'} />

        <Typography sx={{ mt: 3, fontSize: 13, fontWeight: 700, letterSpacing: '.12em', color: 'primary.main', ...enter(500) }}>
          {forbidden ? 'ERROR 403' : 'ERROR 404'}
        </Typography>
        <Typography component="h1" sx={{ fontSize: { xs: 26, md: 32 }, fontWeight: 750, color: 'var(--icep-heading)', mt: 0.5, ...enter(600) }}>
          {forbidden ? "You don't have access to this page" : 'Page not found'}
        </Typography>
        <Typography sx={{ color: 'text.secondary', mt: 1, maxWidth: 440, mx: 'auto', ...enter(700) }}>
          {forbidden
            ? 'This area is for a different role. If you think you should have access, contact your ICEP administrator.'
            : "We dug around but couldn't find the page you're looking for. It may have been moved, or the link may be wrong."}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap', mt: 3.5, ...enter(800) }}>
          <Button appearance="secondary" startIcon={<ArrowLeft size={18} />} onClick={() => navigate(-1)}>Go back</Button>
          <Button startIcon={user ? <LayoutDashboard size={18} /> : <House size={18} />} onClick={() => navigate(home)}>
            {user ? 'Go to dashboard' : 'Go to home'}
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

export default NotFoundPage
