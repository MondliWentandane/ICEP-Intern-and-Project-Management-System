import { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Container, Link, Typography, useMediaQuery } from '@mui/material'

/**
 * Location: frontend/src/features/public-site/pages/AboutPage.tsx (route /about already exists in routes/router.tsx)
 * Styling comes from the MUI theme (palette via sx) as described in ICEP_FRONTEND_STYLING_GUIDE.md.
 * Replaces the scaffold version (<PageScaffold title="About ICEP" />). Exports both the named
 * and default AboutPage so the existing router import keeps working.
 * The video is embedded from VIDEO_URL (any normal YouTube link works).
 */

const VIDEO_URL = 'https://www.youtube.com/watch?v=_91tr1Rgg0A'

const INTRO =
  "ICEP is an Informatics Community Engagement Programme initiated by the Informatics Department of TUT. " +
  "It was engendered to, amongst other objectives, assist students who've completed all of their theoretical " +
  "modules to obtain an internship. The internship exposes said students to industry experiences and operations."

const PARAGRAPHS: string[] = [
  'There, they are both educated apropos of the latest in industry technologies, tools, methodologies, frameworks, and systems; but also, in the internalisation and application of technical, interpersonal, and conceptual knowledge.',
  'Additionally, ICEP aims to improve the conditions of townships through the implementation and continual support of I.T solutions. This aspect both proliferating upon the state-of-living for residents; but, also facilitating the creation of entities to continue constructive social and commercial operations.',
  'Moreover, ICEP assists the university by providing rapid system solutions to aid with impediments ebbing productivity.\nThis is performed through implementation of a well-structured system of operations and established business rules.',
]

/** Accepts watch?v=, youtu.be/, /embed/ and /shorts/ links and returns the video id. */
function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') return u.pathname.slice(1) || null
    const v = u.searchParams.get('v')
    if (v) return v
    const m = u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{6,})/)
    return m ? m[1] : null
  } catch {
    return null
  }
}

const VIDEO_ID = getYouTubeId(VIDEO_URL)

const INTRO_FONT = { xs: 21, sm: 25, md: 31 } // first paragraph (typed)
const BODY_FONT = { xs: 18, sm: 21, md: 24 } // all other paragraphs

