import type { ReactNode } from 'react'
import { Box, Link, Paper, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Building2, Code, UsersRound } from 'lucide-react'
import { Link as RouterLink } from 'react-router-dom'
import { LinkButton } from '../components/LinkButton'
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
      <Typography id={id} component="h2" sx={{ fontSize: { xs: 24, md: 28 }, fontWeight: 750 }}>{title}</Typography>
      <Typography sx={{ color: 'text.secondary', mt: 0.5 }}>{subtitle}</Typography>
    </Box>
  )
}

function HeroStat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.14)' }}>
      <Typography sx={{ color: '#fff', fontSize: { xs: 24, md: 28 }, fontWeight: 750, lineHeight: 1.2 }}>{value}</Typography>
      <Typography sx={{ color: '#C2CCDA', fontSize: 13, mt: 0.5 }}>{label}</Typography>
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

  return (
    <>
      {/* Hero */}
      <Box component="section" aria-labelledby="hero-title" sx={{ position: 'relative', overflow: 'hidden', bgcolor: navy, color: '#fff' }}>
        <Box aria-hidden="true" sx={{ position: 'absolute', width: 420, height: 420, borderRadius: '50%', right: -120, top: -160, bgcolor: 'rgba(255,255,255,.04)' }} />
        <Box aria-hidden="true" sx={{ position: 'absolute', width: 320, height: 320, borderRadius: '50%', left: '34%', bottom: -220, bgcolor: 'rgba(255,255,255,.04)' }} />
        <Box sx={{ ...shell, position: 'relative', py: { xs: 6, md: 10 }, display: 'grid', gap: 5, gridTemplateColumns: { xs: '1fr', md: '1.15fr 1fr' }, alignItems: 'center' }}>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: '#D7DFE9' }}>TUT · Work-integrated learning</Typography>
            <Typography id="hero-title" component="h1" sx={{ fontSize: { xs: 32, md: 44 }, fontWeight: 750, lineHeight: 1.15, mt: 1 }}>Real-world experience starts with ICEP</Typography>
            <Typography sx={{ color: '#D7DFE9', mt: 2.5, maxWidth: 560, lineHeight: 1.6 }}>
              ICEP places TUT informatics students in work-integrated learning internships, building industry skills while supporting communities with IT solutions.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 3.5 }}>
              <LinkButton to="/careers" sx={heroButton(true)}>Browse positions</LinkButton>
              <LinkButton to="/about" appearance="secondary" sx={heroButton(false)}>Learn about ICEP</LinkButton>
            </Box>
            <Typography sx={{ color: '#D7DFE9', fontSize: 14, mt: 2.5 }}>
              Already applied? <Link component={RouterLink} to="/track" underline="always" sx={{ color: '#fff', fontWeight: 600 }}>Track your application</Link>
            </Typography>
          </Box>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr' }}>
            <HeroStat value={positionCategories.length} label="Programme areas" />
            <HeroStat value="Weekly" label="Mentor reviews of your work" />
            <HeroStat value={campusCount || '—'} label="Campuses" />
            <HeroStat value="12 months" label="Placement length" />
          </Box>
        </Box>
      </Box>

      {/* How it works */}
      <Box component="section" aria-labelledby="how-title" sx={{ ...shell, py: { xs: 6, md: 8 } }}>
        <SectionTitle id="how-title" title="How it works" subtitle="Apply online in four simple steps." />
        <Box component="ol" sx={{ listStyle: 'none', p: 0, m: 0, display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' } }}>
          {steps.map((step, index) => (
            <Paper component="li" key={step.title} sx={cardSx}>
              <Box sx={{ width: 32, height: 32, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: 'primary.main', color: '#fff', fontSize: 13, fontWeight: 700 }}>{index + 1}</Box>
              <Typography component="h3" sx={{ fontWeight: 700, mt: 2 }}>{step.title}</Typography>
              <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.5 }}>{step.text}</Typography>
            </Paper>
          ))}
        </Box>

        {/* Programme areas */}
        <Box component="section" aria-labelledby="areas-title" sx={{ mt: { xs: 7, md: 9 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
            <SectionTitle id="areas-title" title="Programme areas" subtitle="Choose an area to see its open 12-month WIL positions." align="left" />
            <Link component={RouterLink} to="/careers" underline="hover" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, fontWeight: 600, mt: 1 }}>View all positions <ArrowRight size={18} /></Link>
          </Box>
          <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>
            {positionCategories.map((category) => (
              <Paper key={category} component="article" sx={{ ...cardSx, display: 'flex', flexDirection: 'column' }}>
                <CategoryIcon category={category} />
                <Typography component="h3" sx={{ fontSize: 19, fontWeight: 700, mt: 2.5 }}>{category}</Typography>
                <Typography sx={{ color: 'text.secondary', mt: 0.75, mb: 2.5, flex: 1 }}>{areaCopy[category]}</Typography>
                <LinkButton to={`/careers?category=${encodeURIComponent(category)}`} appearance="secondary" fullWidth endIcon={<ArrowRight size={18} />} aria-label={`View ${category} positions`}>View positions</LinkButton>
              </Paper>
            ))}
          </Box>
        </Box>
      </Box>

      {/* What ICEP does */}
      <Box component="section" aria-labelledby="does-title" sx={{ bgcolor: '#fff', borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ ...shell, py: { xs: 6, md: 8 } }}>
          <SectionTitle id="does-title" title="What ICEP does" subtitle="The Informatics Community Engagement Programme, initiated by the Informatics department at TUT." />
          <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>
            {pillars.map((pillar) => (
              <Paper key={pillar.title} sx={{ ...cardSx, bgcolor: 'var(--icep-page)' }}>
                <Box sx={{ width: 42, height: 42, display: 'grid', placeItems: 'center', borderRadius: 2, bgcolor: '#E4EBF5', color: 'primary.main' }}>{pillar.icon}</Box>
                <Typography component="h3" sx={{ fontWeight: 700, mt: 2 }}>{pillar.title}</Typography>
                <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.75, lineHeight: 1.6 }}>{pillar.text}</Typography>
              </Paper>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Call to action */}
      <Box component="section" aria-labelledby="cta-title" sx={{ ...shell, py: { xs: 6, md: 8 } }}>
        <Box sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, bgcolor: navy, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
          <Box>
            <Typography id="cta-title" component="h2" sx={{ fontSize: { xs: 22, md: 26 }, fontWeight: 750 }}>Ready to start your WIL placement?</Typography>
            <Typography sx={{ color: '#D7DFE9', mt: 0.5 }}>Browse open positions and apply online in four simple steps.</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <LinkButton to="/?apply=choose" sx={heroButton(true)}>Apply now</LinkButton>
            <LinkButton to="/contact" appearance="secondary" sx={heroButton(false)}>Contact us</LinkButton>
          </Box>
        </Box>
      </Box>
    </>
  )
}

export default HomePage
