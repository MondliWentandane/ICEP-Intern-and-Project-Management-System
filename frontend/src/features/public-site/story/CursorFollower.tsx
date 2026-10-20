import { useEffect, useRef, useState } from 'react'
import { Box } from '@mui/material'

const INTERACTIVE = 'a, button, [role="button"], input, select, textarea, label'

/**
 * Small blue dot that follows the mouse, with a soft ring trailing behind it.
 * The ring grows over links and buttons and squeezes on click. Mouse-only: it
 * stays off on touch screens and for reduced-motion readers, and the normal
 * cursor is kept.
 */
export function CursorFollower() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const [enabled] = useState(() =>
    typeof window !== 'undefined'
    && window.matchMedia('(hover: hover) and (pointer: fine)').matches
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    if (!enabled) return
    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return
    const target = { x: -100, y: -100 }
    const pos = { x: -100, y: -100 }
    let frame = 0
    let hovering = false
    let pressed = false

    const render = () => {
      pos.x += (target.x - pos.x) * 0.18
      pos.y += (target.y - pos.y) * 0.18
      const scale = (hovering ? 1.8 : 1) * (pressed ? 0.75 : 1)
      dot.style.transform = `translate3d(${target.x}px, ${target.y}px, 0) translate(-50%, -50%) scale(${hovering ? 0 : 1})`
      ring.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%) scale(${scale})`
      // Keep animating only while the ring is still catching up.
      frame = Math.abs(target.x - pos.x) + Math.abs(target.y - pos.y) > 0.3 ? requestAnimationFrame(render) : 0
    }
    const kick = () => { if (!frame) frame = requestAnimationFrame(render) }

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      target.x = event.clientX
      target.y = event.clientY
      hovering = event.target instanceof Element && Boolean(event.target.closest(INTERACTIVE))
      dot.style.opacity = '1'
      ring.style.opacity = '1'
      ring.dataset.hover = String(hovering)
      kick()
    }
    const onLeave = () => { dot.style.opacity = '0'; ring.style.opacity = '0' }
    const onDown = () => { pressed = true; kick() }
    const onUp = () => { pressed = false; kick() }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [enabled])

  if (!enabled) return null
  const base = { position: 'fixed', left: 0, top: 0, borderRadius: '50%', pointerEvents: 'none', zIndex: 2000, opacity: 0, willChange: 'transform' } as const
  return (
    <>
      <Box ref={ringRef} aria-hidden="true" sx={{
        ...base, width: 34, height: 34, border: '1.5px solid rgba(59,130,246,.75)', bgcolor: 'rgba(59,130,246,.08)',
        transition: 'opacity .3s, background-color .25s, border-color .25s',
        '&[data-hover="true"]': { bgcolor: 'rgba(59,130,246,.18)', borderColor: 'rgba(59,130,246,.9)' },
      }} />
      <Box ref={dotRef} aria-hidden="true" sx={{
        ...base, width: 8, height: 8, bgcolor: '#3B82F6', boxShadow: '0 0 0 2px rgba(255,255,255,.7)',
        transition: 'opacity .3s',
      }} />
    </>
  )
}
