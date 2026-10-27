import { useState, useMemo } from 'react'
import {
  Alert,
  DialogContent,
  Menu,
  MenuItem,
  Snackbar,
} from '@mui/material'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Share,
  UserCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import styles from './CalendarPage.module.css'

export type EventColor = 'blue' | 'blue-meeting' | 'green' | 'amber' | 'red'
export type UserRole = 'Intern' | 'Scrum Master' | 'Mentor'

export interface CalendarEventItem {
  id: string
  title: string
  date: string // format 'YYYY-MM-DD'
  time?: string
  project: string
  assignee: string
  status: string
  color: EventColor
}

const initialEvents: CalendarEventItem[] = [
  {
    id: 'ev-1',
    title: 'Kickoff Meeting',
    date: '2026-09-28',
    time: '09:00',
    project: 'Software Dev Alpha',
    assignee: 'Pat Naidoo',
    status: 'Completed',
    color: 'blue-meeting',
  },
  {
    id: 'ev-2',
    title: 'Schema V1',
    date: '2026-09-30',
    project: 'Software Dev Alpha',
    assignee: 'Sarah Johnson',
    status: 'Completed',
    color: 'green',
  },
  {
    id: 'ev-3',
    title: 'Core APIs',
    date: '2026-09-30',
    project: 'Software Dev Alpha',
    assignee: 'Thabo Molefe',
    status: 'Completed',
    color: 'green',
  },
  {
    id: 'ev-4',
    title: 'Gather Specs',
    date: '2026-10-01',
    project: 'Software Dev Alpha',
    assignee: 'Pat Naidoo',
    status: 'Completed',
    color: 'blue',
  },
  {
    id: 'ev-5',
    title: 'Schema Review',
    date: '2026-10-05',
    project: 'Software Dev Alpha',
    assignee: 'Morgan Mentor',
    status: 'In Progress',
    color: 'green',
  },
  {
    id: 'ev-6',
    title: 'Build UI',
    date: '2026-10-08',
    project: 'Software Dev Alpha',
    assignee: 'Sarah Johnson',
    status: 'In Progress',
    color: 'amber',
  },
  {
    id: 'ev-7',
    title: 'Build UI',
    date: '2026-10-09',
    project: 'Software Dev Alpha',
    assignee: 'Sarah Johnson',
    status: 'In Progress',
    color: 'amber',
  },
  {
    id: 'ev-8',
    title: 'Security Check',
    date: '2026-10-10',
    project: 'Software Dev Alpha',
    assignee: 'Pat Naidoo',
    status: 'Blocked',
    color: 'red',
  },
  {
    id: 'ev-9',
    title: 'Beta Launch',
    date: '2026-10-14',
    project: 'Software Dev Alpha',
    assignee: 'Pat Naidoo',
    status: 'Submitted',
    color: 'amber',
  },
]

interface CalendarCell {
  dateString: string
  dayNumber: number
  isCurrentMonth: boolean
  hasBadge?: boolean
  badgeValue?: number
}

