import { useEffect, useRef, useState } from 'react'
import { Box } from '@mui/material'
import { usePrefersReducedMotion } from './useScrollProgress'

const layers = [
  { amp: 34, length: 0.0022, speed: 0.00012, y: 0.62, alpha: 0.05 },
  { amp: 46, length: 0.0016, speed: -0.00009, y: 0.7, alpha: 0.045 },
  { amp: 28, length: 0.003, speed: 0.00016, y: 0.78, alpha: 0.04 },
  { amp: 52, length: 0.0012, speed: 0.00006, y: 0.86, alpha: 0.05 },
]

/**
 * Slow, smoky waves behind the hero, drawn on a canvas. Pauses while off-screen
 * or in a background tab, and draws a single still frame for reduced motion.
 */
export function HeroWaves() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    let frame = 0
    let visible = true
    let width = 0
    let height = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height)
      for (const layer of layers) {
        const base = height * layer.y
        const gradient = ctx.createLinearGradient(0, base - layer.amp, 0, height)
        gradient.addColorStop(0, `rgba(255,255,255,${layer.alpha})`)
        gradient.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.beginPath()
        ctx.moveTo(0, height)
        for (let x = 0; x <= width + 16; x += 16) {
          const phase = time * layer.speed
          const y = base
            + Math.sin(x * layer.length + phase * 6) * layer.amp
            + Math.sin(x * layer.length * 2.3 - phase * 4) * layer.amp * 0.35
          ctx.lineTo(x, y)
        }
        ctx.lineTo(width, height)
        ctx.closePath()
        ctx.fillStyle = gradient
        ctx.fill()
      }
    }

    const loop = (time: number) => {
      frame = 0
      draw(time)
      if (visible && !document.hidden) frame = requestAnimationFrame(loop)
    }
    const start = () => { if (!frame && !reducedMotion) frame = requestAnimationFrame(loop) }

    resize()
    draw(performance.now())
    start()
    const resizeObserver = new ResizeObserver(() => { resize(); draw(performance.now()) })
    resizeObserver.observe(canvas)
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) start() })
    io.observe(canvas)
    const onVisibility = () => { if (!document.hidden) start() }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [reducedMotion])

  return <Box component="canvas" ref={canvasRef} aria-hidden="true" sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
}

/** Counts up from 0 to `to` once mounted (and eases to any later value). */
export function CountUp({ to, delay = 0, duration = 1200 }: { to: number; delay?: number; duration?: number }) {
  const reducedMotion = usePrefersReducedMotion()
  const [value, setValue] = useState(reducedMotion ? to : 0)
  const from = useRef(value)

  useEffect(() => {
    if (reducedMotion) return
    let frame = 0
    const startValue = from.current
    const begin = performance.now() + delay
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - begin) / duration))
      const eased = 1 - Math.pow(1 - t, 3)
      const next = Math.round(startValue + (to - startValue) * eased)
      from.current = next
      setValue(next)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [to, delay, duration, reducedMotion])

  return <>{reducedMotion ? to : value}</>
}
