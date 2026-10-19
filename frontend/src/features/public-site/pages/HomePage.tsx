import type { ReactNode } from 'react'
import { Box, Link, Paper, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Building2, Code, UsersRound } from 'lucide-react'
import { Link as RouterLink } from 'react-router-dom'
import { FloatingApply } from '../components/FloatingApply'
import { LinkButton } from '../components/LinkButton'
import { HowItWorksSteps } from '../story/HowItWorksSteps'
import { CursorFollower } from '../story/CursorFollower'
import { CountUp, HeroWaves } from '../story/HeroMotion'
import { floatSx, introSx, useScrollVar } from '../story/motion'
import { RevealTitle, ScrollStatement } from '../story/Reveal'
import { riseSx, seg, useReveal } from '../story/useScrollProgress'
import { ScrollStory } from '../story/ScrollStory'
import { CategoryIcon } from '../components/PositionBits'
import { fetchPositions, positionCategories, type PositionCategory } from '../data/positions'

const shell = { maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, boxSizing: 'border-box' } as const
const navy = '#1E3A5F'

const steps = [
  { title: 'Personal details', text: 'Tell us who you are and how to reach you.' },
  { title: 'Your studies', text: 'Add your qualification, year of study and skills.' },
  { title: 'Supporting documents', text: 'Upload your CV, ID and academic record.' },
  { title: 'Review & submit', text: 'Check your details, submit and track your application.' },
]

const areaCopy: Record<PositionCategory, string> = {
  'Software Development': 'Build web and mobile applications with modern frameworks, front end to back end.',
  Cybersecurity: 'Protect systems and data through security monitoring, testing and best practice.',
  'Systems Engineering': 'Design, run and support the networks and IT infrastructure that keep services running.',
}

const pillars = [
  { icon: <Code size={20} />, title: 'Industry-ready skills', text: 'Interns learn the latest industry technologies, tools, methodologies and frameworks, and apply technical and interpersonal knowledge.' },
  { icon: <UsersRound size={20} />, title: 'Community upliftment', text: 'Improving conditions in townships through the implementation and continued support of IT solutions for residents and local businesses.' },
  { icon: <Building2 size={20} />, title: 'University support', text: 'Rapid system solutions that remove obstacles to productivity, built on well-structured operations and clear business rules.' },
]

const cardSx = { p: 3, borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider' } as const

function SectionTitle({ id, title, subtitle, align = 'center' }: { id: string; title: string; subtitle: string; align?: 'center' | 'left' }) {
  return (
    <Box sx={{ textAlign: align, mb: 4 }}>
      <RevealTitle id={id} text={title} sx={{ fontSize: { xs: 24, md: 28 }, fontWeight: 750 }} />
      <Typography sx={{ color: 'text.secondary', mt: 0.5 }}>{subtitle}</Typography>
    </Box>
  )
}

function HeroStat({ value, label, delay }: { value: ReactNode; label: string; delay: number }) {
  return (
    <Box sx={{ ...introSx(delay), p: 2.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.14)' }}>
      <Typography sx={{ color: '#fff', fontSize: { xs: 24, md: 28 }, fontWeight: 750, lineHeight: 1.2 }}>{value}</Typography>
      <Typography sx={{ color: '#C2CCDA', fontSize: 13, mt: 0.5 }}>{label}</Typography>
    </Box>
  )
}

function AreaCards() {
  const { ref, p } = useReveal<HTMLDivElement>()
  return (
    <Box ref={ref} sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>
      {positionCategories.map((category, i) => (
        <Paper key={category} component="article" sx={{ ...cardSx, display: 'flex', flexDirection: 'column', ...riseSx(p, i) }}>
          <Box sx={{ transform: `rotate(${(1 - seg(p, i * 0.16 + 0.2, i * 0.16 + 0.6)) * -90}deg)`, alignSelf: 'flex-start' }}>
            <CategoryIcon category={category} />
          </Box>
          <Typography component="h3" sx={{ fontSize: 19, fontWeight: 700, mt: 2.5 }}>{category}</Typography>
          <Typography sx={{ color: 'text.secondary', mt: 0.75, mb: 2.5, flex: 1 }}>{areaCopy[category]}</Typography>
          <LinkButton to={`/careers?category=${encodeURIComponent(category)}`} appearance="secondary" fullWidth endIcon={<ArrowRight size={18} />} aria-label={`View ${category} positions`}>View positions</LinkButton>
        </Paper>
      ))}
    </Box>
  )
}

function PillarCards() {
  const { ref, p } = useReveal<HTMLDivElement>()
  return (
    <Box ref={ref} sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>
      {pillars.map((pillar, i) => (
        <Paper key={pillar.title} sx={{ ...cardSx, bgcolor: 'var(--icep-page)', ...riseSx(p, i) }}>
          <Box sx={{ width: 42, height: 42, display: 'grid', placeItems: 'center', borderRadius: 2, bgcolor: '#E4EBF5', color: 'primary.main' }}>{pillar.icon}</Box>
          <Typography component="h3" sx={{ fontWeight: 700, mt: 2 }}>{pillar.title}</Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.75, lineHeight: 1.6 }}>{pillar.text}</Typography>
        </Paper>
      ))}
    </Box>
  )
}

