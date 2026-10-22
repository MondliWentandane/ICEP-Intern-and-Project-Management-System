import { useMemo, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Chip, InputAdornment, Snackbar, Stack, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, TextField, Typography } from '@mui/material'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { Building2, CalendarRange, MapPin, Pencil, Plus, Search, Users } from 'lucide-react'
import { Campuses } from '@/api/services/campuses.service'
import { Interns } from '@/api/services/interns.service'
import { formatDate } from '@/utils/format'
import { EmptyNote, ErrorNotice, LoadingBlock, PageHeader, SampleNotice, StatTile } from '@/features/shared/workspace/parts'
import { cardGrid } from '@/features/shared/workspace/layout'
import { sampleCampuses, sampleIntakes, sampleInterns } from '@/features/shared/workspace/sample'
import { isActiveIntern } from '@/features/shared/workspace/status'
import { useList } from '@/features/shared/workspace/useList'
import { normalizeIntern, type CampusView, type IntakeView, type InternView, type RawIntern } from '@/features/shared/workspace/types'
import { CampusAdmin, Intakes, type CampusInput, type IntakeInput } from '../intakes.service'
import { CampusDialog } from '../components/CampusDialog'
import { IntakeDialog } from '../components/IntakeDialog'

type IntakePhase = 'Upcoming' | 'Running' | 'Closed' | 'Inactive'

function intakePhase(intake: IntakeView, now: number): IntakePhase {
  if (!intake.isActive) return 'Inactive'
  if (new Date(intake.startDate).getTime() > now) return 'Upcoming'
  if (new Date(intake.endDate).getTime() < now) return 'Closed'
  return 'Running'
}

type DialogState = { kind: 'campus'; item: CampusView | null } | { kind: 'intake'; item: IntakeView | null } | null

const phaseColor: Record<IntakePhase, 'info' | 'success' | 'default'> = { Upcoming: 'info', Running: 'success', Closed: 'default', Inactive: 'default' }

