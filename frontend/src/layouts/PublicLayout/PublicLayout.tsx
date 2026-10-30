import { useEffect, useRef, useState } from 'react'
import { Box, Drawer, IconButton, Link, Typography } from '@mui/material'
import { ArrowUp, Menu, X } from 'lucide-react'
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

// Standardized animation config for header elements
const navAnimSx = (index: number, dir: 'down' | 'up' | 'right', visible: boolean) => ({
  opacity: visible ? 1 : 0,
  transform: visible ? 'translate(0)' : (dir === 'down' ? 'translateY(-20px)' : dir === 'up' ? 'translateY(20px)' : 'translateX(-20px)'),
  transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
  transitionDelay: visible ? `${index * 80}ms` : '0ms',
})

function Brand({ visible }: { visible: boolean }) {
  return (
    <Box component={RouterLink} to="/" aria-label="ICEP home" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, textDecoration: 'none' }}>
      <Box sx={navAnimSx(0, 'down', visible)}>
        <img src={icepLogo} alt="ICEP – we are the new future" style={{ height: 56, width: 'auto', display: 'block' }} />
      </Box>
      <Box sx={{ 
        display: { xs: 'none', sm: 'block' }, 
        pl: 1.5, borderLeft: '1px solid', borderColor: 'divider', color: 'text.secondary', fontSize: 13, lineHeight: 1.3,
        ...navAnimSx(1, 'down', visible) 
      }}>
        Tshwane University<br />of Technology
      </Box>
    </Box>
  )
}

function DesktopNav({ visible }: { visible: boolean }) {
  const { pathname } = useLocation()
  const navRef = useRef<HTMLElement>(null)
  const [indicator, setIndicator] = useState({ left: 0, width: 0, opacity: 0 })

  useEffect(() => {
    const updateIndicator = () => {
      if (!navRef.current) return
      setTimeout(() => {
        if (!navRef.current) return
        const activeEl = navRef.current.querySelector('.active') as HTMLElement
        if (activeEl) {
          setIndicator({
            left: activeEl.offsetLeft + 12,
            width: activeEl.offsetWidth - 24,
            opacity: 1,
          })
        } else {
          setIndicator((prev) => ({ ...prev, opacity: 0 }))
        }
      }, 0)
    }
    
    updateIndicator()
    window.addEventListener('resize', updateIndicator)
    return () => window.removeEventListener('resize', updateIndicator)
  }, [pathname])

  return (
    <Box component="nav" ref={navRef} aria-label="Main" sx={{ display: { xs: 'none', md: 'flex' }, position: 'relative', height: '100%', mx: 'auto', gap: 1.5 }}>
      {navItems.map((item, index) => (
        <Box 
          key={item.to} 
          component={NavLink} 
          to={item.to} 
          end={item.to === '/'} 
          sx={{
            position: 'relative', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center',
            alignItems: 'center', 
            height: '100%', 
            px: 1.5, 
            fontSize: 15, 
            color: 'text.secondary', 
            textDecoration: 'none',
            // Specific transition config protecting the hover color transition from being overwritten by the staggered transform delay
            opacity: visible ? 1 : 0,
            transform: visible ? 'translate(0)' : 'translateY(20px)',
            transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), color 0.35s ease',
            transitionDelay: visible ? `${(index + 2) * 80}ms, ${(index + 2) * 80}ms, 0ms` : '0ms, 0ms, 0ms',
            '&:hover': { color: 'primary.main' },
            '&.active': { color: 'primary.main', fontWeight: 700 },
            '&::after': {
              content: `"${item.label}"`,
              display: 'block',
              fontWeight: 700,
              height: 0,
              visibility: 'hidden',
              overflow: 'hidden',
              userSelect: 'none',
              pointerEvents: 'none',
            }
          }}
        >
          {item.label}
        </Box>
      ))}
      {/* The traveling underline indicator */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          height: 2.5,
          bgcolor: 'primary.main',
          borderRadius: 1,
          pointerEvents: 'none',
          transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          ...indicator,
          opacity: visible ? indicator.opacity : 0,
        }}
      />
    </Box>
  )
}

