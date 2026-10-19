import { Card as MuiCard, type CardProps } from '@mui/material'

export type { CardProps }

export function Card({ sx, ...props }: CardProps) {
  return <MuiCard {...props} sx={[{ bgcolor: '#fff', borderRadius: '12px', boxShadow: '0 2px 10px rgba(26, 32, 44, 0.06)' }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]} />
}

export { CardContent, CardHeader, CardActions } from '@mui/material'
export default Card
