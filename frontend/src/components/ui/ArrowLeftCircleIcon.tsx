// Arrow-left-circle icon whose arrow nudges left on hover.
// Based on "arrow left circle" from Heroicons Animated by Aniket Pawar (MIT, https://heroicons-animated.com),
// with the motion animation redone in CSS so it needs no extra packages.
// The arrow plays when the icon itself, or any parent with the class "alc-trigger", is hovered or focused.
import './ArrowLeftCircleIcon.css'

interface ArrowLeftCircleIconProps {
  size?: number
  className?: string
}

export function ArrowLeftCircleIcon({ size = 28, className }: ArrowLeftCircleIconProps) {
  return (
    <svg className={['alc-icon', className].filter(Boolean).join(' ')} fill="none" height={size} width={size} stroke="currentColor"
      strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      <g className="alc-arrow"><path d="m11.25 9-3 3m0 0 3 3m-3-3h7.5" /></g>
    </svg>
  )
}
export default ArrowLeftCircleIcon
