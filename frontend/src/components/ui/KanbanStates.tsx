import { Search, TriangleAlert } from 'lucide-react'
import { BikeLoader } from './BikeLoader'

const cardStyle = { minHeight: 180, padding: 24, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 } as const

export function KanbanLoading() {
  return <div style={cardStyle}><BikeLoader label="Loading tasks" /></div>
}

export function KanbanEmpty({ message = 'No tasks yet' }: { message?: string }) {
  return <div style={cardStyle}>
    <span style={{ width: 48, height: 48, borderRadius: '50%', background: '#F5F6F8', display: 'grid', placeItems: 'center', color: '#718096' }}><Search size={21} aria-hidden="true" /></span>
    <div><strong>{message}</strong><p style={{ color: '#718096', fontSize: 13, margin: '6px 0 0' }}>Tasks will appear here when they are added to the project.</p></div>
  </div>
}

export function KanbanError({ message = 'We could not load the task board.' }: { message?: string }) {
  return <div role="alert" style={{ ...cardStyle, minHeight: 120, justifyContent: 'flex-start', borderLeft: '4px solid #DC2626' }}>
    <TriangleAlert size={22} color="#DC2626" />
    <div><strong>Something went wrong</strong><p style={{ color: '#718096', fontSize: 13, margin: '6px 0 0' }}>{message}</p></div>
  </div>
}
