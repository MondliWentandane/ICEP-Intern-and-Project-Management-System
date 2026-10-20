import type { ComponentType } from 'react'
import { Box, Typography, useMediaQuery } from '@mui/material'
import { ArrowRight } from 'lucide-react'
import { LinkButton } from '../components/LinkButton'
import { ApplyScene, BuildScene, DiscoverScene, GraduateScene, GrowScene, TrackScene } from './StoryScenes'
import { usePrefersReducedMotion, useScrollStory } from './useScrollProgress'

const shell = { maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, boxSizing: 'border-box' } as const
const HEADER = 72
// Phone layout: the pinned window ends ~410px below the header; chapter text sticks just under it.
const MOBILE_TEXT_TOP = HEADER + 426

const chapters: Array<{ eyebrow: string; title: string; text: string; Scene: ComponentType<{ t: number }> }> = [
  { eyebrow: 'Discover', title: 'Find your area', text: 'Explore open 12-month WIL positions in Software Development, Cybersecurity and Systems Engineering across TUT campuses.', Scene: DiscoverScene },
  { eyebrow: 'Apply', title: 'Apply in four simple steps', text: 'Add your personal details, studies and supporting documents online. No paperwork and no queues.', Scene: ApplyScene },
  { eyebrow: 'Track', title: 'Always know where you stand', text: 'Follow your application from submission through screening and interview to an offer.', Scene: TrackScene },
  { eyebrow: 'Build', title: 'Build real projects in a team', text: 'Join a project team and deliver working IT solutions for communities, local businesses and the university.', Scene: BuildScene },
  { eyebrow: 'Grow', title: 'Grow with weekly mentor reviews', text: 'Mentors review your work every week, so your technical and interpersonal skills keep improving.', Scene: GrowScene },
  { eyebrow: 'Graduate', title: 'Leave industry-ready', text: 'Finish with a year of real-world experience, delivered projects and the confidence to start your career.', Scene: GraduateScene },
]

/**
 * Scroll-driven story of an intern's journey through ICEP. Chapters scroll past
 * on one side while a pinned "app window" plays the matching scene, animated by
 * how far the reader is through that chapter.
 */
export function ScrollStory() {
  const desktop = useMediaQuery('(min-width:900px)')
  const reducedMotion = usePrefersReducedMotion()
  // On phones the pinned window covers the top of the screen, so read chapters lower down.
  const { active, t, register } = useScrollStory(chapters.length, desktop ? 0.5 : 0.7)
  const motion = reducedMotion ? 'none' : 'opacity .5s cubic-bezier(.2,.8,.2,1), transform .5s cubic-bezier(.2,.8,.2,1)'

  return (
    <Box component="section" aria-labelledby="story-title" sx={{ bgcolor: 'var(--icep-page)' }}>
      <Box sx={{ ...shell, pt: { xs: 6, md: 9 }, textAlign: { xs: 'left', md: 'center' } }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: 'primary.main' }}>Your ICEP journey</Typography>
        <Typography id="story-title" component="h2" sx={{ fontSize: { xs: 26, md: 34 }, fontWeight: 750, mt: 0.5 }}>From application to industry-ready</Typography>
        <Typography sx={{ color: 'text.secondary', mt: 0.75 }}>Scroll to follow an intern through the programme.</Typography>
      </Box>

      <Box sx={{ ...shell, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1.1fr' }, columnGap: 8, pb: { xs: 4, md: 6 } }}>
        {/* Pinned app window */}
        <Box aria-hidden="true" sx={{
          gridColumn: { md: 2 }, gridRow: { md: 1 }, alignSelf: 'start', position: 'sticky', zIndex: 2,
          top: { xs: HEADER, md: `max(${HEADER + 24}px, calc(50vh + ${HEADER / 2}px - 250px))` },
          py: { xs: 1.5, md: 0 }, bgcolor: { xs: 'var(--icep-page)', md: 'transparent' }, mt: { md: 6 },
        }}>
          <Box sx={{ borderRadius: 3, bgcolor: '#fff', border: '1px solid', borderColor: 'divider', boxShadow: '0 24px 60px rgba(26,32,44,.12)', overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, height: 40, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#F8FAFC' }}>
              {['#F87171', '#FBBF24', '#34D399'].map((color) => <Box key={color} sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />)}
              <Typography sx={{ ml: 1, fontSize: 12, color: 'text.secondary', flex: 1 }}>ICEP · {chapters[active].eyebrow}</Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'primary.main', fontVariantNumeric: 'tabular-nums' }}>
                {String(active + 1).padStart(2, '0')} / {String(chapters.length).padStart(2, '0')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5, px: 2, pt: 1.5 }}>
              {chapters.map((chapter, i) => (
                <Box key={chapter.eyebrow} sx={{ flex: 1, height: 3, borderRadius: 2, bgcolor: '#E4EBF5', overflow: 'hidden' }}>
                  <Box sx={{ height: '100%', bgcolor: 'primary.main', width: `${i < active ? 100 : i === active ? t * 100 : 0}%` }} />
                </Box>
              ))}
            </Box>
            <Box sx={{ position: 'relative', height: { xs: 330, md: 400 }, overflow: 'hidden' }}>
              {chapters.map(({ eyebrow, Scene }, i) => (
                <Box key={eyebrow} sx={{
                  position: 'absolute', inset: 0, p: { xs: 2, md: 3 },
                  opacity: i === active ? 1 : 0,
                  transform: i === active ? 'none' : `translateY(${i < active ? -28 : 28}px) scale(.98)`,
                  transition: motion, pointerEvents: 'none',
                }}>
                  <Scene t={i === active ? t : i < active ? 1 : 0} />
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        {/* Chapters */}
        <Box component="ol" sx={{ gridColumn: { md: 1 }, gridRow: { md: 1 }, listStyle: 'none', m: 0, p: 0 }}>
          {chapters.map((chapter, i) => (
            <Box component="li" key={chapter.eyebrow} ref={register(i)} sx={{
              minHeight: { xs: '70vh', md: '90vh' }, display: 'flex', alignItems: { xs: 'flex-start', md: 'center' }, pt: { xs: 4, md: 0 },
            }}>
              <Box sx={{ position: { xs: 'sticky', md: 'static' }, top: MOBILE_TEXT_TOP, maxWidth: 440, opacity: i === active ? 1 : 0.3, transition: reducedMotion ? 'none' : 'opacity .4s ease' }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'primary.main', fontVariantNumeric: 'tabular-nums' }}>
                  {String(i + 1).padStart(2, '0')} · {chapter.eyebrow}
                </Typography>
                <Typography component="h3" sx={{ fontSize: { xs: 24, md: 32 }, fontWeight: 750, lineHeight: 1.2, mt: 1 }}>{chapter.title}</Typography>
                <Typography sx={{ color: 'text.secondary', mt: 1.5, lineHeight: 1.65, fontSize: { md: 17 } }}>{chapter.text}</Typography>
                {chapter.eyebrow === 'Apply' && (
                  <LinkButton to="/?apply=choose" endIcon={<ArrowRight size={18} />} sx={{ mt: 3, minHeight: 46, px: 3 }}>Apply now</LinkButton>
                )}
                {i === chapters.length - 1 && (
                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 3 }}>
                    <LinkButton to="/?apply=choose" endIcon={<ArrowRight size={18} />} sx={{ minHeight: 46, px: 3 }}>Apply now</LinkButton>
                    <LinkButton to="/careers" appearance="secondary" sx={{ minHeight: 46, px: 3 }}>Browse positions</LinkButton>
                  </Box>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}
