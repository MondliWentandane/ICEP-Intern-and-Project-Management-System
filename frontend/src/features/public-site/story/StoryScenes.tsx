import type { ReactNode } from 'react'
import { Box, Typography } from '@mui/material'
import { Award, Check, FileText, MessageSquareQuote, UploadCloud } from 'lucide-react'
import { CategoryIcon, Pill } from '../components/PositionBits'
import { positionCategories } from '../data/positions'

/** Progress of `t` through the window [from, to], clamped to 0..1. */
const seg = (t: number, from: number, to: number) => Math.min(1, Math.max(0, (t - from) / (to - from)))

const ease = 'cubic-bezier(.2,.8,.2,1)'
const label = { fontSize: 11, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: 'text.secondary' } as const
const card = { p: 1.5, borderRadius: 2, bgcolor: '#fff', border: '1px solid', borderColor: 'divider' } as const

function SceneTitle({ children }: { children: ReactNode }) {
  return <Typography sx={{ fontWeight: 700, fontSize: { xs: 15, md: 17 }, mb: { xs: 1.5, md: 2 } }}>{children}</Typography>
}

/* 1. Discover: the programme areas, with one being chosen. */
export function DiscoverScene({ t }: { t: number }) {
  // Browse each area, then settle on (and choose) the first one.
  const browsing = t < 0.6
  const focus = browsing ? Math.min(positionCategories.length - 1, Math.floor(seg(t, 0.05, 0.6) * positionCategories.length)) : 0
  const chosen = t > 0.7
  return (
    <Box>
      <SceneTitle>Open positions</SceneTitle>
      <Box sx={{ display: 'grid', gap: 1.25 }}>
        {positionCategories.map((category, index) => {
          const on = index === focus
          return (
            <Box key={category} sx={{
              ...card, display: 'flex', alignItems: 'center', gap: 1.5,
              borderColor: on ? 'primary.main' : 'divider', boxShadow: on ? '0 8px 24px rgba(27,58,92,.14)' : 'none',
              transform: on ? 'scale(1.02)' : 'none', transition: `all .35s ${ease}`,
            }}>
              <CategoryIcon category={category} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 650, fontSize: 14 }}>{category}</Typography>
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>12-month WIL placement</Typography>
              </Box>
              {on && chosen
                ? <Box sx={{ width: 26, height: 26, borderRadius: '50%', bgcolor: 'success.main', color: '#fff', display: 'grid', placeItems: 'center' }}><Check size={16} /></Box>
                : <Pill label="Open" tone="success" />}
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

/* 2. Apply: the four-step form filling itself in. */
const formFields = [
  { name: 'Full name', value: 'Thandi Mokoena' },
  { name: 'Qualification', value: 'Diploma in Informatics · Year 3' },
  { name: 'Skills', value: 'React · Python · SQL' },
]

export function ApplyScene({ t }: { t: number }) {
  const filled = Math.floor(seg(t, 0.05, 0.85) * (formFields.length + 1.999))
  const step = Math.min(3, filled)
  return (
    <Box>
      <SceneTitle>Application form</SceneTitle>
      <Box sx={{ display: 'flex', gap: 0.75, mb: 2 }}>
        {[0, 1, 2, 3].map((i) => (
          <Box key={i} sx={{ flex: 1, height: 5, borderRadius: 3, bgcolor: i <= step ? 'primary.main' : '#E4EBF5', transition: `background-color .3s ${ease}` }} />
        ))}
      </Box>
      <Box sx={{ display: 'grid', gap: 1.25 }}>
        {formFields.map((field, i) => (
          <Box key={field.name}>
            <Typography sx={label}>{field.name}</Typography>
            <Box sx={{ ...card, py: 1, mt: 0.5, minHeight: 20, fontSize: 14, borderColor: filled === i ? 'primary.main' : 'divider', transition: `border-color .3s ${ease}` }}>
              <Box component="span" sx={{ opacity: filled > i ? 1 : 0, transition: `opacity .35s ${ease}` }}>{field.value}</Box>
            </Box>
          </Box>
        ))}
        <Box sx={{ ...card, display: 'flex', alignItems: 'center', gap: 1.25, borderStyle: filled >= 3 ? 'solid' : 'dashed', borderColor: filled >= 3 ? 'success.main' : 'divider' }}>
          {filled >= 3 ? <FileText size={18} color="#16A34A" /> : <UploadCloud size={18} color="#718096" />}
          <Typography sx={{ fontSize: 13, color: filled >= 3 ? 'text.primary' : 'text.secondary' }}>{filled >= 3 ? 'CV_Thandi_Mokoena.pdf' : 'Upload your CV, ID and academic record'}</Typography>
        </Box>
      </Box>
    </Box>
  )
}

/* 3. Track: the application moving through its statuses. */
const statuses = ['Submitted', 'Screening', 'Interview', 'Accepted']

export function TrackScene({ t }: { t: number }) {
  const reached = Math.min(statuses.length - 1, Math.floor(seg(t, 0.05, 0.8) * statuses.length))
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography sx={{ fontWeight: 700, fontSize: { xs: 15, md: 17 } }}>Track application</Typography>
        <Pill label={reached === statuses.length - 1 ? 'Offer accepted' : 'In progress'} tone={reached === statuses.length - 1 ? 'success' : 'warning'} />
      </Box>
      <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0, position: 'relative' }}>
        <Box sx={{ position: 'absolute', left: 13, top: 14, bottom: 14, width: 2, bgcolor: '#E4EBF5' }} />
        <Box sx={{ position: 'absolute', left: 13, top: 14, width: 2, bgcolor: 'success.main', height: `calc((100% - 28px) * ${reached / (statuses.length - 1)})`, transition: `height .45s ${ease}` }} />
        {statuses.map((status, i) => {
          const done = i <= reached
          return (
            <Box component="li" key={status} sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25 }}>
              <Box sx={{
                width: 28, height: 28, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0,
                bgcolor: done ? 'success.main' : '#fff', color: '#fff', border: '2px solid', borderColor: done ? 'success.main' : 'divider',
                transform: i === reached ? 'scale(1.12)' : 'none', transition: `all .35s ${ease}`,
              }}>
                {done && <Check size={15} />}
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 650, fontSize: 14, color: done ? 'text.primary' : 'text.secondary' }}>{status}</Typography>
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{done ? (i === reached ? 'Just now' : 'Completed') : 'Waiting'}</Typography>
              </Box>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

/* 4. Build: tasks moving across the project board. */
const columns = ['To do', 'In progress', 'Done']
const tasks = [
  { title: 'Login page', start: 0.0 },
  { title: 'Intern API', start: 0.2 },
  { title: 'Test plan', start: 0.4 },
]

export function BuildScene({ t }: { t: number }) {
  return (
    <Box>
      <SceneTitle>Project board · Community clinic app</SceneTitle>
      <Box sx={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, height: { xs: 190, md: 230 } }}>
        {columns.map((column) => (
          <Box key={column} sx={{ borderRadius: 2, bgcolor: '#EEF2F7', p: 1 }}>
            <Typography sx={label}>{column}</Typography>
          </Box>
        ))}
        {tasks.map((task, i) => {
          const col = Math.min(2, Math.floor(seg(t, task.start, task.start + 0.55) * 3))
          return (
            <Box key={task.title} sx={{
              ...card, position: 'absolute', p: 1, width: 'calc((100% - 16px) / 3 - 8px)', boxSizing: 'border-box',
              left: `calc(${col} * ((100% - 16px) / 3 + 8px) + 4px)`, top: 34 + i * 50,
              borderLeft: '3px solid', borderLeftColor: col === 2 ? 'success.main' : col === 1 ? 'warning.main' : 'info.main',
              transition: `left .5s ${ease}, border-color .3s`, boxShadow: '0 2px 8px rgba(26,32,44,.06)',
            }}>
              <Typography sx={{ fontSize: { xs: 11, md: 13 }, fontWeight: 650, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</Typography>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

/* 5. Grow: weekly mentor feedback and skills growing. */
const skills = [
  { name: 'Front-end development', from: 35, to: 85 },
  { name: 'APIs & databases', from: 25, to: 75 },
  { name: 'Teamwork & delivery', from: 45, to: 90 },
]

export function GrowScene({ t }: { t: number }) {
  const week = 1 + Math.round(seg(t, 0, 0.9) * 11)
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography sx={{ fontWeight: 700, fontSize: { xs: 15, md: 17 } }}>Mentor review</Typography>
        <Pill label={`Week ${week}`} tone="info" />
      </Box>
      <Box sx={{ ...card, display: 'flex', gap: 1.25, mb: 2, bgcolor: '#F8FAFC' }}>
        <MessageSquareQuote size={20} color="#1B3A5C" style={{ flexShrink: 0 }} />
        <Typography sx={{ fontSize: 13, lineHeight: 1.5 }}>Clean pull requests and clear stand-up updates. Next: pair on the reporting API.</Typography>
      </Box>
      <Box sx={{ display: 'grid', gap: 1.5 }}>
        {skills.map((skill) => {
          const value = Math.round(skill.from + (skill.to - skill.from) * seg(t, 0.05, 0.9))
          return (
            <Box key={skill.name}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, mb: 0.5 }}>
                <span>{skill.name}</span><Box component="span" sx={{ fontWeight: 700 }}>{value}%</Box>
              </Box>
              <Box sx={{ height: 8, borderRadius: 4, bgcolor: '#E4EBF5', overflow: 'hidden' }}>
                <Box sx={{ height: '100%', width: `${value}%`, borderRadius: 4, bgcolor: 'primary.main', transition: `width .2s linear` }} />
              </Box>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

/* 6. Graduate: the completed placement. */
export function GraduateScene({ t }: { t: number }) {
  const shown = seg(t, 0.05, 0.5)
  return (
    <Box sx={{ textAlign: 'center', py: { xs: 1, md: 2 } }}>
      <Box sx={{
        width: 84, height: 84, mx: 'auto', borderRadius: '50%', display: 'grid', placeItems: 'center',
        bgcolor: 'primary.main', color: '#fff', boxShadow: `0 0 0 ${10 * shown}px rgba(27,58,92,.12), 0 0 0 ${22 * shown}px rgba(27,58,92,.06)`,
        transform: `scale(${0.7 + 0.3 * shown}) rotate(${(1 - shown) * -25}deg)`, transition: `transform .25s ${ease}`,
      }}>
        <Award size={40} />
      </Box>
      <Typography sx={{ fontWeight: 750, fontSize: { xs: 17, md: 20 }, mt: 3 }}>Placement complete</Typography>
      <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.5 }}>Thandi Mokoena · Software Development</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, mt: 2.5 }}>
        {[['12', 'months'], ['4', 'projects'], ['48', 'reviews']].map(([value, name], i) => (
          <Box key={name} sx={{ ...card, opacity: seg(t, 0.3 + i * 0.12, 0.5 + i * 0.12), transform: `translateY(${(1 - seg(t, 0.3 + i * 0.12, 0.5 + i * 0.12)) * 10}px)` }}>
            <Typography sx={{ fontWeight: 750, fontSize: 18 }}>{value}</Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{name}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
