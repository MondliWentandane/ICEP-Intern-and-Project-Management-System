import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeftCircleIcon } from '@/components/ui/ArrowLeftCircleIcon'

/** Top-left "Back" on the auth pages: the previous page in the app, or `fallback` when opened directly (e.g. from an email link). */
export function AuthBackButton({ fallback }: { fallback: string }) {
  const navigate = useNavigate()
  const location = useLocation()
  const goBack = () => (location.key === 'default' ? navigate(fallback) : navigate(-1))
  return <button type="button" className="auth-back alc-trigger" onClick={goBack} aria-label="Go back"><ArrowLeftCircleIcon size={22} /><span>Back</span></button>
}
