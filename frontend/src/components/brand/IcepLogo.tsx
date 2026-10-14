import { Typography } from '@mui/material'
export function IcepLogo({ light = false }: { light?: boolean }) { return <Typography variant="h5" sx={{ fontWeight: 800, color: light ? 'common.white' : 'primary.main' }}>ICEP.</Typography> }