// Fixed 35 days matching the October 2026 mockup
const october2026Cells: CalendarCell[] = [
  // Week 1
  { dateString: '2026-09-28', dayNumber: 28, isCurrentMonth: false },
  { dateString: '2026-09-29', dayNumber: 29, isCurrentMonth: false },
  { dateString: '2026-09-30', dayNumber: 30, isCurrentMonth: false, hasBadge: true, badgeValue: 6 },
  { dateString: '2026-10-01', dayNumber: 1, isCurrentMonth: true },
  { dateString: '2026-10-02', dayNumber: 2, isCurrentMonth: true },
  { dateString: '2026-10-03', dayNumber: 3, isCurrentMonth: true },
  { dateString: '2026-10-04', dayNumber: 4, isCurrentMonth: true },

  // Week 2
  { dateString: '2026-10-05', dayNumber: 5, isCurrentMonth: true },
  { dateString: '2026-10-06', dayNumber: 6, isCurrentMonth: true },
  { dateString: '2026-10-07', dayNumber: 7, isCurrentMonth: true },
  { dateString: '2026-10-08', dayNumber: 8, isCurrentMonth: true },
  { dateString: '2026-10-09', dayNumber: 9, isCurrentMonth: true },
  { dateString: '2026-10-10', dayNumber: 10, isCurrentMonth: true },
  { dateString: '2026-10-11', dayNumber: 11, isCurrentMonth: true },

  // Week 3
  { dateString: '2026-10-12', dayNumber: 12, isCurrentMonth: true },
  { dateString: '2026-10-13', dayNumber: 13, isCurrentMonth: true },
  { dateString: '2026-10-14', dayNumber: 14, isCurrentMonth: true },
  { dateString: '2026-10-15', dayNumber: 15, isCurrentMonth: true },
  { dateString: '2026-10-16', dayNumber: 16, isCurrentMonth: true },
  { dateString: '2026-10-17', dayNumber: 17, isCurrentMonth: true },
  { dateString: '2026-10-18', dayNumber: 18, isCurrentMonth: true },

  // Week 4
  { dateString: '2026-10-19', dayNumber: 19, isCurrentMonth: true },
  { dateString: '2026-10-20', dayNumber: 20, isCurrentMonth: true },
  { dateString: '2026-10-21', dayNumber: 21, isCurrentMonth: true },
  { dateString: '2026-10-22', dayNumber: 22, isCurrentMonth: true },
  { dateString: '2026-10-23', dayNumber: 23, isCurrentMonth: true },
  { dateString: '2026-10-24', dayNumber: 24, isCurrentMonth: true },
  { dateString: '2026-10-25', dayNumber: 25, isCurrentMonth: true },

  // Week 5
  { dateString: '2026-10-26', dayNumber: 26, isCurrentMonth: true },
  { dateString: '2026-10-27', dayNumber: 27, isCurrentMonth: true },
  { dateString: '2026-10-28', dayNumber: 28, isCurrentMonth: true },
  { dateString: '2026-10-29', dayNumber: 29, isCurrentMonth: true },
  { dateString: '2026-10-30', dayNumber: 30, isCurrentMonth: true },
  { dateString: '2026-10-31', dayNumber: 31, isCurrentMonth: true },
  { dateString: '2026-11-01', dayNumber: 1, isCurrentMonth: false },
]

