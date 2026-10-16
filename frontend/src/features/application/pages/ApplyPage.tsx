import { Navigate, useParams } from 'react-router-dom'
import { APPLY_PARAM, CHOOSE_POSITION } from '../components/ApplicationDialog'

// The application now opens as a pop-up (?apply=…) over the public pages.
// Old links (/apply, /careers/:positionId/apply and their /submitted pages) redirect to it.
export function ApplyPage() {
  const { positionId } = useParams<{ positionId: string }>()
  const to = positionId
    ? `/careers/${encodeURIComponent(positionId)}?${APPLY_PARAM}=${encodeURIComponent(positionId)}`
    : `/?${APPLY_PARAM}=${CHOOSE_POSITION}`
  return <Navigate to={to} replace />
}

export default ApplyPage