export function CampusesIntakesPage() {
  const location = useLocation()
  const roleBase = '/' + (location.pathname.split('/')[1] ?? 'handler')

  const campuses = useList<CampusView>(() => Campuses.list(), sampleCampuses)
  const intakes = useList<IntakeView>(() => Intakes.list(), sampleIntakes)
  const interns = useList<InternView>(() => Interns.list(), sampleInterns, (r) => normalizeIntern(r as RawIntern))

  const [tab, setTab] = useState<'campuses' | 'intakes'>('campuses')
  const [search, setSearch] = useState('')
  const [dialog, setDialog] = useState<DialogState>(null)
  const [toast, setToast] = useState('')

  const loading = campuses.loading || intakes.loading || interns.loading
  const failed = campuses.failed || intakes.failed || interns.failed
  const usingSample = campuses.usingSample || intakes.usingSample || interns.usingSample
  const [now] = useState(() => Date.now())
  const term = search.trim().toLowerCase()

  const internCounts = useMemo(() => {
    const byCampus = new Map<string, { total: number; active: number }>()
    const byIntake = new Map<string, number>()
    for (const intern of interns.items) {
      if (intern.campusId) {
        const entry = byCampus.get(intern.campusId) ?? { total: 0, active: 0 }
        entry.total += 1
        if (isActiveIntern(intern.status)) entry.active += 1
        byCampus.set(intern.campusId, entry)
      }
      const intakeKey = intern.intakeId ?? intern.intakeName
      if (intakeKey) byIntake.set(intakeKey, (byIntake.get(intakeKey) ?? 0) + 1)
    }
    return { byCampus, byIntake }
  }, [interns.items])

  const visibleCampuses = campuses.items.filter((c) => [c.name, c.city, c.province, c.address, c.location].filter(Boolean).join(' ').toLowerCase().includes(term))
  const visibleIntakes = [...intakes.items]
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    .filter((i) => i.name.toLowerCase().includes(term))

  // With no backend (dev sample mode) edits stay in this page only, so the forms can be reviewed.
  async function saveCampus(input: CampusInput, existing: CampusView | null) {
    if (campuses.usingSample) {
      const saved: CampusView = { ...(existing ?? { id: `local-${Date.now()}` }), ...input }
      campuses.setItems(existing ? campuses.items.map((c) => (c.id === existing.id ? saved : c)) : [...campuses.items, saved])
    } else {
      if (existing) await CampusAdmin.update(existing.id, input)
      else await CampusAdmin.create(input)
      await campuses.refresh()
    }
    setToast(existing ? 'Campus updated.' : 'Campus added.')
  }

  async function saveIntake(input: IntakeInput, existing: IntakeView | null) {
    if (intakes.usingSample) {
      const saved: IntakeView = { ...(existing ?? { id: `local-${Date.now()}` }), ...input }
      intakes.setItems(existing ? intakes.items.map((i) => (i.id === existing.id ? saved : i)) : [...intakes.items, saved])
    } else {
      if (existing) await Intakes.update(existing.id, input)
      else await Intakes.create(input)
      await intakes.refresh()
    }
    setToast(existing ? 'Intake updated.' : 'Intake added.')
  }

  const runningIntakes = intakes.items.filter((i) => intakePhase(i, now) === 'Running').length

  return (
    <Box>
      <PageHeader
        title="Campuses & intakes"
        subtitle="ICEP locations and the intake periods interns are placed into."
        actions={<>
          <Button variant="outlined" startIcon={<Plus size={16} />} onClick={() => setDialog({ kind: 'campus', item: null })}>Add campus</Button>
          <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setDialog({ kind: 'intake', item: null })}>Add intake</Button>
        </>}
      />

      {usingSample && <SampleNotice />}
      {failed && <ErrorNotice message="Some campus or intake data could not be loaded. Check your connection and try again." />}
      {loading ? <LoadingBlock /> : (
        <Stack spacing={2}>
          <Box sx={cardGrid({ lg: 4 })}>
            <StatTile label="Campuses" value={campuses.items.length} icon={Building2} />
            <StatTile label="Intakes" value={intakes.items.length} hint={`${runningIntakes} running now`} icon={CalendarRange} accent="completed" />
            <StatTile label="Active interns" value={interns.items.filter((i) => isActiveIntern(i.status)).length} icon={Users} accent="active" />
            <StatTile label="Interns on record" value={interns.items.length} icon={Users} accent="pending" />
          </Box>

          <Card variant="outlined">
            <CardContent>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 2 }}>
                <Tabs value={tab} onChange={(_, value: 'campuses' | 'intakes') => setTab(value)} aria-label="Campuses and intakes">
                  <Tab value="campuses" label={`Campuses (${campuses.items.length})`} />
                  <Tab value="intakes" label={`Intakes (${intakes.items.length})`} />
                </Tabs>
                <TextField
                  size="small"
                  placeholder={tab === 'campuses' ? 'Search campuses' : 'Search intakes'}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={16} aria-hidden /></InputAdornment> }, htmlInput: { 'aria-label': 'Search' } }}
                />
              </Stack>

              {tab === 'campuses' ? (
                visibleCampuses.length === 0 ? <EmptyNote message={term ? 'No campuses match your search.' : 'No campuses have been added yet.'} /> : (
                  <Box sx={cardGrid({ lg: 3 })}>
                    {visibleCampuses.map((campus) => {
                      const counts = internCounts.byCampus.get(campus.id) ?? { total: 0, active: 0 }
                      const place = [campus.city ?? campus.location, campus.province].filter(Boolean).join(', ')
                      return (
                        <Card key={campus.id} variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 700 }}>{campus.name}</Typography>
                            {(place || campus.address) && (
                              <Stack direction="row" spacing={0.75} sx={{ alignItems: 'flex-start', mt: 0.5, color: 'text.secondary' }}>
                                <MapPin size={16} aria-hidden style={{ marginTop: 2, flexShrink: 0 }} />
                                <Typography variant="body2" color="text.secondary">{[campus.address, place].filter(Boolean).join(', ')}</Typography>
                              </Stack>
                            )}
                            <Stack direction="row" spacing={3} sx={{ my: 2 }}>
                              <Box><Typography variant="h6" component="p" sx={{ fontWeight: 700 }}>{counts.active}</Typography><Typography variant="caption" color="text.secondary">Active interns</Typography></Box>
                              <Box><Typography variant="h6" component="p" sx={{ fontWeight: 700 }}>{counts.total}</Typography><Typography variant="caption" color="text.secondary">All interns</Typography></Box>
                            </Stack>
                            <Stack direction="row" spacing={1}>
                              <Button size="small" variant="outlined" component={RouterLink} to={`${roleBase}/interns`}>View interns</Button>
                              <Button size="small" startIcon={<Pencil size={14} />} onClick={() => setDialog({ kind: 'campus', item: campus })} aria-label={`Edit ${campus.name}`}>Edit</Button>
                            </Stack>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </Box>
                )
              ) : (
                visibleIntakes.length === 0 ? <EmptyNote message={term ? 'No intakes match your search.' : 'No intakes have been added yet.'} /> : (
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow><TableCell>Intake</TableCell><TableCell>Start</TableCell><TableCell>End</TableCell><TableCell>Status</TableCell><TableCell align="right">Interns</TableCell><TableCell align="right" aria-label="Actions" /></TableRow>
                      </TableHead>
                      <TableBody>
                        {visibleIntakes.map((intake) => {
                          const phase = intakePhase(intake, now)
                          const count = intake.internCount ?? internCounts.byIntake.get(intake.id) ?? internCounts.byIntake.get(intake.name) ?? 0
                          return (
                            <TableRow key={intake.id} hover>
                              <TableCell sx={{ fontWeight: 600 }}>{intake.name}</TableCell>
                              <TableCell>{formatDate(intake.startDate)}</TableCell>
                              <TableCell>{formatDate(intake.endDate)}</TableCell>
                              <TableCell><Chip size="small" variant="outlined" label={phase} color={phaseColor[phase]} /></TableCell>
                              <TableCell align="right">{count}</TableCell>
                              <TableCell align="right"><Button size="small" startIcon={<Pencil size={14} />} onClick={() => setDialog({ kind: 'intake', item: intake })} aria-label={`Edit ${intake.name}`}>Edit</Button></TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </Box>
                )
              )}
            </CardContent>
          </Card>
        </Stack>
      )}

      {dialog?.kind === 'campus' && (
        <CampusDialog
          key={dialog.item?.id ?? 'new-campus'}
          campus={dialog.item}
          takenNames={campuses.items.filter((c) => c.id !== dialog.item?.id).map((c) => c.name)}
          onSave={(input) => saveCampus(input, dialog.item)}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === 'intake' && (
        <IntakeDialog
          key={dialog.item?.id ?? 'new-intake'}
          intake={dialog.item}
          takenNames={intakes.items.filter((i) => i.id !== dialog.item?.id).map((i) => i.name)}
          onSave={(input) => saveIntake(input, dialog.item)}
          onClose={() => setDialog(null)}
        />
      )}
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')}>
        <Alert severity="success" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </Box>
  )
}

export default CampusesIntakesPage