/** "Apply now" prompt under How it works, rising in once the steps have been read. */
function ApplyPrompt() {
  const { ref, p } = useReveal<HTMLDivElement>(0.95, 0.85)
  return (
    <Box ref={ref} sx={{ mt: { xs: 4, md: 5 }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.25, textAlign: 'center', ...riseSx(p, 0, { length: 1, distance: 24 }) }}>
      <LinkButton to="/?apply=choose" endIcon={<ArrowRight size={18} />} sx={{ minHeight: 48, px: 4, fontSize: 16 }}>Apply now</LinkButton>
      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
        Have your CV, ID and academic record ready. Already applied? <Link component={RouterLink} to="/track" sx={{ fontWeight: 600 }}>Track your application</Link>
      </Typography>
    </Box>
  )
}

/** Call-to-action band that grows from an inset card to full width as it scrolls in. */
function CtaBand() {
  const { ref, p } = useReveal<HTMLDivElement>(0.95, 0.75)
  const s = seg(p, 0, 0.7)
  return (
    <Box ref={ref} sx={{
      p: { xs: 3, md: 5 }, bgcolor: navy, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 3, flexWrap: 'wrap',
      borderRadius: `${12 + (1 - s) * 28}px`, transform: `scale(${0.9 + 0.1 * s})`, opacity: 0.3 + 0.7 * s,
    }}>
      <Box>
        <RevealTitle id="cta-title" text="Ready to start your WIL placement?" sx={{ fontSize: { xs: 22, md: 26 }, fontWeight: 750 }} />
        <Typography sx={{ color: '#D7DFE9', mt: 0.5, ...riseSx(p, 2, { distance: 16 }) }}>Browse open positions and apply online in four simple steps.</Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', ...riseSx(p, 3, { distance: 16 }) }}>
        <LinkButton to="/?apply=choose" sx={heroButton(true)}>Apply now</LinkButton>
        <LinkButton to="/contact" appearance="secondary" sx={heroButton(false)}>Contact us</LinkButton>
      </Box>
    </Box>
  )
}

const heroButton = (filled: boolean) => ({
  minHeight: 46, px: 3, fontWeight: 600, borderRadius: 2,
  ...(filled
    ? { bgcolor: '#fff', color: 'primary.main', border: '1px solid #fff', '&:hover': { bgcolor: '#EEF2F8' } }
    : { bgcolor: 'transparent', color: '#fff', borderColor: 'rgba(255,255,255,.6)', '&:hover': { bgcolor: 'rgba(255,255,255,.08)', borderColor: '#fff' } }),
})

