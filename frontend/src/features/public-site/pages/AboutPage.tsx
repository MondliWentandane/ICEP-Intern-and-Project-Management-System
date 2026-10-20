import { Box, Link, Paper, Typography, type SxProps, type Theme } from '@mui/material'
import { Building2, Code, UsersRound } from 'lucide-react'
import { LinkButton } from '../components/LinkButton'
import { riseSx, useReveal } from '../story/useScrollProgress'

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

const pillars = [
  {
    icon: <Code size={20} />,
    title: 'Industry-ready skills',
    text: PARAGRAPHS[0],
  },
  {
    icon: <UsersRound size={20} />,
    title: 'Community upliftment',
    text: PARAGRAPHS[1],
  },
  {
    icon: <Building2 size={20} />,
    title: 'University support',
    text: PARAGRAPHS[2],
  },
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

function VideoCard({ sx }: { sx?: SxProps<Theme> }) {
  return (
    <Box
      sx={[
        {
          width: '100%',
          maxWidth: 680,
          mx: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          borderRadius: 3,
          overflow: 'hidden',
          aspectRatio: '16 / 9',
          minHeight: { xs: 220, sm: 280, md: 320 },
          bgcolor: '#0F1A2B',
          boxShadow: '0 8px 30px rgba(15,26,43,0.12)',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
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
      <Typography sx={{ mt: 1.5, fontSize: 13, color: 'text.secondary', textAlign: 'center' }}>
        Video not loading?{' '}
        <Link href={VIDEO_URL} target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 600 }}>
          Watch on YouTube
        </Link>
      </Typography>
    </Box>
  )
}

function MissionAndVideoSection() {
  const { ref, p } = useReveal<HTMLDivElement>(0.92, 0.65)

  return (
    <Box
      ref={ref}
      component="section"
      aria-label="ICEP mission and video"
      sx={{
        display: 'grid',
        gap: { xs: 4, md: 5 },
        alignItems: 'center',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1.15fr' },
      }}
    >
      {/* Text cards next to the video, revealing one after the other when scrolling downwards */}
      <Box sx={{ display: 'grid', gap: 2.5 }}>
        {pillars.map((pillar, i) => (
          <Paper
            key={pillar.title}
            component="article"
            sx={{
              p: 2.5,
              borderRadius: 3,
              boxShadow: 'none',
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: '#fff',
              display: 'flex',
              flexDirection: 'column',
              ...riseSx(p, i, { step: 0.14, length: 0.45, distance: 28 }),
              transition: 'opacity 0.25s ease-out, transform 0.25s ease-out',
              '@media (prefers-reduced-motion: reduce)': {
                transition: 'none',
                transform: 'none',
                opacity: 1,
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.25 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: '#E4EBF5',
                  color: 'primary.main',
                }}
              >
                {pillar.icon}
              </Box>
              <Typography component="h3" sx={{ fontWeight: 700, fontSize: 16 }}>
                {pillar.title}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 14, color: 'text.secondary', lineHeight: 1.65, whiteSpace: 'pre-line' }}>
              {pillar.text}
            </Typography>
          </Paper>
        ))}
      </Box>

      {/* Larger embedded video frame in the centre, sliding and fading in when scrolling downwards */}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <VideoCard
          sx={{
            ...riseSx(p, 0, { length: 0.55, distance: 36 }),
            transition: 'opacity 0.25s ease-out, transform 0.25s ease-out',
            '@media (prefers-reduced-motion: reduce)': {
              transition: 'none',
              transform: 'none',
              opacity: 1,
            },
          }}
        />
      </Box>
    </Box>
  )
}

export function AboutPage() {
  return (
    <Box sx={{ display: 'grid', gap: 4 }}>
      {/* Header section with zero extra gap and clean subheading */}
      <Paper
        component="section"
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: 3,
          boxShadow: 'none',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: '#fff',
        }}
      >
        <Typography
          sx={{
            color: 'primary.main',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '.04em',
            textTransform: 'uppercase',
          }}
        >
          TUT · Informatics Community Engagement Programme
        </Typography>
        <Typography component="h1" sx={{ fontSize: { xs: 28, md: 34 }, fontWeight: 750, mt: 0.5 }}>
          About us
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: { xs: 15, md: 17 }, lineHeight: 1.7, mt: 1.5, maxWidth: 960 }}>
          {INTRO}
        </Typography>
      </Paper>

      {/* Mission cards and animated video frame */}
      <MissionAndVideoSection />

      {/* Bottom CTA block consistent with Home page */}
      <Paper
        component="aside"
        aria-label="Explore ICEP careers"
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 3,
          boxShadow: 'none',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box>
          <Typography component="h2" sx={{ fontWeight: 700, fontSize: 18 }}>
            Ready to start your WIL placement?
          </Typography>
          <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 0.5 }}>
            Explore open opportunities across TUT campuses and apply online.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <LinkButton to="/careers">Browse positions</LinkButton>
          <LinkButton to="/contact" appearance="secondary">
            Contact us
          </LinkButton>
        </Box>
      </Paper>
    </Box>
  )
}

export default AboutPage