// Local helper to mimic riseSx without relying on scroll-progress depth
const staggerSx = (index: number, visible: boolean) => ({
  opacity: visible ? 1 : 0,
  transform: visible ? 'translateY(0)' : 'translateY(24px)',
  transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
  transitionDelay: `${index * 80}ms`,
})

export function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const fullBleed = pathname === '/'
  const applyNow = `${pathname}?${APPLY_PARAM}=${CHOOSE_POSITION}`

  // Track initial page load so animation strictly runs once and doesn't replay on navigation
  const initialRender = useRef(true)
  const [navVisible, setNavVisible] = useState(() => pathname !== '/')

  useEffect(() => {
    if (initialRender.current && pathname === '/') {
      const t = setTimeout(() => {
        setNavVisible(true)
      }, 50)
      initialRender.current = false
      return () => clearTimeout(t)
    } else {
      setNavVisible(true)
      initialRender.current = false
    }
  }, [pathname])

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  // Custom observer for the footer animations so it triggers strictly on viewport entry
  const footerRef = useRef<HTMLElement>(null)
  const [footerVisible, setFooterVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setFooterVisible(true)
      } else {
        setFooterVisible(false) 
      }
    }, { threshold: 0.1, rootMargin: '50px' })
    
    if (footerRef.current) observer.observe(footerRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'var(--icep-page)' }}>
      <Box component="header" sx={{ position: 'sticky', top: 0, zIndex: 1100, bgcolor: '#fff', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ ...shell, height: 80, display: 'flex', alignItems: 'center', gap: 3 }}>
          <Brand visible={navVisible} />
          
          <DesktopNav visible={navVisible} />

          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2.5 }}>
            <Box sx={navAnimSx(6, 'right', navVisible)}>
              <Link component={RouterLink} to="/track" underline="hover" sx={{ fontWeight: 600, fontSize: 15 }}>Track application</Link>
            </Box>
            <Box sx={navAnimSx(7, 'right', navVisible)}>
              <Link component={RouterLink} to="/login" underline="hover" sx={{ fontWeight: 600, fontSize: 15 }}>Log in</Link>
            </Box>
            <Box sx={navAnimSx(8, 'right', navVisible)}>
              <Box component={RouterLink} to={applyNow} sx={{ px: 2.5, py: 1.25, borderRadius: 2, bgcolor: 'primary.main', color: '#fff', fontWeight: 600, fontSize: 15, textDecoration: 'none', '&:hover': { bgcolor: 'primary.dark' } }}>Apply now</Box>
            </Box>
          </Box>
          
          <Box sx={{ display: { md: 'none' }, ml: 'auto', ...navAnimSx(6, 'right', navVisible) }}>
            <IconButton aria-label="Open menu" onClick={() => setMenuOpen(true)} sx={{ color: 'primary.main' }}>
              <Menu size={26} />
            </IconButton>
          </Box>
        </Box>
      </Box>

      <Drawer anchor="right" open={menuOpen} onClose={() => setMenuOpen(false)} slotProps={{ paper: { sx: { width: 'min(300px, 85vw)', p: 2 } } }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}><IconButton aria-label="Close menu" onClick={() => setMenuOpen(false)}><X size={26} /></IconButton></Box>
        <Box component="nav" aria-label="Main" sx={{ display: 'grid', gap: 0.5, mt: 1 }}>
          {[...navItems, { label: 'Track application', to: '/track' }, { label: 'Log in', to: '/login' }].map((item) => (
            <Box key={item.to} component={NavLink} to={item.to} end={item.to === '/'} onClick={() => setMenuOpen(false)}
              sx={{ px: 1.5, py: 1.25, borderRadius: 2, color: 'text.primary', textDecoration: 'none', fontSize: 16, '&.active': { bgcolor: '#EEF2F8', color: 'primary.main', fontWeight: 700 } }}>{item.label}</Box>
          ))}
          <Box component={RouterLink} to={applyNow} onClick={() => setMenuOpen(false)} sx={{ mt: 1, px: 1.5, py: 1.25, borderRadius: 2, bgcolor: 'primary.main', color: '#fff', textAlign: 'center', fontWeight: 600, textDecoration: 'none', fontSize: 16 }}>Apply now</Box>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flex: 1, width: '100%', ...(fullBleed ? {} : { ...shell, py: { xs: 3, md: 4 } }) }}>
        <Outlet />
      </Box>
      <ApplicationDialog />

      {/* Footer */}
      <Box component="footer" ref={footerRef} sx={{ bgcolor: '#0F1E30', color: '#C2CCDA', display: 'flex', flexDirection: 'column' }}>
        
        {/* Back to top banner with static background and animated text */}
        <Box 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && window.scrollTo({ top: 0, behavior: 'smooth' })}
          sx={{ 
            bgcolor: '#1C2E45', 
            color: '#fff', 
            py: 1.25, 
            cursor: 'pointer', 
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            '&:hover': { bgcolor: '#233954' }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ...staggerSx(0, footerVisible) }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Back to top</Typography>
            <ArrowUp size={16} aria-hidden="true" />
          </Box>
        </Box>

        {/* Main Footer Container */}
        <Box sx={{ ...shell, pt: { xs: 5, md: 6 }, pb: 3, width: '100%' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '2fr 1fr 1fr' }, gap: 4, mb: { xs: 4, md: 5 } }}>
            {/* Branding Column */}
            <Box>
              <Box component={RouterLink} to="/" aria-label="ICEP home" sx={{ display: 'inline-block', ...staggerSx(1, footerVisible) }}>
                <img src={icepLogoBW} alt="ICEP" style={{ height: 120, width: 'auto', display: 'block' }} />
              </Box>
            </Box>
            
            {/* Explore Links */}
            <Box>
              <Typography sx={{ color: '#fff', fontSize: 15, fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: '.05em', ...staggerSx(2, footerVisible) }}>Explore</Typography>
              <Box sx={{ display: 'grid', gap: 1.5 }}>
                <Link component={RouterLink} to="/" underline="hover" sx={{ color: '#C2CCDA', fontSize: 15, width: 'fit-content', ...staggerSx(3, footerVisible) }}>Home</Link>
                <Link component={RouterLink} to="/about" underline="hover" sx={{ color: '#C2CCDA', fontSize: 15, width: 'fit-content', ...staggerSx(4, footerVisible) }}>About</Link>
                <Link component={RouterLink} to="/careers" underline="hover" sx={{ color: '#C2CCDA', fontSize: 15, width: 'fit-content', ...staggerSx(5, footerVisible) }}>Careers</Link>
                <Link component={RouterLink} to="/contact" underline="hover" sx={{ color: '#C2CCDA', fontSize: 15, width: 'fit-content', ...staggerSx(6, footerVisible) }}>Contact</Link>
              </Box>
            </Box>
            
            {/* Portals Links */}
            <Box>
              <Typography sx={{ color: '#fff', fontSize: 15, fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: '.05em', ...staggerSx(3, footerVisible) }}>Portals</Typography>
              <Box sx={{ display: 'grid', gap: 1.5 }}>
                <Link component={RouterLink} to="/track" underline="hover" sx={{ color: '#C2CCDA', fontSize: 15, width: 'fit-content', ...staggerSx(4, footerVisible) }}>Track Application</Link>
                <Link component={RouterLink} to="/login" underline="hover" sx={{ color: '#C2CCDA', fontSize: 15, width: 'fit-content', ...staggerSx(5, footerVisible) }}>Login</Link>
                <Link component={RouterLink} to={applyNow} underline="hover" sx={{ color: '#C2CCDA', fontSize: 15, width: 'fit-content', ...staggerSx(6, footerVisible) }}>Apply now</Link>
              </Box>
            </Box>
          </Box>

          <Box sx={{ pt: 3, borderTop: '1px solid rgba(255,255,255,.12)', display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', fontSize: 14 }}>
            <Box component="span" sx={{ ...staggerSx(7, footerVisible) }}>
              © {year} ICEP · Tshwane University of Technology
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
export default PublicLayout
