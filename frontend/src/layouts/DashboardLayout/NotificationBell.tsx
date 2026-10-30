// The bell in the top bar: a red count of unread notifications and a dropdown where each one
// can be opened, marked as read or deleted. "View all" goes to the full Notifications page.
import { useState, type MouseEvent } from 'react'
import { Badge, Box, Button, IconButton, Popover, Tooltip, Typography } from '@mui/material'
import { Bell, Check, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BikeLoader } from '@/components/ui/BikeLoader'
import {
  useDeleteNotification, useMarkAllNotificationsRead, useMarkNotificationRead, useMyNotifications, type AppNotification,
} from '@/features/notifications/data/notificationsApi'

const RED = '#B91C1C'
const RED_TINT = '#FEF2F2'
const TZ = 'Africa/Johannesburg'

/** "Just now", "5 min ago", "3 h ago", else the date. */
function ago(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  if (minutes < 24 * 60) return `${Math.round(minutes / 60)} h ago`
  return new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short', timeZone: TZ }).format(new Date(iso))
}

export function NotificationBell({ notificationsPath, className }: { notificationsPath: string; className?: string }) {
  const navigate = useNavigate()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const { data = [], isLoading } = useMyNotifications()
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()
  const remove = useDeleteNotification()
  const unread = data.filter((n) => !n.isRead).length
  const latest = data.slice(0, 8)

  const close = () => setAnchor(null)
  const open = (note: AppNotification) => {
    if (!note.isRead) markRead.mutate(note.id)
    close()
    if (note.link) navigate(note.link)
  }
  const stop = (event: MouseEvent, action: () => void) => { event.stopPropagation(); action() }

  return <>
    <IconButton onClick={(event) => setAnchor(event.currentTarget)} className={className}
      aria-label={unread ? `Notifications: ${unread} unread` : 'Notifications'} aria-haspopup="true" aria-expanded={Boolean(anchor)}>
      <Badge badgeContent={unread} max={99} color="error" invisible={!unread}
        sx={{ '& .MuiBadge-badge': { bgcolor: RED, fontWeight: 700, fontSize: 11, minWidth: 18, height: 18 } }}>
        <Bell size={21} />
      </Badge>
    </IconButton>

    <Popover open={Boolean(anchor)} anchorEl={anchor} onClose={close}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      slotProps={{ paper: { sx: { width: 380, maxWidth: 'calc(100vw - 32px)', borderRadius: '14px', mt: 1, boxShadow: '0 12px 32px rgba(26,32,44,.14)' } } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, borderBottom: '1px solid var(--icep-border)' }}>
        <Typography sx={{ fontWeight: 700, fontSize: 15 }}>
          Notifications{unread > 0 && <Box component="span" sx={{ ml: 1, px: 1, py: '1px', borderRadius: 999, bgcolor: RED, color: '#fff', fontSize: 12 }}>{unread} new</Box>}
        </Typography>
        <Button size="small" disabled={!unread || markAll.isPending} onClick={() => markAll.mutate()} sx={{ textTransform: 'none', fontWeight: 600 }}>
          Mark all as read
        </Button>
      </Box>

      <Box sx={{ maxHeight: 420, overflowY: 'auto' }}>
        {isLoading ? <Box sx={{ py: 1 }}><BikeLoader label="Loading notifications" size={105} /></Box>
          : latest.length === 0 ? <Typography sx={{ p: 3, textAlign: 'center', color: 'var(--icep-secondary)', fontSize: 14 }}>No notifications yet.</Typography>
          : latest.map((note) => (
            <Box key={note.id} role="button" tabIndex={0} onClick={() => open(note)}
              onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(note) } }}
              aria-label={`${note.isRead ? '' : 'Unread: '}${note.title}. ${note.message}`}
              sx={{
                display: 'flex', gap: 1.25, px: 2, py: 1.5, cursor: 'pointer', borderBottom: '1px solid var(--icep-border)',
                borderLeft: `4px solid ${note.isRead ? 'transparent' : RED}`, bgcolor: note.isRead ? 'transparent' : RED_TINT,
                '&:hover': { bgcolor: note.isRead ? '#F7FAFD' : '#FDE8E8' }, '&:focus-visible': { outline: '2px solid var(--icep-primary)', outlineOffset: -2 },
              }}>
              <Box sx={{ width: 8, height: 8, mt: '6px', borderRadius: '50%', flex: 'none', bgcolor: note.isRead ? 'transparent' : RED }} aria-hidden="true" />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 14, color: note.isRead ? 'var(--icep-heading)' : RED }}>{note.title}</Typography>
                <Typography sx={{ fontSize: 13, color: 'var(--icep-secondary)', lineHeight: 1.45, overflowWrap: 'anywhere' }}>{note.message}</Typography>
                <Typography sx={{ fontSize: 12, color: 'var(--icep-secondary)', mt: 0.5 }}>{ago(note.createdAt)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                {!note.isRead && <Tooltip title="Mark as read"><IconButton size="small" aria-label={`Mark "${note.title}" as read`} onClick={(event) => stop(event, () => markRead.mutate(note.id))}><Check size={16} /></IconButton></Tooltip>}
                <Tooltip title="Delete"><IconButton size="small" aria-label={`Delete "${note.title}"`} onClick={(event) => stop(event, () => remove.mutate(note.id))} sx={{ color: RED }}><Trash2 size={16} /></IconButton></Tooltip>
              </Box>
            </Box>
          ))}
      </Box>

      <Box sx={{ p: 1, textAlign: 'center' }}>
        <Button fullWidth onClick={() => { close(); navigate(notificationsPath) }} sx={{ textTransform: 'none', fontWeight: 600 }}>View all notifications</Button>
      </Box>
    </Popover>
  </>
}

export default NotificationBell
