import { useState, useMemo, useEffect } from 'react'
import { Tasks } from '@/api/services/tasks.service'
import { Projects } from '@/api/services/projects.service'
import { useAuth } from '@/hooks/useAuth'
import {
  Alert,
  DialogContent,
  Snackbar,
} from '@mui/material'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Share
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import styles from './CalendarPage.module.css'

export type EventColor = 'blue' | 'green' | 'amber' | 'red'

export interface CalendarEventItem {
  id: string
  title: string
  date: string
  project: string
  projectName: string
  assignee: string
  status: string
  color: EventColor
}

interface ApiCalendarTask {
  id: string
  title: string
  projectId: string
  projectName: string
  assignedToId?: string | null
  assigneeName?: string | null
  startDate?: string | null
  dueDate?: string | null
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED'
  approvedAt?: string | null
}

function toCalendarEvent(task: ApiCalendarTask): CalendarEventItem | null {
  const date = task.dueDate ?? task.startDate
  if (!date) return null

  const status = task.status === 'TODO'
    ? 'To Do'
    : task.status === 'IN_PROGRESS'
      ? 'In Progress'
      : task.approvedAt
        ? 'Completed'
        : 'Submitted'
  const color: EventColor = task.status === 'TODO'
    ? 'blue'
    : task.status === 'IN_PROGRESS'
      ? 'green'
      : task.approvedAt
        ? 'blue'
        : 'amber'

  return {
    id: task.id,
    title: task.title,
    date: date.slice(0, 10),
    project: task.projectId,
    projectName: task.projectName,
    assignee: task.assigneeName || 'Unassigned',
    status,
    color,
  }
}

interface CalendarCell {
  dateString: string
  dayNumber: number
  isCurrentMonth: boolean
  hasBadge?: boolean
  badgeValue?: number
}

// Fixed 35 days matching the October 2026 mockup
const october2026Cells: CalendarCell[] = [
  { dateString: '2026-09-28', dayNumber: 28, isCurrentMonth: false },
  { dateString: '2026-09-29', dayNumber: 29, isCurrentMonth: false },
  { dateString: '2026-09-30', dayNumber: 30, isCurrentMonth: false, hasBadge: true, badgeValue: 6 },
  { dateString: '2026-10-01', dayNumber: 1, isCurrentMonth: true },
  { dateString: '2026-10-02', dayNumber: 2, isCurrentMonth: true },
  { dateString: '2026-10-03', dayNumber: 3, isCurrentMonth: true },
  { dateString: '2026-10-04', dayNumber: 4, isCurrentMonth: true },
  { dateString: '2026-10-05', dayNumber: 5, isCurrentMonth: true },
  { dateString: '2026-10-06', dayNumber: 6, isCurrentMonth: true },
  { dateString: '2026-10-07', dayNumber: 7, isCurrentMonth: true },
  { dateString: '2026-10-08', dayNumber: 8, isCurrentMonth: true },
  { dateString: '2026-10-09', dayNumber: 9, isCurrentMonth: true },
  { dateString: '2026-10-10', dayNumber: 10, isCurrentMonth: true },
  { dateString: '2026-10-11', dayNumber: 11, isCurrentMonth: true },
  { dateString: '2026-10-12', dayNumber: 12, isCurrentMonth: true },
  { dateString: '2026-10-13', dayNumber: 13, isCurrentMonth: true },
  { dateString: '2026-10-14', dayNumber: 14, isCurrentMonth: true },
  { dateString: '2026-10-15', dayNumber: 15, isCurrentMonth: true },
  { dateString: '2026-10-16', dayNumber: 16, isCurrentMonth: true },
  { dateString: '2026-10-17', dayNumber: 17, isCurrentMonth: true },
  { dateString: '2026-10-18', dayNumber: 18, isCurrentMonth: true },
  { dateString: '2026-10-19', dayNumber: 19, isCurrentMonth: true },
  { dateString: '2026-10-20', dayNumber: 20, isCurrentMonth: true },
  { dateString: '2026-10-21', dayNumber: 21, isCurrentMonth: true },
  { dateString: '2026-10-22', dayNumber: 22, isCurrentMonth: true },
  { dateString: '2026-10-23', dayNumber: 23, isCurrentMonth: true },
  { dateString: '2026-10-24', dayNumber: 24, isCurrentMonth: true },
  { dateString: '2026-10-25', dayNumber: 25, isCurrentMonth: true },
  { dateString: '2026-10-26', dayNumber: 26, isCurrentMonth: true },
  { dateString: '2026-10-27', dayNumber: 27, isCurrentMonth: true },
  { dateString: '2026-10-28', dayNumber: 28, isCurrentMonth: true },
  { dateString: '2026-10-29', dayNumber: 29, isCurrentMonth: true },
  { dateString: '2026-10-30', dayNumber: 30, isCurrentMonth: true },
  { dateString: '2026-10-31', dayNumber: 31, isCurrentMonth: true },
  { dateString: '2026-11-01', dayNumber: 1, isCurrentMonth: false },
]