export function CalendarPage() {
  const [events, setEvents] = useState<CalendarEventItem[]>(initialEvents)
  const [currentMonthName, setCurrentMonthName] = useState('October 2026')
  const [currentView, setCurrentView] = useState<'Month' | 'Week' | 'Day'>('Month')

  // Simulated Authentication / Role State to demonstrate workflow restrictions
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('Scrum Master')
  const [roleAnchorEl, setRoleAnchorEl] = useState<null | HTMLElement>(null)

  // Top Filters
  const [selectedProject, setSelectedProject] = useState('Software Dev Alpha')
  const [selectedAssignee, setSelectedAssignee] = useState('All Assignees')
  const [selectedStatus, setSelectedStatus] = useState('All Statuses')

  // Modals & Feedback
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Form State
  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventDate, setNewEventDate] = useState('2026-10-15')
  const [newEventTime, setNewEventTime] = useState('')
  const [newEventType, setNewEventType] = useState<EventColor>('blue')
  const [newEventProject, setNewEventProject] = useState('Software Dev Alpha')

  // Role Permissions
  const canManageTasks = currentUserRole === 'Scrum Master' || currentUserRole === 'Mentor'

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (selectedProject !== 'All Projects' && ev.project !== selectedProject) return false
      if (selectedAssignee !== 'All Assignees' && ev.assignee !== selectedAssignee) return false
      if (selectedStatus !== 'All Statuses' && ev.status !== selectedStatus) return false
      return true
    })
  }, [events, selectedProject, selectedAssignee, selectedStatus])

  const handleExport = () => {
    setToastMessage(`Calendar for ${currentMonthName} exported successfully.`)
  }

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canManageTasks) return // Security check mirroring backend validation
    if (!newEventTitle.trim()) return

    const createdEvent: CalendarEventItem = {
      id: `ev-${Date.now()}`,
      title: newEventTitle.trim(),
      date: newEventDate,
      time: newEventTime.trim() || undefined,
      project: newEventProject,
      assignee: 'Pat Naidoo',
      status: 'To Do',
      color: newEventTime ? 'blue-meeting' : newEventType,
    }

    setEvents((prev) => [...prev, createdEvent])
    setIsAddModalOpen(false)
    setNewEventTitle('')
    setNewEventTime('')
    setToastMessage(`Event "${createdEvent.title}" added to calendar.`)
  }

  const handleDeleteEvent = (id: string) => {
    if (!canManageTasks) return
    setEvents((prev) => prev.filter((ev) => ev.id !== id))
    setSelectedEvent(null)
    setToastMessage('Event removed.')
  }

  return (
    <main className={styles.page}>
      
      {/* Simulation Banner for testing roles */}
      <Alert severity="info" sx={{ borderRadius: 2, display: 'flex', alignItems: 'center' }}>
        <strong>Workflow Simulator:</strong> You are currently viewing this page as a <strong>{currentUserRole}</strong>. 
        {currentUserRole === 'Intern' 
          ? " As an intern, your calendar schedule is read-only. You cannot manually add or delete global tasks/events." 
          : " You have permission to add, edit, and plan calendar tasks/events for this project."}
      </Alert>

      {/* Top Controls Section */}
      <section className={styles.topSection} aria-label="Calendar controls">
        {/* Action Buttons Row */}
        <div className={styles.actionRow}>
          
          {/* Mock Role Switcher (For demonstration purposes) */}
          <button type="button" className={styles.exportButton} onClick={(e) => setRoleAnchorEl(e.currentTarget)}>
            <UserCircle2 size={16} strokeWidth={2} aria-hidden="true" />
            <span>View As: {currentUserRole}</span>
          </button>
          <Menu
            anchorEl={roleAnchorEl}
            open={Boolean(roleAnchorEl)}
            onClose={() => setRoleAnchorEl(null)}
            slotProps={{ paper: { sx: { borderRadius: '10px', minWidth: 150 } } }}
          >
            {(['Intern', 'Scrum Master', 'Mentor'] as UserRole[]).map((role) => (
              <MenuItem
                key={role}
                selected={role === currentUserRole}
                onClick={() => { setCurrentUserRole(role); setRoleAnchorEl(null); }}
                sx={{ fontSize: 13.5 }}
              >
                {role}
              </MenuItem>
            ))}
          </Menu>

          <button
            type="button"
            className={styles.exportButton}
            onClick={handleExport}
            id="calendar-export-btn"
          >
            <Share size={16} strokeWidth={2} aria-hidden="true" />
            <span>Export</span>
          </button>

          {canManageTasks && (
            <button
              type="button"
              className={styles.addEventButton}
              onClick={() => setIsAddModalOpen(true)}
              id="calendar-add-event-btn"
            >
              <Plus size={18} strokeWidth={2.5} aria-hidden="true" />
              <span>Add Event</span>
            </button>
          )}
        </div>

        {/* Filters Row */}
        <div className={styles.filtersRow}>
          {/* Project Filter */}
          <div className={styles.filterSelectWrapper}>
            <select
              className={styles.filterSelect}
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              aria-label="Filter by project"
            >
              <option value="Software Dev Alpha">Software Dev Alpha</option>
              <option value="Network Security Audit">Network Security Audit</option>
              <option value="Data Migration Phase 2">Data Migration Phase 2</option>
              <option value="Mobile App Beta">Mobile App Beta</option>
              <option value="All Projects">All Projects</option>
            </select>
            <ChevronDown size={16} className={styles.filterSelectChevron} aria-hidden="true" />
          </div>

          {/* Assignees Filter */}
          <div className={styles.filterSelectWrapper}>
            <select
              className={styles.filterSelect}
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              aria-label="Filter by assignee"
            >
              <option value="All Assignees">All Assignees</option>
              <option value="Pat Naidoo">Pat Naidoo</option>
              <option value="Morgan Mentor">Morgan Mentor</option>
              <option value="Sarah Johnson">Sarah Johnson</option>
              <option value="Thabo Molefe">Thabo Molefe</option>
            </select>
            <ChevronDown size={16} className={styles.filterSelectChevron} aria-hidden="true" />
          </div>

          {/* Statuses Filter */}
          <div className={styles.filterSelectWrapper}>
            <select
              className={styles.filterSelect}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="All Statuses">All Statuses</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Submitted">Submitted</option>
              <option value="Completed">Completed</option>
              <option value="Blocked">Blocked</option>
            </select>
            <ChevronDown size={16} className={styles.filterSelectChevron} aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* Main Calendar Card */}
      <section className={styles.calendarCard} aria-labelledby="calendar-month-heading">
        {/* Calendar Card Toolbar */}
        <div className={styles.calendarToolbar}>
          <div className={styles.navigationControls}>
            <div className={styles.navButtonGroup}>
              <button
                type="button"
                className={styles.navArrowBtn}
                onClick={() => setCurrentMonthName('September 2026')}
                aria-label="Previous month"
              >
                <ChevronLeft size={18} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={styles.navArrowBtn}
                onClick={() => setCurrentMonthName('November 2026')}
                aria-label="Next month"
              >
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </div>

            <h2 id="calendar-month-heading" className={styles.monthHeading}>
              {currentMonthName}
            </h2>

            <button
              type="button"
              className={styles.todayButton}
              onClick={() => setCurrentMonthName('October 2026')}
            >
              Today
            </button>
          </div>

          {/* View Switcher Tabs */}
          <div className={styles.viewSwitcher} role="tablist" aria-label="Calendar view selector">
            {(['Month', 'Week', 'Day'] as const).map((view) => (
              <button
                key={view}
                type="button"
                role="tab"
                aria-selected={currentView === view}
                className={`${styles.viewButton} ${currentView === view ? styles.viewButtonActive : ''}`}
                onClick={() => setCurrentView(view)}
              >
                {view}
              </button>
            ))}
          </div>
        </div>

        {/* View Content */}
        {currentView === 'Month' ? (
          <div>
            {/* Days Header */}
            <div className={styles.daysHeader} role="row">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className={styles.dayLabel} role="columnheader">
                  {day}
                </div>
              ))}
            </div>

            {/* 35 Calendar Cells */}
            <div className={styles.monthGrid} role="grid">
              {october2026Cells.map((cell) => {
                const cellEvents = filteredEvents.filter((ev) => ev.date === cell.dateString)

                return (
                  <div key={cell.dateString} className={styles.cell} role="gridcell">
                    <div className={styles.cellHeader}>
                      {cell.hasBadge && (
                        <span className={styles.todayBadge} title="Today's indicator">
                          {cell.badgeValue}
                        </span>
                      )}
                      <span className={cell.isCurrentMonth ? styles.cellDayNumber : styles.cellDayFaded}>
                        {cell.dayNumber}
                      </span>
                    </div>

                    <div className={styles.eventList}>
                      {cellEvents.map((ev) => {
                        if (ev.color === 'blue-meeting') {
                          return (
                            <button
                              key={ev.id}
                              type="button"
                              className={`${styles.eventPill} ${styles.eventBlueMeeting}`}
                              onClick={() => setSelectedEvent(ev)}
                              title={`${ev.time ? `${ev.time} ` : ''}${ev.title}`}
                            >
                              <span className={styles.meetingDot} aria-hidden="true" />
                              <span>{ev.time ? `${ev.time} ` : ''}{ev.title}</span>
                            </button>
                          )
                        }

                        const colorClass =
                          ev.color === 'green'
                            ? styles.eventGreen
                            : ev.color === 'amber'
                            ? styles.eventAmber
                            : ev.color === 'red'
                            ? styles.eventRed
                            : styles.eventBlue

                        return (
                          <button
                            key={ev.id}
                            type="button"
                            className={`${styles.eventPill} ${colorClass}`}
                            onClick={() => setSelectedEvent(ev)}
                            title={ev.title}
                          >
                            {ev.title}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : currentView === 'Week' ? (
          /* Week View */
          <div className={styles.weekContainer}>
            <div className={styles.weekHeader}>
              {['Mon 5', 'Tue 6', 'Wed 7', 'Thu 8', 'Fri 9', 'Sat 10', 'Sun 11'].map((dayStr, index) => {
                const dayDateStr = `2026-10-0${index + 5}`
                const dayEvents = filteredEvents.filter((ev) => ev.date === dayDateStr)

                return (
                  <div key={dayStr} className={styles.weekDayCol}>
                    <div className={styles.weekDayTitle}>{dayStr}</div>
                    <div className={styles.eventList}>
                      {dayEvents.map((ev) => (
                        <button
                          key={ev.id}
                          type="button"
                          className={`${styles.eventPill} ${
                            ev.color === 'green'
                              ? styles.eventGreen
                              : ev.color === 'amber'
                              ? styles.eventAmber
                              : ev.color === 'red'
                              ? styles.eventRed
                              : styles.eventBlue
                          }`}
                          onClick={() => setSelectedEvent(ev)}
                        >
                          {ev.time ? `${ev.time} ` : ''}{ev.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          /* Day View */
          <div className={styles.weekContainer}>
            <div style={{ maxWidth: 500, margin: '0 auto', width: '100%' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>
                Schedule for Wednesday, Oct 14, 2026
              </h3>
              <div className={styles.eventList}>
                {filteredEvents
                  .filter((ev) => ev.date === '2026-10-14' || ev.date === '2026-10-08')
                  .map((ev) => (
                    <div
                      key={ev.id}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        background: '#FFFFFF',
                        marginBottom: '8px',
                      }}
                    >
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{ev.title}</h4>
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: '#718096' }}>
                        Project: {ev.project} • Assignee: {ev.assignee} • Status: {ev.status}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Add Event Modal */}
      <Modal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Calendar Event"
        maxWidth="sm"
        fullWidth
        actions={
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', width: '100%' }}>
            <Button appearance="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button appearance="primary" onClick={handleAddEvent}>
              Save Event
            </Button>
          </div>
        }
      >
        <DialogContent dividers sx={{ borderBottom: '1px solid #E2E8F0' }}>
          <form className={styles.modalForm} onSubmit={handleAddEvent} id="new-event-form">
            <div className={styles.formGroup}>
              <label htmlFor="event-title-input" className={styles.formLabel}>
                Event Title
              </label>
              <input
                id="event-title-input"
                type="text"
                className={styles.formInput}
                placeholder="e.g. Design Review Meeting"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className={styles.formGroup}>
                <label htmlFor="event-date-input" className={styles.formLabel}>
                  Date
                </label>
                <input
                  id="event-date-input"
                  type="date"
                  className={styles.formInput}
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="event-time-input" className={styles.formLabel}>
                  Time (Optional)
                </label>
                <input
                  id="event-time-input"
                  type="time"
                  className={styles.formInput}
                  value={newEventTime}
                  onChange={(e) => setNewEventTime(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="event-project-select" className={styles.formLabel}>
                Project
              </label>
              <select
                id="event-project-select"
                className={styles.modalSelect}
                value={newEventProject}
                onChange={(e) => setNewEventProject(e.target.value)}
              >
                <option value="Software Dev Alpha">Software Dev Alpha</option>
                <option value="Network Security Audit">Network Security Audit</option>
                <option value="Data Migration Phase 2">Data Migration Phase 2</option>
                <option value="Mobile App Beta">Mobile App Beta</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="event-type-select" className={styles.formLabel}>
                Category / Color
              </label>
              <select
                id="event-type-select"
                className={styles.modalSelect}
                value={newEventType}
                onChange={(e) => setNewEventType(e.target.value as EventColor)}
              >
                <option value="blue">Blue (Specs / General)</option>
                <option value="green">Green (Schema / API)</option>
                <option value="amber">Amber (UI / Milestone)</option>
                <option value="red">Red (Security / Critical)</option>
              </select>
            </div>
          </form>
        </DialogContent>
      </Modal>

      {/* Event Details Modal */}
      {selectedEvent && (
        <Modal
          open={Boolean(selectedEvent)}
          onClose={() => setSelectedEvent(null)}
          title={selectedEvent.title}
          maxWidth="xs"
          fullWidth
          actions={
            <div style={{ display: 'flex', gap: '10px', justifyContent: canManageTasks ? 'space-between' : 'flex-end', width: '100%' }}>
              {canManageTasks && (
                <Button appearance="danger" onClick={() => handleDeleteEvent(selectedEvent.id)}>
                  Delete
                </Button>
              )}
              <Button appearance="secondary" onClick={() => setSelectedEvent(null)}>
                Close
              </Button>
            </div>
          }
        >
          <DialogContent dividers sx={{ borderBottom: '1px solid #E2E8F0', fontSize: '13.5px' }}>
            <p style={{ margin: '0 0 10px' }}>
              <strong>Project:</strong> {selectedEvent.project}
            </p>
            <p style={{ margin: '0 0 10px' }}>
              <strong>Date:</strong> {selectedEvent.date}
              {selectedEvent.time ? ` at ${selectedEvent.time}` : ''}
            </p>
            <p style={{ margin: '0 0 10px' }}>
              <strong>Assignee:</strong> {selectedEvent.assignee}
            </p>
            <p style={{ margin: 0 }}>
              <strong>Status:</strong> {selectedEvent.status}
            </p>
          </DialogContent>
        </Modal>
      )}

      {/* Snackbar feedback notification */}
      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={3500}
        onClose={() => setToastMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToastMessage(null)}
          severity="success"
          sx={{ width: '100%', borderRadius: '8px' }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </main>
  )
}

export default CalendarPage