function VideoCard() {
  return (
    <Box>
      <Box sx={{
        position: 'relative', borderRadius: 4, overflow: 'hidden', aspectRatio: '16 / 9', minHeight: 220,
        bgcolor: '#0F1A2B', boxShadow: '0 1px 3px rgba(16,24,40,.12)',
      }}>
        {VIDEO_ID ? (
          <Box
            component="iframe"
            src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?rel=0`}
            title="ICEP video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
          />
        ) : (
          <Typography sx={{ color: '#fff', p: 3 }}>The video link is not valid.</Typography>
        )}
      </Box>
      <Typography sx={{ mt: 1.5, fontSize: 14, color: 'text.secondary' }}>
        Video not loading?{' '}
        <Link href={VIDEO_URL} target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 600 }}>
          Watch on YouTube
        </Link>
      </Typography>
    </Box>
  )
}

/* ---------- scroll reveal ---------- */

const GREYED = 0.22 // how faint a word is before it is revealed (1 = full colour)

/**
 * Words start greyed out and turn to full colour as you scroll down to them
 * (anything already inside the visible frame colours in straight away).
 * Scrolling back up greys them out again.
 */
function ScrollRevealText({ text }: { text: string }) {
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const items = useMemo(() => {
    let n = 0
    return text
      .split(/(\s+)/)
      .filter(Boolean)
      .map((t) => ({ t, idx: /^\s+$/.test(t) ? -1 : n++ }))
  }, [text])
  const wordCount = useMemo(() => items.filter((x) => x.idx >= 0).length, [items])
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([])
  const [lit, setLit] = useState({ from: 0, to: 0 }) // words before `to` are revealed

  useEffect(() => {
    if (reduceMotion) return // everything is shown straight away (see `on` below)
    let raf = 0
    const update = () => {
      raf = 0
      const limit = window.innerHeight * 0.85 // "end of the frame"
      let count = 0
      for (let i = 0; i < wordCount; i++) {
        const el = wordRefs.current[i]
        if (!el || el.getBoundingClientRect().top >= limit) break
        count = i + 1
      }
      setLit((prev) =>
        count === prev.to ? prev : { from: count > prev.to ? prev.to : count, to: count },
      )
    }
    const schedule = () => {
      if (!raf) raf = window.requestAnimationFrame(update)
    }
    schedule()
    window.addEventListener('scroll', schedule, true) // capture: also works if the page scrolls inside a container
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule, true)
      window.removeEventListener('resize', schedule)
      if (raf) window.cancelAnimationFrame(raf)
    }
  }, [reduceMotion, wordCount])

  return (
    <>
      {items.map(({ t, idx }, k) => {
        if (idx < 0) return t // whitespace / line breaks
        const on = reduceMotion || idx < lit.to
        return (
          <span
            key={k}
            ref={(el) => { wordRefs.current[idx] = el }}
            style={{
              opacity: on ? 1 : GREYED,
              transition: reduceMotion ? 'none' : 'opacity .45s ease',
              transitionDelay: on && !reduceMotion ? `${Math.min(Math.max(idx - lit.from, 0) * 14, 700)}ms` : '0ms',
            }}
          >
            {t}
          </span>
        )
      })}
    </>
  )
}

/* ---------- typing effect (first paragraph only) ---------- */

// Types `text` once when the page opens. Shows it all at once if the user prefers reduced motion.
function useTypewriter(text: string) {
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [chars, setChars] = useState(0)
  const done = chars >= text.length

  useEffect(() => {
    if (reduceMotion || done) return
    const prev = text[chars - 1]
    const delay = chars === 0 ? 500 : /[.,;]/.test(prev) ? 120 : 12 + Math.random() * 18
    const id = window.setTimeout(() => setChars((c) => c + 1), delay)
    return () => window.clearTimeout(id)
  }, [chars, done, reduceMotion, text])

  return reduceMotion ? text.length : Math.min(chars, text.length)
}

const srOnly = {
  position: 'absolute', width: 1, height: 1, p: 0, m: -1, overflow: 'hidden',
  clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0,
} as const

// Typed part + blinking cursor + an invisible copy of the rest, so the layout never jumps while typing.
function TypedText({ text }: { text: string }) {
  const visible = useTypewriter(text)
  const done = visible >= text.length
  return (
    <>
      <Box component="span" sx={srOnly}>{text}</Box>
      <span aria-hidden="true">
        {text.slice(0, visible)}
        {!done && (
          <Box
            component="span"
            sx={{
              display: 'inline-block', width: 2, height: '1em', bgcolor: 'primary.main',
              ml: '2px', verticalAlign: 'text-bottom',
              animation: 'blink 1s steps(1) infinite',
              '@keyframes blink': { '50%': { opacity: 0 } },
            }}
          />
        )}
        <span style={{ visibility: 'hidden' }}>{text.slice(visible)}</span>
      </span>
    </>
  )
}

export function AboutPage() {
  return (
    <Box component="section" sx={{ color: 'text.primary' }}>
      <Container maxWidth="lg" sx={{ pb: { xs: 6, md: 10 } }}>
        {/* First screen: only the heading and the typed first paragraph */}
        <Box sx={{
          minHeight: 'calc(100vh - 90px)', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', textAlign: 'center', py: 4,
        }}>
          <Typography component="h1" sx={{ fontSize: { xs: 34, md: 48 }, fontWeight: 700 }}>About us</Typography>
          <Box aria-hidden sx={{ width: 56, height: 4, borderRadius: 2, bgcolor: 'primary.main', mt: 2, mb: { xs: 3, md: 5 } }} />
          <Typography sx={{ color: 'text.primary', fontSize: INTRO_FONT, lineHeight: 1.7, maxWidth: 1000 }}>
            <TypedText text={INTRO} />
          </Typography>
        </Box>

        {/* Below the fold: greyed out until you scroll to them */}
        <Box sx={{
          display: 'grid', gap: { xs: 4, md: 8 }, alignItems: 'start', pt: { xs: 4, md: 8 },
          gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' },
        }}>
          <Box sx={{ display: 'grid', gap: { xs: 3, md: 4 } }}>
            {PARAGRAPHS.map((p) => (
              <Typography key={p} sx={{ color: 'text.primary', fontSize: BODY_FONT, lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                <ScrollRevealText text={p} />
              </Typography>
            ))}
          </Box>
          <Box sx={{ position: { md: 'sticky' }, top: { md: 100 } }}>
            <VideoCard />
          </Box>
        </Box>
      </Container>
    </Box>
  )
}

export default AboutPage