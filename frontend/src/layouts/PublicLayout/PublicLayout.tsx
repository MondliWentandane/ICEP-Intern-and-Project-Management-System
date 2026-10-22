import { useEffect, useRef, useState } from 'react'
import { Box, Drawer, IconButton, Link, Typography } from '@mui/material'
import { Menu, X } from 'lucide-react'
import { Link as RouterLink, NavLink, Outlet, useLocation } from 'react-router-dom'
import icepLogo from '../../assets/icep-logo.png'
import icepLogoBW from '../../assets/icep-logo-b&w.png'
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
  const { pathname } = useLocation()
  const fullBleed = pathname === '/'
  const applyNow = `${pathname}?${APPLY_PARAM}=${CHOOSE_POSITION}`

  // 1. Fix: Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  // 2. Setup observer for the footer animation
  const footerRef = useRef<HTMLElement>(null)
  const [footerVisible, setFooterVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      // Trigger the slide-up animation when the footer enters the viewport
      if (entry.isIntersecting) {
        setFooterVisible(true)
      } else {
        // Reset state when scrolling far away so it can trigger again when scrolling back down
        setFooterVisible(false) 
      }
    }, { threshold: 0.1, rootMargin: '50px' })
    
    if (footerRef.current) observer.observe(footerRef.current)
    return () => observer.disconnect()
  }, [])

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

      {/* Footer */}
      <Box component="footer" ref={footerRef} sx={{ bgcolor: '#0F1E30', color: '#C2CCDA', display: 'flex', flexDirection: 'column' }}>
        
        {/* Back to top banner container with overflow hidden so it animates upwards from behind the footer */}
        <Box sx={{ overflow: 'hidden', bgcolor: '#0F1E30' }}>
          <Box 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && window.scrollTo({ top: 0, behavior: 'smooth' })}
            sx={{ 
              bgcolor: '#1C2E45', 
              color: '#fff', 
              py: 1.25, 
              textAlign: 'center', 
              cursor: 'pointer', 
              fontSize: 14, 
              fontWeight: 600,
              transform: footerVisible ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
              '&:hover': { bgcolor: '#233954' }
            }}
          >
            Back to top
          </Box>
        </Box>

        {/* Main Footer Container */}
        <Box sx={{ ...shell, pt: { xs: 5, md: 6 }, pb: 3, width: '100%', position: 'relative', zIndex: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '2fr 1fr 1fr' }, gap: 4, mb: { xs: 4, md: 5 } }}>
            {/* Branding Column */}
            <Box>
              <Box component={RouterLink} to="/" aria-label="ICEP home" sx={{ display: 'inline-block' }}>
                <img src={icepLogoBW} alt="ICEP" style={{ height: 120, width: 'auto', display: 'block' }} />
              </Box>
            </Box>
            
            {/* Explore Links */}
            <Box>
              <Typography sx={{ color: '#fff', fontSize: 15, fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: '.05em' }}>Explore</Typography>
              <Box sx={{ display: 'grid', gap: 1.5 }}>
                <Link component={RouterLink} to="/" underline="hover" sx={{ color: '#C2CCDA', fontSize: 15, width: 'fit-content' }}>Home</Link>
                <Link component={RouterLink} to="/about" underline="hover" sx={{ color: '#C2CCDA', fontSize: 15, width: 'fit-content' }}>About</Link>
                <Link component={RouterLink} to="/careers" underline="hover" sx={{ color: '#C2CCDA', fontSize: 15, width: 'fit-content' }}>Careers</Link>
                <Link component={RouterLink} to="/contact" underline="hover" sx={{ color: '#C2CCDA', fontSize: 15, width: 'fit-content' }}>Contact</Link>
              </Box>
            </Box>
            
            {/* Portals Links */}
            <Box>
              <Typography sx={{ color: '#fff', fontSize: 15, fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: '.05em' }}>Portals</Typography>
              <Box sx={{ display: 'grid', gap: 1.5 }}>
                <Link component={RouterLink} to="/track" underline="hover" sx={{ color: '#C2CCDA', fontSize: 15, width: 'fit-content' }}>Track Application</Link>
                <Link component={RouterLink} to="/login" underline="hover" sx={{ color: '#C2CCDA', fontSize: 15, width: 'fit-content' }}>Login</Link>
                <Link component={RouterLink} to={applyNow} underline="hover" sx={{ color: '#C2CCDA', fontSize: 15, width: 'fit-content' }}>Apply now</Link>
              </Box>
            </Box>
          </Box>

          <Box sx={{ pt: 3, borderTop: '1px solid rgba(255,255,255,.12)', display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', fontSize: 14 }}>
            <span>© {year} ICEP · Tshwane University of Technology</span>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
export default PublicLayout