export function HomePage() {
  const { data: positions = [] } = useQuery({ queryKey: ['public', 'positions'], queryFn: fetchPositions })
  const campusCount = new Set(positions.map((position) => position.campus)).size
  const heroRef = useScrollVar<HTMLElement>()

  return (
    <>
      {/* Hero */}
      <Box ref={heroRef} component="section" aria-labelledby="hero-title" sx={{ position: 'relative', overflow: 'hidden', bgcolor: navy, color: '#fff', '--hero-p': 0 }}>
        {/* Waves dissolve as you scroll: fade, soften and swell, gone by ~60% of the hero. */}
        <Box sx={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          opacity: 'calc(1 - var(--hero-p) * 1.7)', filter: 'blur(calc(var(--hero-p) * 10px))',
          transform: 'translateY(calc(var(--hero-p) * 140px)) scale(calc(1 + var(--hero-p) * 0.12))',
        }}><HeroWaves /></Box>
        <Box aria-hidden="true" sx={{ position: 'absolute', width: 420, height: 420, borderRadius: '50%', right: -120, top: -160, bgcolor: 'rgba(255,255,255,.04)', opacity: 'calc(1 - var(--hero-p) * 1.5)', ...floatSx(18) }} />
        <Box aria-hidden="true" sx={{ position: 'absolute', width: 320, height: 320, borderRadius: '50%', left: '34%', bottom: -220, bgcolor: 'rgba(255,255,255,.04)', opacity: 'calc(1 - var(--hero-p) * 1.5)', ...floatSx(22, -6) }} />
        <Box sx={{ ...shell, position: 'relative', py: { xs: 6, md: 10 }, display: 'grid', gap: 5, gridTemplateColumns: { xs: '1fr', md: '1.15fr 1fr' }, alignItems: 'center' }}>
          <Box sx={{ transform: 'translateY(calc(var(--hero-p) * 90px))', opacity: 'calc(1 - var(--hero-p) * 0.8)' }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: '#D7DFE9', ...introSx(0) }}>TUT · Work-integrated learning</Typography>
            <RevealTitle id="hero-title" component="h1" text="Real-world experience starts with ICEP" delay={150} sx={{ fontSize: { xs: 32, md: 44 }, fontWeight: 750, lineHeight: 1.15, mt: 1 }} />
            <Typography sx={{ color: '#D7DFE9', mt: 2.5, maxWidth: 560, lineHeight: 1.6, ...introSx(550) }}>
              ICEP places TUT informatics students in work-integrated learning internships, building industry skills while supporting communities with IT solutions.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 3.5, ...introSx(700) }}>
              <LinkButton to="/?apply=choose" sx={heroButton(true)} endIcon={<ArrowRight size={18} />}>Apply now</LinkButton>
              <LinkButton to="/careers" appearance="secondary" sx={heroButton(false)}>Browse positions</LinkButton>
            </Box>
            <Typography sx={{ color: '#D7DFE9', fontSize: 14, mt: 2.5, ...introSx(850) }}>
              Already applied? <Link component={RouterLink} to="/track" underline="always" sx={{ color: '#fff', fontWeight: 600 }}>Track your application</Link>
              <Box component="span" sx={{ mx: 1, opacity: 0.5 }}>·</Box>
              <Link component={RouterLink} to="/about" underline="always" sx={{ color: '#fff', fontWeight: 600 }}>Learn about ICEP</Link>
            </Typography>
          </Box>
          <Box sx={{ transform: 'translateY(calc(var(--hero-p) * 30px))', opacity: 'calc(1 - var(--hero-p) * 1.2)', display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr' }}>
            <HeroStat delay={500} value={<CountUp to={positionCategories.length} delay={700} />} label="Programme areas" />
            <HeroStat delay={620} value="Weekly" label="Mentor reviews of your work" />
            <HeroStat delay={740} value={campusCount ? <CountUp to={campusCount} delay={900} /> : '—'} label="Campuses" />
            <HeroStat delay={860} value={<><CountUp to={12} delay={1000} /> months</>} label="Placement length" />
          </Box>
        </Box>
      </Box>

      <ScrollStory />

      {/* How it works */}
      <Box component="section" aria-labelledby="how-title" sx={{ ...shell, py: { xs: 6, md: 8 } }}>
        <SectionTitle id="how-title" title="How it works" subtitle="Apply online in four simple steps." />
        <HowItWorksSteps steps={steps} />
        <ApplyPrompt />

        {/* Programme areas */}
        <Box component="section" aria-labelledby="areas-title" sx={{ mt: { xs: 7, md: 9 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
            <SectionTitle id="areas-title" title="Programme areas" subtitle="Choose an area to see its open 12-month WIL positions." align="left" />
            <Link component={RouterLink} to="/careers" underline="hover" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, fontWeight: 600, mt: 1 }}>View all positions <ArrowRight size={18} /></Link>
          </Box>
          <AreaCards />
        </Box>
      </Box>

      {/* What ICEP does */}
      <Box component="section" aria-labelledby="does-title" sx={{ bgcolor: '#fff', borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ ...shell, py: { xs: 6, md: 8 } }}>
          <SectionTitle id="does-title" title="What ICEP does" subtitle="The Informatics Community Engagement Programme, initiated by the Informatics department at TUT." />
          <ScrollStatement
            text="We grow industry-ready interns, bring working IT solutions to townships and local businesses, and help the university run better."
            sx={{ maxWidth: 900, mx: 'auto', mb: { xs: 5, md: 7 }, textAlign: 'center', fontSize: { xs: 24, md: 38 }, fontWeight: 700, lineHeight: 1.3, letterSpacing: '-.01em', color: 'primary.main' }}
          />
          <PillarCards />
        </Box>
      </Box>

      {/* Call to action */}
      <Box component="section" aria-labelledby="cta-title" sx={{ ...shell, py: { xs: 6, md: 8 } }}>
        <CtaBand />
      </Box>

      <FloatingApply startId="hero-title" endId="cta-title" />
      <CursorFollower />
    </>
  )
}

export default HomePage
