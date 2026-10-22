import { Box, Typography } from '@mui/material'

interface IcepLogoProps {
  /** White wordmark for dark backgrounds such as the sidebar. */
  light?: boolean
  /** Height of the badge in pixels. */
  size?: number
  /** Show the small descriptor under the wordmark. */
  tagline?: boolean
}

export function IcepLogo({ light = false, size = 44, tagline = true }: IcepLogoProps) {
  const text = light ? '#FFFFFF' : 'var(--icep-primary, #1B3A5C)'
  const muted = light ? 'rgba(255,255,255,.7)' : 'var(--icep-secondary, #718096)'

  return (
    <Box role="img" aria-label="ICEP" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5 }}>
      <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <rect width="48" height="48" rx="12" fill={light ? '#FFFFFF' : '#1B3A5C'} />
        {/* Stylised "I": a stem with a serif-like cap, reading as a person and a path forward. */}
        <rect x="21" y="17" width="6" height="19" rx="3" fill={light ? '#1B3A5C' : '#FFFFFF'} />
        <circle cx="24" cy="11.5" r="4" fill="#16A34A" />
        <path d="M10 38 Q24 31 38 38" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </svg>
      <Box sx={{ lineHeight: 1 }}>
        <Typography component="span" sx={{ display: 'block', color: text, fontSize: size * 0.55, fontWeight: 800, letterSpacing: '.08em', lineHeight: 1 }}>
          ICEP
        </Typography>
        {tagline && (
          <Typography component="span" sx={{ display: 'block', mt: 0.5, color: muted, fontSize: Math.max(10, size * 0.24), fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', lineHeight: 1 }}>
            Intern Programme
          </Typography>
        )}
      </Box>
    </Box>
  )
}
