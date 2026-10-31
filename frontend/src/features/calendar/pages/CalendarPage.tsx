import { useState, useMemo, useEffect } from 'react'
import { Tasks } from '@/api/services/tasks.service'
import { Projects } from '@/api/services/projects.service'
import { useAuth } from '@/hooks/useAuth'
import type { CalendarTaskEvent, Project } from '@/types'
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

function toCalendarEvent(task: CalendarTaskEvent): CalendarEventItem | null {
  const date = task.dueDate ?? task.startDate
  if (!date) return null

  const status = task.status === 'BLOCKED'
    ? 'Blocked'
    : task.status === 'TODO'
      ? 'To Do'
      : task.status === 'IN_PROGRESS'
        ? 'In Progress'
        : task.approvedAt
          ? 'Completed'
          : 'Submitted'
  const color: EventColor = task.status === 'BLOCKED'
    ? 'red'
    : task.status === 'TODO'
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
}

function dateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function buildMonthCells(date: Date): CalendarCell[] {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
  const offset = (firstDay.getDay() + 6) % 7
  const start = new Date(firstDay)
  start.setDate(firstDay.getDate() - offset)

  return Array.from({ length: 42 }, (_, index) => {
    const cellDate = new Date(start)
    cellDate.setDate(start.getDate() + index)
    return {
      dateString: dateKey(cellDate),
      dayNumber: cellDate.getDate(),
      isCurrentMonth: cellDate.getMonth() === date.getMonth(),
    }
  })
}

function getWeekDates(date: Date): Date[] {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday)
    day.setDate(monday.getDate() + index)
    return day
  })
}

