import { useState } from 'react'
import { Box, Drawer, IconButton, Link, Typography } from '@mui/material'
import { Menu, X } from 'lucide-react'
import { Link as RouterLink, NavLink, Outlet, useLocation } from 'react-router-dom'
import icepLogo from '../../assets/icep-logo.png'
import { APPLY_PARAM, ApplicationDialog, CHOOSE_POSITION } from '@/features/application/components/ApplicationDialog'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Careers', to: '/careers' },
  { label: 'Contact', to: '/contact' },
]
const year = new Date().getFullYear()
const shell = { maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, boxSizing: 'border-box' } as const

const navLinkSx = {
  position: 'relative', display: 'inline-flex', alignItems: 'center', height: '100%', px: 1.25, fontSize: 14, color: 'text.secondary', textDecoration: 'none',
  '&:hover': { color: 'primary.main' },
  '&.active': { color: 'primary.main', fontWeight: 700 },
  '&.active::after': { content: '""', position: 'absolute', left: 10, right: 10, bottom: 0, height: 2, borderRadius: 1, bgcolor: 'primary.main' },
} as const

function Brand() {
  return (
    <Box component={RouterLink} to="/" aria-label="ICEP home" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, textDecoration: 'none' }}>
      <img src={icepLogo} alt="ICEP – we are the new future" style={{ height: 50, width: 'auto', display: 'block' }} />
      <Box sx={{ display: { xs: 'none', sm: 'block' }, pl: 1.5, borderLeft: '1px solid', borderColor: 'divider', color: 'text.secondary', fontSize: 12, lineHeight: 1.3 }}>
        Tshwane University<br />of Technology
      </Box>
    </Box>
  )
}

export function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  // The landing page uses full-width bands; other public pages keep the centred content container.
  const { pathname } = useLocation()
  const fullBleed = pathname === '/'
  // "Apply now" opens the application pop-up over the current page, with a position dropdown.
  const applyNow = `${pathname}?${APPLY_PARAM}=${CHOOSE_POSITION}`

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'var(--icep-page)' }}>
      <Box component="header" sx={{ position: 'sticky', top: 0, zIndex: 1100, bgcolor: '#fff', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ ...shell, height: 72, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Brand />
          <Box component="nav" aria-label="Main" sx={{ display: { xs: 'none', md: 'flex' }, height: '100%', mx: 'auto', gap: 1 }}>
            {navItems.map((item) => <Box key={item.to} component={NavLink} to={item.to} end={item.to === '/'} sx={navLinkSx}>{item.label}</Box>)}
          </Box>
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2.5 }}>
            <Link component={RouterLink} to="/track" underline="hover" sx={{ fontWeight: 600, fontSize: 14 }}>Track application</Link>
            <Link component={RouterLink} to="/login" underline="hover" sx={{ fontWeight: 600, fontSize: 14 }}>Log in</Link>
            <Box component={RouterLink} to={applyNow} sx={{ px: 2.25, py: 1.1, borderRadius: 2, bgcolor: 'primary.main', color: '#fff', fontWeight: 600, fontSize: 14, textDecoration: 'none', '&:hover': { bgcolor: 'primary.dark' } }}>Apply now</Box>
          </Box>
          <IconButton aria-label="Open menu" onClick={() => setMenuOpen(true)} sx={{ display: { md: 'none' }, ml: 'auto', color: 'primary.main' }}><Menu size={22} /></IconButton>
        </Box>
      </Box>

      <Drawer anchor="right" open={menuOpen} onClose={() => setMenuOpen(false)} slotProps={{ paper: { sx: { width: 'min(300px, 85vw)', p: 2 } } }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}><IconButton aria-label="Close menu" onClick={() => setMenuOpen(false)}><X size={22} /></IconButton></Box>
        <Box component="nav" aria-label="Main" sx={{ display: 'grid', gap: 0.5, mt: 1 }}>
          {[...navItems, { label: 'Track application', to: '/track' }, { label: 'Log in', to: '/login' }].map((item) => (
            <Box key={item.to} component={NavLink} to={item.to} end={item.to === '/'} onClick={() => setMenuOpen(false)}
              sx={{ px: 1.5, py: 1.25, borderRadius: 2, color: 'text.primary', textDecoration: 'none', fontSize: 15, '&.active': { bgcolor: '#EEF2F8', color: 'primary.main', fontWeight: 700 } }}>{item.label}</Box>
          ))}
          <Box component={RouterLink} to={applyNow} onClick={() => setMenuOpen(false)} sx={{ mt: 1, px: 1.5, py: 1.25, borderRadius: 2, bgcolor: 'primary.main', color: '#fff', textAlign: 'center', fontWeight: 600, textDecoration: 'none' }}>Apply now</Box>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flex: 1, width: '100%', ...(fullBleed ? {} : { ...shell, py: { xs: 3, md: 4 } }) }}>
        <Outlet />
      </Box>
      <ApplicationDialog />

      <Box component="footer" sx={{ bgcolor: '#0F1E30', color: '#C2CCDA' }}>
        <Box sx={{ ...shell, pt: 4, pb: 3 }}>
          <Typography sx={{ color: '#fff', fontSize: 20, fontWeight: 750 }}>ICEP</Typography>
          <Typography sx={{ fontSize: 13 }}>Informatics Community Engagement Programme</Typography>
          <Box sx={{ mt: 3, pt: 2.5, borderTop: '1px solid rgba(255,255,255,.12)', display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', fontSize: 13 }}>
            <span>© {year} ICEP · Tshwane University of Technology</span>
            <Link component={RouterLink} to="/about" underline="hover" sx={{ color: '#C2CCDA' }}>Privacy notice</Link>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
export default PublicLayout
