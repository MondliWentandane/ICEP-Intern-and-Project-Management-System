import { useEffect, useState } from 'react'
import { Box } from '@mui/material'
import { ArrowRight } from 'lucide-react'
import { LinkButton } from './LinkButton'

/**
 * Phone-only "Apply now" bar pinned to the bottom of the screen. It shows once
 * the reader has scrolled past `startId`'s section and hides again when
 * `endId`'s section (which has its own Apply button) comes into view.
 */
export function FloatingApply({ startId, endId }: { startId: string; endId: string }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const update = () => {
      const start = document.getElementById(startId)?.closest('section')
      const end = document.getElementById(endId)?.closest('section')
      if (!start || !end) return
      const pastStart = start.getBoundingClientRect().bottom < 0
      const beforeEnd = end.getBoundingClientRect().top > window.innerHeight - 80
      setVisible(pastStart && beforeEnd)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [startId, endId])

  return (
    <Box sx={{
      display: { xs: 'block', md: 'none' }, position: 'fixed', left: 16, right: 16, zIndex: 1000,
      bottom: 'calc(16px + env(safe-area-inset-bottom))',
      transform: visible ? 'none' : 'translateY(calc(100% + 32px))', opacity: visible ? 1 : 0,
      transition: 'transform .35s cubic-bezier(.2,.8,.2,1), opacity .35s',
      pointerEvents: visible ? 'auto' : 'none',
      '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
    }}>
      <LinkButton
        to="/?apply=choose"
        fullWidth
        tabIndex={visible ? 0 : -1}
        aria-hidden={!visible}
        endIcon={<ArrowRight size={18} />}
        sx={{ minHeight: 52, fontSize: 16, borderRadius: '12px', boxShadow: '0 12px 30px rgba(18,40,63,.35)' }}
      >
        Apply now
      </LinkButton>
    </Box>
  )
}