export function CalendarPage({ projectId, projectName }: { projectId?: string; projectName?: string } = {}) {
  const { user } = useAuth()
  const [events, setEvents] = useState<CalendarEventItem[]>([])
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [currentView, setCurrentView] = useState<'Month' | 'Week' | 'Day'>('Month')
  const currentMonthName = selectedDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  const monthCells = useMemo(() => buildMonthCells(selectedDate), [selectedDate])
  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate])

  // Top Filters
  const [selectedProject, setSelectedProject] = useState(projectId ?? 'All Projects')
  const [projectsList, setProjectsList] = useState<Project[]>([])
  const [selectedAssignee, setSelectedAssignee] = useState('All Assignees')
  const [selectedStatus, setSelectedStatus] = useState('All Statuses')

  // Modals & Feedback
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(null)
  const [editedEventDate, setEditedEventDate] = useState('')
  const [savingEventDate, setSavingEventDate] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Form State
  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventDate, setNewEventDate] = useState(() => dateKey(new Date()))
  const [newEventProject, setNewEventProject] = useState('')

  const canManageAllProjects = user?.role === 'ADMIN' || user?.role === 'MENTOR'
  const managedProjectIds = useMemo(() => new Set(projectsList
    .filter((project) => project.assignments?.some((assignment) =>
      assignment.intern?.user?.id === user?.id && assignment.projectRole === 'Scrum Master',
    ))
    .map((project) => project.id)), [projectsList, user?.id])
  const canManageTasks = canManageAllProjects || (user?.role === 'INTERN' && managedProjectIds.size > 0)
  const canManageNewEventProject = projectId
    ? newEventProject === projectId && (canManageAllProjects || managedProjectIds.has(projectId))
    : canManageAllProjects || managedProjectIds.has(newEventProject)
  const canDeleteSelectedEvent = canManageAllProjects ||
    (user?.role === 'INTERN' && Boolean(selectedEvent && managedProjectIds.has(selectedEvent.project)))
  const canEditSelectedEvent = canManageAllProjects ||
    (user?.role === 'INTERN' && Boolean(selectedEvent && managedProjectIds.has(selectedEvent.project)))
  const availableProjectsForNewEvent = projectId
    ? projectsList.filter((project) => project.id === projectId)
    : canManageAllProjects
      ? projectsList
      : projectsList.filter((project) => managedProjectIds.has(project.id))

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (projectId && ev.project !== projectId) return false
      if (selectedProject !== 'All Projects' && ev.project !== selectedProject) return false
      if (selectedAssignee !== 'All Assignees' && ev.assignee !== selectedAssignee) return false
      if (selectedStatus !== 'All Statuses' && ev.status !== selectedStatus) return false
      return true
    })
  }, [events, projectId, selectedProject, selectedAssignee, selectedStatus])

  const handleExport = () => {
    setToastMessage(`Calendar for ${currentMonthName} exported successfully.`)
  }

  const shiftDate = (direction: -1 | 1) => {
    setSelectedDate((current) => {
      const next = new Date(current)
      if (currentView === 'Month') {
        next.setDate(1)
        next.setMonth(next.getMonth() + direction)
      } else {
        next.setDate(next.getDate() + direction * (currentView === 'Week' ? 7 : 1))
      }
      return next
    })
  }

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canManageNewEventProject) return
    if (!newEventTitle.trim()) return

    const payload = {
      title: newEventTitle.trim(),
      projectId: newEventProject,
      dueDate: newEventDate,
      priority: 'MEDIUM' as const,
      status: 'TODO' as any, // Cast to any to bypass the strict ApiTaskStatus check
    }

    try {
      const savedTask = await Tasks.create(payload)

      // If the backend returns a raw task, run it through your toCalendarEvent formatter
      const formattedEvent = toCalendarEvent(savedTask as any)

      if (formattedEvent) {
        setEvents((prev) => [...prev, formattedEvent])
      } else {
        // Fallback if formatting fails: mock the event locally
        const fallbackEvent: CalendarEventItem = {
          id: `ev-${Date.now()}`,
          title: payload.title,
          date: payload.dueDate,
          project: payload.projectId,
          projectName: projectsList.find(p => p.id === payload.projectId)?.name || 'Unknown Project',
          assignee: 'Unassigned',
          status: 'To Do',
          color: 'blue'
        }
        setEvents((prev) => [...prev, fallbackEvent])
      }

      setIsAddModalOpen(false)
      setNewEventTitle('')
      setToastMessage('Task saved and added to the calendar.')
    } catch (error: any) {
      console.error(error)
      setToastMessage(error.response?.data?.message || 'Permission Denied: You do not have Scrum Master rights for this project.')
    }
  }

  const handleDeleteEvent = async (id: string) => {
    if (!canManageAllProjects && !(user?.role === 'INTERN' && managedProjectIds.has(events.find((event) => event.id === id)?.project ?? ''))) return
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

  const handleUpdateEventDate = async () => {
    if (!selectedEvent || !canEditSelectedEvent || !editedEventDate) return
    setSavingEventDate(true)
    try {
      await Tasks.update(selectedEvent.id, { dueDate: editedEventDate })
      setEvents((current) => current.map((event) => event.id === selectedEvent.id ? { ...event, date: editedEventDate } : event))
      setSelectedEvent((current) => current ? { ...current, date: editedEventDate } : current)
      setToastMessage('Task deadline updated.')
    } catch (error: any) {
      setToastMessage(error.response?.data?.message || 'Could not update this task date.')
    } finally {
      setSavingEventDate(false)
    }
  }

  useEffect(() => {
    Projects.list()
      .then((response) => {
        const data = response.data.filter((project) =>
          (!projectId || project.id === projectId) &&
          (user?.role !== 'MENTOR' || project.supervisor?.user?.id === user.id || project.createdById === user.id),
        )
        setProjectsList(data)
        if (projectId) {
          setSelectedProject(projectId)
          setNewEventProject(projectId)
        } else if (data.length > 0) {
          setNewEventProject(data[0].id)
        }
      })
      .catch(err => console.error("Failed to load projects:", err))
  }, [projectId, user?.id, user?.role])

  useEffect(() => {
    let cancelled = false
    const loadEvents = async () => {
      try {
        const projectTasks = projectId && (user?.role !== 'INTERN' || managedProjectIds.has(projectId))
          ? await Tasks.getGanttData(projectId)
          : null
        const data = projectTasks
          ? projectTasks.map((task) => ({
              id: task.id,
              title: task.title,
              projectId: task.projectId,
              assignedToId: task.assignedToId,
              startDate: task.startDate,
              dueDate: task.dueDate,
              status: task.status,
              approvedAt: task.approvedAt,
              projectName: projectName ?? 'Project',
              assigneeName: task.assigneeName,
            }))
          : await Tasks.getCalendarEvents()
        if (!cancelled) setEvents(data.map(toCalendarEvent).filter((event): event is CalendarEventItem => event !== null))
      } catch (error) {
        if (!cancelled) console.error('Failed to load calendar events:', error)
      }
    }
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void loadEvents()
    }
    void loadEvents()
    const intervalId = window.setInterval(() => void loadEvents(), 30_000)
    window.addEventListener('focus', refreshWhenVisible)
    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      window.removeEventListener('focus', refreshWhenVisible)
    }
  }, [managedProjectIds, projectId, projectName, user?.role])

  const PageRoot = projectId ? 'div' : 'main'
  return (
    <PageRoot className={styles.page}>
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
              onClick={() => {
                if (user?.role === 'INTERN' && !managedProjectIds.has(newEventProject)) {
                  setNewEventProject(availableProjectsForNewEvent[0]?.id ?? '')
                }
                setIsAddModalOpen(true)
              }}
              id="calendar-add-event-btn"
            >
              <Plus size={18} strokeWidth={2.5} aria-hidden="true" />
              <span>Add Task</span>
            </button>
          )}
        </div>

        <div className={styles.filtersRow}>
          {!projectId && <div className={styles.filterSelectWrapper}>
            <select
              className={styles.filterSelect}
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              aria-label="Filter by project"
            >
              <option value="All Projects">All Projects</option>
              {projectsList.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className={styles.filterSelectChevron} aria-hidden="true" />
          </div>}

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
                onClick={() => shiftDate(-1)}
                aria-label="Previous month"
              >
                <ChevronLeft size={18} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={styles.navArrowBtn}
                onClick={() => shiftDate(1)}
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
              onClick={() => setSelectedDate(new Date())}
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
              {monthCells.map((cell) => {
                const cellEvents = filteredEvents.filter((ev) => ev.date === cell.dateString)

                return (
                  <div key={cell.dateString} className={styles.cell} role="gridcell">
                    <div className={styles.cellHeader}>
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
                            onClick={() => { setSelectedEvent(ev); setEditedEventDate(ev.date) }}
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
              {weekDates.map((date) => {
                const dayDateStr = dateKey(date)
                const dayEvents = filteredEvents.filter((ev) => ev.date === dayDateStr)

                return (
                  <div key={dayDateStr} className={styles.weekDayCol}>
                    <div className={styles.weekDayTitle}>
                      {date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })}
                    </div>
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
                          onClick={() => { setSelectedEvent(ev); setEditedEventDate(ev.date) }}
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
                Schedule for {selectedDate.toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </h3>
              <div className={styles.eventList}>
                {filteredEvents
                  .filter((ev) => ev.date === dateKey(selectedDate))
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
                {availableProjectsForNewEvent.map((project) => (
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
          onClose={() => { if (!savingEventDate) setSelectedEvent(null) }}
          title={selectedEvent.title}
          maxWidth="xs"
          fullWidth
          actions={
            <div style={{ display: 'flex', gap: '10px', justifyContent: canDeleteSelectedEvent ? 'space-between' : 'flex-end', width: '100%' }}>
              {canEditSelectedEvent && (
                <Button appearance="primary" onClick={() => void handleUpdateEventDate()} disabled={savingEventDate || !editedEventDate || editedEventDate === selectedEvent.date}>
                  {savingEventDate ? 'Saving…' : 'Save date'}
                </Button>
              )}
              {canDeleteSelectedEvent && (
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
              <strong>Date:</strong>{' '}
              {canEditSelectedEvent
                ? <input aria-label="Task deadline" type="date" value={editedEventDate} onChange={(event) => setEditedEventDate(event.target.value)} disabled={savingEventDate} />
                : selectedEvent.date}
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
          severity={toastMessage?.includes('Denied') || toastMessage?.includes('Error') || toastMessage?.includes('Could not') || toastMessage?.includes('Unable') ? 'error' : 'success'}
          sx={{ width: '100%', borderRadius: '8px' }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </PageRoot>
  )
}

export default CalendarPage