export function CalendarPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<CalendarEventItem[]>([])
  const [currentMonthName, setCurrentMonthName] = useState('October 2026')
  const [currentView, setCurrentView] = useState<'Month' | 'Week' | 'Day'>('Month')

  // Top Filters
  const [selectedProject, setSelectedProject] = useState('')
  const [projectsList, setProjectsList] = useState<{ id: string, name: string }[]>([])
  const [selectedAssignee, setSelectedAssignee] = useState('All Assignees')
  const [selectedStatus, setSelectedStatus] = useState('All Statuses')

  // Modals & Feedback
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Form State
  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventDate, setNewEventDate] = useState('2026-10-15')
  const [newEventProject, setNewEventProject] = useState('')

  const canManageTasks = user?.role === 'ADMIN' || user?.role === 'MENTOR' || user?.role === 'INTERN'

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

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canManageTasks) return 
    if (!newEventTitle.trim()) return

    const payload = {
      title: newEventTitle.trim(),
      projectId: newEventProject,
      dueDate: newEventDate,
      priority: 'MEDIUM',
      status: 'TODO',
    }

    try {
      await Tasks.create(payload)
      const data = await Tasks.getCalendarEvents()
      setEvents((data as ApiCalendarTask[]).map(toCalendarEvent).filter((event): event is CalendarEventItem => event !== null))
      
      setIsAddModalOpen(false)
      setNewEventTitle('')
      setToastMessage('Task saved and added to the calendar.')
    } catch (error: any) {
      console.error(error)
      setToastMessage(error.response?.data?.message || 'Permission Denied: You do not have Scrum Master rights for this project.')
    }
  }

  const handleDeleteEvent = async (id: string) => {
    if (!canManageTasks) return
    try {
      await Tasks.delete(id)
      setEvents((prev) => prev.filter((ev) => ev.id !== id))
      setSelectedEvent(null)
      setToastMessage('Event deleted from database.')
    } catch (error: any) {
      console.error(error)
      setToastMessage('Permission Denied: Cannot delete this event.')
    }
  }

  useEffect(() => {
    Projects.list()
      .then((response) => {
        const data = Array.isArray(response) ? response : (response as any).data;
        setProjectsList(data)
        if (data.length > 0) {
          setSelectedProject(data[0].id)
          setNewEventProject(data[0].id)
        }
      })
      .catch(err => console.error("Failed to load projects:", err))
  }, [])

  useEffect(() => {
    Tasks.getCalendarEvents()
      .then((data) => setEvents((data as ApiCalendarTask[]).map(toCalendarEvent).filter((event): event is CalendarEventItem => event !== null)))
      .catch(err => console.error("Failed to load calendar events:", err))
  }, [])

  return (
    <main className={styles.page}>
      <section className={styles.topSection} aria-label="Calendar controls">
        <div className={styles.actionRow}>
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
              <span>Add Task</span>
            </button>
          )}
        </div>

        <div className={styles.filtersRow}>
          <div className={styles.filterSelectWrapper}>
            <select
              className={styles.filterSelect}
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              aria-label="Filter by project"
            >
              {projectsList.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className={styles.filterSelectChevron} aria-hidden="true" />
          </div>

          <div className={styles.filterSelectWrapper}>
            <select
              className={styles.filterSelect}
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              aria-label="Filter by assignee"
            >
              <option value="All Assignees">All Assignees</option>
              {[...new Set(events.map((event) => event.assignee))].map((assignee) => (
                <option key={assignee} value={assignee}>{assignee}</option>
              ))}
            </select>
            <ChevronDown size={16} className={styles.filterSelectChevron} aria-hidden="true" />
          </div>

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

      <section className={styles.calendarCard} aria-labelledby="calendar-month-heading">
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

        {currentView === 'Month' ? (
          <div>
            <div className={styles.daysHeader} role="row">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className={styles.dayLabel} role="columnheader">
                  {day}
                </div>
              ))}
            </div>
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
                          className={`${styles.eventPill} ${ev.color === 'green'
                            ? styles.eventGreen
                            : ev.color === 'amber'
                              ? styles.eventAmber
                              : ev.color === 'red'
                                ? styles.eventRed
                                : styles.eventBlue
                            }`}
                          onClick={() => setSelectedEvent(ev)}
                        >
                          {ev.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
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
                        Project: {ev.projectName} • Assignee: {ev.assignee} • Status: {ev.status}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <Modal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Task to Calendar"
        maxWidth="sm"
        fullWidth
        actions={
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', width: '100%' }}>
            <Button appearance="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button appearance="primary" onClick={handleAddEvent}>
              Save Task
            </Button>
          </div>
        }
      >
        <DialogContent dividers sx={{ borderBottom: '1px solid #E2E8F0' }}>
          <form className={styles.modalForm} onSubmit={handleAddEvent} id="new-event-form">
            <div className={styles.formGroup}>
              <label htmlFor="event-title-input" className={styles.formLabel}>
                Task Title
              </label>
              <input
                id="event-title-input"
                type="text"
                className={styles.formInput}
                placeholder="e.g. Build the login page"
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
                {projectsList.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

          </form>
        </DialogContent>
      </Modal>

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
              <strong>Project:</strong> {selectedEvent.projectName}
            </p>
            <p style={{ margin: '0 0 10px' }}>
              <strong>Date:</strong> {selectedEvent.date}
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

      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={3500}
        onClose={() => setToastMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToastMessage(null)}
          severity={toastMessage?.includes('Denied') || toastMessage?.includes('Error') ? 'error' : 'success'}
          sx={{ width: '100%', borderRadius: '8px' }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </main>
  )
}

export default CalendarPage
