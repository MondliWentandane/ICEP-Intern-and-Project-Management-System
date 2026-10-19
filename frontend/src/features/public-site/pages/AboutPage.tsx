import { Box, Container, Link, Typography } from '@mui/material'

/**
 * Location: frontend/src/features/public-site/pages/AboutPage.tsx (route /about already exists in routes/router.tsx)
 * Styling comes from the MUI theme (palette via sx) as described in ICEP_FRONTEND_STYLING_GUIDE.md.
 * Replaces the scaffold version (<PageScaffold title="About ICEP" />). Exports both the named
 * and default AboutPage so the existing router import keeps working.
 * Set VIDEO_URL to the ICEP YouTube video.
 */

const VIDEO_URL = 'https://www.youtube.com/watch?v=_91tr1Rgg0A' // TODO: replace with the ICEP video link

const INTRO =
  "ICEP is a Informatics Community Engagement Programme initiated by the informatics department of TUT. " +
  "initial was engendered to, amongst other objectives, assist students,who've completed all of their theoretical " +
  "modules, obtain an internship.The internship exposes said students toindustry experiences and operations."

const PARAGRAPHS: string[] = [
  'There, they are both educated apropos of the latest in industry technologies, tools, methodologies, frameworks, and systems; but also, in the internalisation and application of technical, interpersonal, and conceptual knowledge.',
  'Additionally, ICEP aims to improve the conditions of townships through the implementation and continual support of I.T solutions This aspect both proliferating upon the state-of-living for residents; but, also facilitating the creation of entities to continue constructive social and commercial operations.',
  'Moreover, ICEP assists the university by providing rapid system solutions to aid with impediments ebbing productivity.\nThis is performed through implementation of a well-structured system of operations and established business rules.',
]

function PlayIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 8 5.5z" fill="currentColor" />
    </svg>
  )
}

function VideoCard() {
  return (
    <Link
      href={VIDEO_URL}
      target="_blank"
      rel="noopener noreferrer"
      underline="none"
      aria-label="Watch the ICEP video on YouTube"
      sx={{
        position: 'relative', display: 'block', borderRadius: 4, overflow: 'hidden', color: '#fff',
        aspectRatio: '16 / 9', minHeight: 280,
        background: 'linear-gradient(180deg, #1B3A5C 0%, #12283F 55%, #0F1A2B 100%)',
      }}
    >
      {/* channel header */}
      <Box sx={{ position: 'absolute', top: 20, left: 20, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{
          width: 44, height: 44, borderRadius: '50%', bgcolor: 'rgba(255,255,255,.18)',
          border: '1px solid rgba(255,255,255,.35)', display: 'grid', placeItems: 'center',
          fontWeight: 700, fontSize: 14,
        }}>
          IC
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: 20, lineHeight: 1.2 }}>icep</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,.8)', fontSize: 15 }}>Norman Ramadalo</Typography>
        </Box>
      </Box>

      {/* faint screen illustration */}
      <Box aria-hidden sx={{
        position: 'absolute', left: '50%', bottom: '14%', transform: 'translateX(-50%)',
        width: '52%', height: '36%', borderRadius: 3, border: '10px solid rgba(255,255,255,.07)',
      }} />
      <Box aria-hidden sx={{
        position: 'absolute', left: '53%', bottom: '8%', transform: 'translateX(-50%)',
        width: '36%', height: '26%', borderRadius: 2, border: '10px solid rgba(255,255,255,.07)',
        bgcolor: 'rgba(15,26,43,.6)',
      }} />

      {/* play button */}
      <Box sx={{
        position: 'absolute', left: '50%', top: '53%', transform: 'translate(-50%, -50%)',
        width: 80, height: 80, borderRadius: '50%', bgcolor: '#fff', color: 'primary.main',
        display: 'grid', placeItems: 'center', pl: 0.5,
        transition: 'transform .15s ease',
        'a:hover &': { transform: 'translate(-50%, -50%) scale(1.06)' },
      }}>
        <PlayIcon />
      </Box>

      <Box sx={{
        position: 'absolute', right: 20, bottom: 20, bgcolor: '#0F1A2B', color: '#fff',
        borderRadius: 999, px: 2.5, py: 1.25, fontWeight: 600, fontSize: 15,
      }}>
        Watch on YouTube
      </Box>
    </Link>
  )
}

export function AboutPage() {
  return (
    <Box component="section" sx={{ color: 'text.primary' }}>
      <Container maxWidth="lg" sx={{ pt: { xs: 5, md: 8 }, pb: { xs: 6, md: 10 } }}>
        <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
          <Typography component="h1" sx={{ fontSize: { xs: 32, md: 44 }, fontWeight: 700 }}>About us</Typography>
          <Box aria-hidden sx={{ width: 56, height: 4, borderRadius: 2, bgcolor: 'primary.main', mx: 'auto', mt: 2, mb: 4 }} />
          <Typography sx={{ color: 'text.secondary', fontSize: { xs: 16, md: 20 }, lineHeight: 1.9, maxWidth: 820, mx: 'auto' }}>
            {INTRO}
          </Typography>
        </Box>

        <Box sx={{
          display: 'grid', gap: { xs: 4, md: 8 }, alignItems: 'start',
          gridTemplateColumns: { xs: '1fr', md: '0.9fr 1.1fr' },
        }}>
          <Box sx={{ display: 'grid', gap: 3 }}>
            {PARAGRAPHS.map((p) => (
              <Typography key={p} sx={{ color: 'text.primary', fontSize: { xs: 16, md: 18 }, lineHeight: 1.85, whiteSpace: 'pre-line' }}>
                {p}
              </Typography>
            ))}
          </Box>
          <VideoCard />
        </Box>
      </Container>
    </Box>
  )
}

export default AboutPage