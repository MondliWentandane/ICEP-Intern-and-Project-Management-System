import { Box, Typography } from '@mui/material'
import { Check } from 'lucide-react'
import { applicationStepNames } from './steps'

/** activeStep is 0-based; pass applicationStepNames.length to show every step as complete. */
export function ApplicationStepper({ activeStep = 0 }: { activeStep?: number }) {
  const last = applicationStepNames.length - 1
  return (
    <Box component="ol" aria-label="Application progress" sx={{ display: 'flex', listStyle: 'none', p: 0, m: 0 }}>
      {applicationStepNames.map((name, index) => {
        const done = index < activeStep
        const current = index === activeStep
        return (
          <Box component="li" key={name} aria-current={current ? 'step' : undefined} sx={{ flex: index === last ? '0 0 auto' : 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{
                width: 30, height: 30, flex: '0 0 30px', borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700,
                bgcolor: done ? 'primary.main' : '#fff', color: done ? '#fff' : current ? 'primary.main' : 'text.secondary',
                border: '2px solid', borderColor: done || current ? 'primary.main' : 'divider',
              }}>
                {done ? <Check size={16} strokeWidth={3} aria-hidden="true" /> : index + 1}
              </Box>
              {index !== last && <Box sx={{ flex: 1, height: 2, mx: 1, bgcolor: done ? 'primary.main' : 'divider' }} />}
            </Box>
            <Typography sx={{ mt: 1, fontSize: 13, fontWeight: done || current ? 700 : 400, color: done || current ? 'text.primary' : 'text.secondary' }}>
              {name}<Box component="span" sx={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>{done ? ' (complete)' : ''}</Box>
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}
