import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { acceptApplication, apiErrorMessage, downloadDocumentById, fetchApplications, rejectApplication, scheduleInterview, type ApiApplication } from '../data/applicationsApi'

// Self-contained shell: this file can be copied directly into a React/TSX project.
function PageScaffold({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="page-scaffold">
      <header className="page-scaffold__header">
        <h1>{title}</h1>
      </header>
      {children}
    </main>
  )
}

// TODO: Implement the Figma screen and connect the matching feature service.

/* ---------- types (mirror the Prisma schema) ---------- */
type ApplicationStatus = "PENDING" | "INTERVIEWEE" | "ACCEPTED" | "REJECTED"
type DocumentType = "CV" | "ID_COPY" | "ACADEMIC_RECORD" | "MOTIVATION_LETTER" | "WIL_LETTER" | "CERTIFICATE" | "OTHER"
type Doc = { id: string; applicationId?: string; type: DocumentType; fileName: string; fileUrl: string; mimeType?: string; sizeBytes?: number; uploadedAt: string }
type Application = {
  id: string; referenceCode: string; status: ApplicationStatus;
  fullName: string; email: string; phone?: string; idNumber?: string;
  studentNumber: string; institution: string; qualification: string; yearOfStudy?: number;
  interviewAt?: string; interviewVenue?: string;
  startDate?: string; startVenue?: string;
  reviewedBy?: { fullName: string }; reviewedAt?: string; rejectionReason?: string;
  emailSubject?: string; emailBody?: string;
  createdAt: string;
  position: { title: string; campus: { name: string } };
  skills: string[];
  documents: Doc[];
}
type Action = { kind: "interview" | "accept" | "reject"; a: Application }
type SortField = "fullName" | "studentNumber" | "campus" | "createdAt" | "status"
type SortDir = "asc" | "desc"

/* ---------- email templates ---------- */
type EmailDraft = { subject: string; body: string }

const DEFAULT_TEMPLATES: Record<Action["kind"], EmailDraft> = {
  interview: {
    subject: "Interview Invitation — {{position}} at TUT",
    body: `Dear {{fullName}},

Thank you for applying for the {{position}} role at Tshwane University of Technology ({{campus}} campus). We are pleased to invite you to attend an interview as part of the next stage of the selection process.

Interview details
  Date & time: {{interviewDate}}
  Venue: {{interviewVenue}}

Please arrive 10 minutes before the scheduled time and bring a copy of your ID document, your CV, and your academic record. If you cannot attend at the time above, reply to this email within 48 hours so that we can arrange an alternative slot.

Reference: {{reference}}

Kind regards
TUT Internship Recruitment Team`,
  },
  accept: {
    subject: "Offer of Internship — {{position}} at TUT",
    body: `Dear {{fullName}},

Congratulations! We are delighted to offer you the {{position}} internship at Tshwane University of Technology ({{campus}} campus). Your application, reference {{reference}}, was successful.

Start details
  Start date & time: {{startDate}}
  Reporting venue: {{startVenue}}

What happens next
  1. A user account and intern profile have been created for you.
  2. You will receive a separate email with instructions to set your password.
  3. Please report to the venue above on the start date with your signed letter of appointment and a certified copy of your ID.

If you have any questions before your start date, reply to this email or contact the internship office.

We look forward to welcoming you to the team.

Kind regards
TUT Internship Recruitment Team`,
  },
  reject: {
    subject: "Update on your application — {{position}} at TUT",
    body: `Dear {{fullName}},

Thank you for applying for the {{position}} role at Tshwane University of Technology ({{campus}} campus). We appreciate the time and effort you put into your application.

After careful consideration, we regret to inform you that we are unable to proceed with your application at this time.{{rejectionReason}}

We encourage you to apply for future opportunities that match your skills and interests. Wishing you every success in your studies and career.

Reference: {{reference}}

Kind regards
TUT Internship Recruitment Team`,
  },
}

function fillTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const k = key as keyof typeof vars
    return vars[k] != null && vars[k] !== "" ? vars[k] : `—`
  })
}

function formatRejection(reason: string): string {
  const trimmed = reason.trim()
  if (!trimmed) return ""
  let r = trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
  if (!/[.!?]$/.test(r)) r += "."
  return ` Reason: ${r}`
}

const LABEL: Record<ApplicationStatus, string> = { PENDING: "Pending", INTERVIEWEE: "Interview", ACCEPTED: "Accepted", REJECTED: "Rejected" }
const DOC_LABEL: Record<DocumentType, string> = { CV: "CV", ID_COPY: "ID copy", ACADEMIC_RECORD: "Academic record", MOTIVATION_LETTER: "Motivation letter", WIL_LETTER: "WIL letter", CERTIFICATE: "Certificate", OTHER: "Other" }
/* ---------- data: GET /api/applicants (Prisma Application with position, skills, documents) ---------- */
const toApplication = (a: ApiApplication): Application => ({
  id: a.id, referenceCode: a.referenceCode, status: a.status,
  fullName: a.fullName, email: a.email, phone: a.phone ?? undefined, idNumber: a.idNumber ?? undefined,
  studentNumber: a.studentNumber, institution: a.institution, qualification: a.qualification, yearOfStudy: a.yearOfStudy ?? undefined,
  interviewAt: a.interviewAt ?? undefined, interviewVenue: a.interviewVenue ?? undefined,
  reviewedBy: a.reviewedBy ? { fullName: a.reviewedBy.fullName } : undefined, reviewedAt: a.reviewedAt ?? undefined,
  rejectionReason: a.rejectionReason ?? undefined,
  createdAt: a.createdAt,
  position: { title: a.position.title, campus: { name: a.position.campus.name } },
  skills: a.skills.map((s) => s.skill.name),
  documents: a.documents.map((d) => ({
    id: d.id, applicationId: a.id, type: d.type as DocumentType, fileName: d.fileName, fileUrl: '',
    mimeType: d.mimeType ?? undefined, sizeBytes: d.sizeBytes ?? undefined, uploadedAt: d.uploadedAt ?? a.createdAt,
  })),
})

/* ---------- helpers ---------- */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const fmtDate = (iso?: string) => { if (!iso) return "—"; const d = new Date(iso); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}` }
const fmtDateTime = (iso?: string) => { if (!iso) return "—"; const d = new Date(iso); return `${fmtDate(iso)}, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` }
const initials = (n: string) => n.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
const kb = (n?: number) => (n ? `${Math.round(n / 1024)} KB` : "")
const split = (q: string) => { const [lvl, ...rest] = q.split(" in "); return rest.length ? { level: lvl, course: rest.join(" in ") } : { level: "", course: q } }
const maskId = (id?: string) => (id ? `${id.slice(0, 6)}${"•".repeat(Math.max(id.length - 6, 0))}` : "—")

async function downloadDoc(d: Doc) {
  if (d.applicationId) return downloadDocumentById(d.applicationId, d.id, d.fileName)
  try {
    let blob: Blob
    if (d.fileUrl) {
      const res = await fetch(d.fileUrl)
      if (!res.ok) throw new Error("fetch failed")
      blob = await res.blob()
    } else {
      blob = new Blob([`Demo file: ${d.fileName}\n(no fileUrl set yet)`], { type: "text/plain" })
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = d.fileName
    document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(url)
  } catch {
    if (d.fileUrl) window.open(d.fileUrl, "_blank")
  }
}

/* ---------- icons ---------- */
const Search = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>)
const Check = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-10" /></svg>)
const Arrow = ({ dir }: { dir: "asc" | "desc" }) => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginLeft: 4, transition: "transform .2s", transform: dir === "desc" ? "rotate(180deg)" : "none" }}><path d="m6 9 6 6 6-6" /></svg>)

const Row = ({ k, v }: { k: string; v?: string | number }) => (<div className="kv"><span>{k}</span><b>{v || "—"}</b></div>)

/* ---------- page ---------- */
export function ApplicantsPage() {
  const queryClient = useQueryClient()
  const applicationsQuery = useQuery({ queryKey: ['applications'], queryFn: fetchApplications })
  // Start date / reporting venue and the email text are not stored by the backend yet, so they live here.
  const [extras, setExtras] = useState<Record<string, Partial<Application>>>({})
  const rows = useMemo(() => (applicationsQuery.data ?? []).map((a) => ({ ...toApplication(a), ...extras[a.id] })), [applicationsQuery.data, extras])
  // Campus filter options come from the applications themselves.
  const campuses = useMemo(() => [...new Set(rows.map((r) => r.position.campus.name))].sort(), [rows])
  const saveRow = (updated: ApiApplication, extra: Partial<Application> = {}) => {
    queryClient.setQueryData<ApiApplication[]>(['applications'], (list) => (list ?? []).map((item) => (item.id === updated.id ? updated : item)))
    if (Object.keys(extra).length) setExtras((current) => ({ ...current, [updated.id]: { ...current[updated.id], ...extra } }))
  }
  const [q, setQ] = useState("")
  const [campus, setCampus] = useState("")
  const [status, setStatus] = useState("")
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(8)
  const [viewing, setViewing] = useState<Application | null>(null)
  const [action, setAction] = useState<Action | null>(null)
  const [toast, setToast] = useState("")
  const [when, setWhen] = useState("")
  const [venue, setVenue] = useState("")
  const [startDate, setStartDate] = useState("")
  const [startVenue, setStartVenue] = useState("")
  const [reason, setReason] = useState("")
  const [sortField, setSortField] = useState<SortField>("createdAt")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [animKey, setAnimKey] = useState(0)
  const searchRef = useRef<HTMLInputElement>(null)

  // keyboard shortcuts: Esc closes modals, "/" focuses search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { if (action) setAction(null); else if (viewing) setViewing(null) }
      if (e.key === "/" && !action && !viewing && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA" && document.activeElement?.tagName !== "SELECT") {
        e.preventDefault(); searchRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [action, viewing])

  const filtered = useMemo(() => {
    const list = rows.filter(r =>
      (r.fullName + r.studentNumber).toLowerCase().includes(q.toLowerCase()) &&
      (!campus || r.position.campus.name === campus) && (!status || r.status === status))
    const dir = sortDir === "asc" ? 1 : -1
    list.sort((a, b) => {
      let av: string, bv: string
      if (sortField === "campus") { av = a.position.campus.name; bv = b.position.campus.name }
      else if (sortField === "status") { av = a.status; bv = b.status }
      else if (sortField === "createdAt") { av = a.createdAt; bv = b.createdAt }
      else if (sortField === "studentNumber") { av = a.studentNumber; bv = b.studentNumber }
      else { av = a.fullName; bv = b.fullName }
      return av.localeCompare(bv) * dir
    })
    return list
  }, [rows, q, campus, status, sortField, sortDir])

  const pages = Math.max(1, Math.ceil(filtered.length / size))
  const cur = Math.min(page, pages)
  const start = (cur - 1) * size
  const shown = filtered.slice(start, start + size)
  const winStart = Math.max(1, Math.min(cur - 1, pages - 2))
  const nums = Array.from({ length: Math.min(3, pages) }, (_, i) => winStart + i)

  const activeFilters: { label: string; clear: () => void }[] = []
  if (q) activeFilters.push({ label: `Search: "${q}"`, clear: () => setQ("") })
  if (campus) activeFilters.push({ label: `Campus: ${campus}`, clear: () => setCampus("") })
  if (status) activeFilters.push({ label: `Status: ${LABEL[status as ApplicationStatus]}`, clear: () => setStatus("") })

  const say = (m: string) => { setToast(m); setTimeout(() => setToast(""), 3000) }
  const open = (kind: Action["kind"], a: Application) => {
    setWhen(""); setVenue("")
    setStartDate(""); setStartVenue("")
    setReason("")
    setAction({ kind, a })
  }

  // Static template vars — pre-filled immediately when the modal opens (name, position, campus, reference)
  const staticVars = useMemo<Record<string, string>>(() => {
    if (!action) return {} as Record<string, string>
    const a = action.a
    return {
      fullName: a.fullName,
      position: a.position.title,
      campus: a.position.campus.name,
      reference: a.referenceCode,
    }
  }, [action])

  // Dynamic template vars — these are the ONLY editable fields; they update the email body live
  const dynamicVars = useMemo<Record<string, { value: string; placeholder: string }>>(() => {
    if (!action) return {} as Record<string, { value: string; placeholder: string }>
    if (action.kind === "interview") return {
      interviewDate: { value: when ? fmtDateTime(when) : "", placeholder: "[date & time]" },
      interviewVenue: { value: venue, placeholder: "[venue]" },
    }
    if (action.kind === "accept") return {
      startDate: { value: startDate ? fmtDateTime(startDate) : "", placeholder: "[start date & time]" },
      startVenue: { value: startVenue, placeholder: "[reporting venue]" },
    }
    return {
      rejectionReason: { value: formatRejection(reason), placeholder: "" },
    }
  }, [action, when, venue, startDate, startVenue, reason])

  // Subject line — fully rendered string (static vars already replaced)
  const displaySubject = useMemo(() => {
    if (!action) return ""
    return fillTemplate(DEFAULT_TEMPLATES[action.kind].subject, staticVars)
  }, [action, staticVars])

  // Body as a plain string — for saving to the application record (all placeholders replaced)
  const displayBodyString = useMemo(() => {
    if (!action) return ""
    let text = DEFAULT_TEMPLATES[action.kind].body
    for (const [key, val] of Object.entries(staticVars)) {
      text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), val)
    }
    for (const [key, info] of Object.entries(dynamicVars)) {
      const replacement = info.value || info.placeholder
      text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), replacement)
    }
    return text
  }, [action, staticVars, dynamicVars])

  // Body as React nodes — for display, with dynamic parts highlighted
  const renderedBody = useMemo(() => {
    if (!action) return null
    let text = DEFAULT_TEMPLATES[action.kind].body
    for (const [key, val] of Object.entries(staticVars)) {
      text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), val)
    }
    const dynamicKeys = Object.keys(dynamicVars)
    if (!dynamicKeys.length) return text
    const pattern = new RegExp(`\\{\\{(${dynamicKeys.join("|")})\\}\\}`, "g")
    const segments = text.split(pattern)
    return segments.map((seg, i) => {
      if (i % 2 === 0) return seg
      const info = dynamicVars[seg]
      if (!info) return `{{${seg}}}`
      if (info.value) return <span key={i} className="em-var filled">{info.value}</span>
      return <span key={i} className="em-var empty">{info.placeholder}</span>
    })
  }, [action, staticVars, dynamicVars])

  const sort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortField(field); setSortDir("asc") }
    setAnimKey(k => k + 1)
  }

  const toggleRow = (id: string) => setSelected(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })
  const toggleAllShown = () => {
    const allShownSelected = shown.every(r => selected.has(r.id))
    setSelected(prev => {
      const next = new Set(prev)
      if (allShownSelected) shown.forEach(r => next.delete(r.id))
      else shown.forEach(r => next.add(r.id))
      return next
    })
  }
  const clearSelection = () => setSelected(new Set())

  const confirm = () => {
    if (!action) return
    const { kind, a } = action
    if (kind === "interview" && (!when || !venue)) return
    if (kind === "accept" && (!startDate || !startVenue)) return
    setBusy(true)
    const emailMeta = { emailSubject: displaySubject, emailBody: displayBodyString }
    const request = kind === "interview" ? scheduleInterview(a.id, new Date(when).toISOString(), venue)
      : kind === "accept" ? acceptApplication(a.id)
      : rejectApplication(a.id, reason)
    request
      .then((updated) => {
        saveRow(updated, kind === "accept" ? { startDate, startVenue, ...emailMeta } : emailMeta)
        if (updated.emailSent === false) say(`Saved, but the email to ${a.fullName} could not be sent.`)
        else say(kind === "interview" ? `Interview invite sent to ${a.fullName}`
          : kind === "accept" ? `${a.fullName} accepted — welcome email with the set-password link sent` : `${a.fullName} rejected — email sent`)
        setAction(null)
      })
      .catch((error) => say(apiErrorMessage(error, "Could not save the decision. Please try again.")))
      .finally(() => setBusy(false))
  }

  const bulkAction = (kind: Action["kind"]) => {
    const targets = rows.filter(r => selected.has(r.id))
    if (!targets.length) return
    // An interview needs its own date and venue, so invites are sent one at a time.
    if (kind === "interview") { say("Interview invites need a date and venue — invite applicants one at a time."); return }
    setBusy(true)
    Promise.allSettled(targets.map((t) => (kind === "accept" ? acceptApplication(t.id) : rejectApplication(t.id, "Bulk rejection"))))
      .then((results) => {
        results.forEach((result) => { if (result.status === "fulfilled") saveRow(result.value) })
        const done = results.filter((result) => result.status === "fulfilled").length
        const failed = results.length - done
        say(failed ? `${done} updated, ${failed} could not be changed (already decided?)` : `${done} applicant${done > 1 ? "s" : ""} updated`)
        clearSelection()
      })
      .finally(() => setBusy(false))
  }

  const onRowClick = (e: MouseEvent, a: Application) => {
    const target = e.target as HTMLElement
    if (target.closest("button,input,label,td.acts-cell")) return
    setViewing(a)
  }

  return (
    <PageScaffold title="Applicants">
      <div className="ap">
        <style>{CSS}</style>

      {/* Filter bar */}
      <div className="bar">
        <label className="field search">
          <Search />
          <input ref={searchRef} placeholder="Search name or student number  (press /)" value={q} onChange={e => { setQ(e.target.value); setPage(1) }} />
          {q && <button className="search-clear" onClick={() => setQ("")} aria-label="Clear search">×</button>}
        </label>
        <select className="field sel" value={campus} onChange={e => { setCampus(e.target.value); setPage(1) }}>
          <option value="">All campuses</option>{campuses.map(c => <option key={c}>{c}</option>)}</select>
        <select className="field sel" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All statuses</option>
          {(Object.keys(LABEL) as ApplicationStatus[]).map(s => <option key={s} value={s}>{LABEL[s]}</option>)}</select>
        <button className="clear" onClick={() => { setQ(""); setCampus(""); setStatus(""); setPage(1) }}>Clear filters</button>
      </div>

      {/* Active filter pills */}
      {activeFilters.length > 0 && (
        <div className="filters">
          {activeFilters.map((f, i) => (
            <button key={i} className="filter-pill" onClick={f.clear}>
              {f.label} <span className="filter-x">×</span>
            </button>
          ))}
        </div>
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="bulk">
          <div className="bulk-info">
            <button className="bulk-clear" onClick={clearSelection} aria-label="Clear selection">×</button>
            <span><b>{selected.size}</b> selected</span>
          </div>
          <div className="bulk-actions">
            <button className="b interview" disabled={busy} onClick={() => bulkAction("interview")}>Invite to interview</button>
            <button className="b view" disabled={busy} onClick={() => bulkAction("accept")}>Accept all</button>
            <button className="b reject" disabled={busy} onClick={() => bulkAction("reject")}>Reject all</button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th className="cb-col">
                  <label className="cb">
                    <input type="checkbox" checked={shown.length > 0 && shown.every(r => selected.has(r.id))} onChange={toggleAllShown} />
                    <span />
                  </label>
                </th>
                <th className="sortable" onClick={() => sort("fullName")}>Name {sortField === "fullName" && <Arrow dir={sortDir} />}</th>
                <th className="sortable" onClick={() => sort("studentNumber")}>Student No. {sortField === "studentNumber" && <Arrow dir={sortDir} />}</th>
                <th className="sortable" onClick={() => sort("campus")}>Campus {sortField === "campus" && <Arrow dir={sortDir} />}</th>
                <th>Course</th>
                <th className="sortable" onClick={() => sort("createdAt")}>Date applied {sortField === "createdAt" && <Arrow dir={sortDir} />}</th>
                <th className="sortable" onClick={() => sort("status")}>Status {sortField === "status" && <Arrow dir={sortDir} />}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody key={animKey} className="row-anim">
              {shown.map((a, i) => {
                const { level, course } = split(a.qualification)
                const isSel = selected.has(a.id)
                return (
                  <tr key={a.id} className={isSel ? "sel" : undefined} style={{ animationDelay: `${i * 30}ms` }} onClick={e => onRowClick(e, a)}>
                    <td className="cb-col" onClick={e => e.stopPropagation()}>
                      <label className="cb">
                        <input type="checkbox" checked={isSel} onChange={() => toggleRow(a.id)} />
                        <span />
                      </label>
                    </td>
                    <td>
                      <div className="nm"><span className="av">{initials(a.fullName)}</span>{a.fullName}</div>
                    </td>
                    <td>{a.studentNumber}</td>
                    <td>{a.position.campus.name}</td>
                    <td>{course}{level && <small>{level}</small>}</td>
                    <td>{fmtDate(a.createdAt)}</td>
                    <td><span className={`pill ${a.status}`}>{LABEL[a.status]}</span></td>
                    <td className="acts-cell">
                      <div className="acts">
                        <button className="b view" onClick={() => setViewing(a)}>View</button>
                        {a.status === "PENDING" && <button className="b interview" onClick={() => open("interview", a)}>Interview</button>}
                        {(a.status === "PENDING" || a.status === "INTERVIEWEE") && <>
                          <button className="b view" onClick={() => open("accept", a)}>Accept</button>
                          <button className="b reject" onClick={() => open("reject", a)}>Reject</button></>}
                        {a.status === "ACCEPTED" && <span className="sent"><Check /> Email sent</span>}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!shown.length && (
                <tr><td colSpan={8} className="empty">
                  <div className="empty-state">
                    <div className="empty-icon">{applicationsQuery.isError ? "⚠️" : "📭"}</div>
                    <b>{applicationsQuery.isLoading ? "Loading applicants…" : applicationsQuery.isError ? "We couldn't load applicants" : "No applicants found"}</b>
                    <span className="muted">{applicationsQuery.isError ? apiErrorMessage(applicationsQuery.error, "Please try again.") : applicationsQuery.isLoading ? "One moment." : "Try adjusting your filters or search terms."}</span>
                    {applicationsQuery.isError
                      ? <button className="b view" onClick={() => void applicationsQuery.refetch()}>Try again</button>
                      : <button className="b view" onClick={() => { setQ(""); setCampus(""); setStatus(""); setPage(1) }}>Reset filters</button>}
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="foot">
          <span className="muted">{filtered.length ? `Showing ${start + 1}–${start + shown.length} of ${filtered.length} applicants` : "Showing 0 applicants"}</span>
          <div className="pg">
            <span className="muted">Rows per page</span>
            <select className="field rpp" value={size} onChange={e => { setSize(+e.target.value); setPage(1) }}>
              {[8, 16, 24].map(n => <option key={n}>{n}</option>)}</select>
            <button className="pb" disabled={cur === 1} onClick={() => setPage(cur - 1)}>Previous</button>
            {nums.map(n => <button key={n} className={n === cur ? "pb on" : "pb"} onClick={() => setPage(n)}>{n}</button>)}
            <button className="pb next" disabled={cur === pages} onClick={() => setPage(cur + 1)}>Next</button>
          </div>
        </div>
      </div>

      <div className="kbd-hint">
        <span><kbd>/</kbd> search</span>
        <span><kbd>Esc</kbd> close</span>
        <span>Click a row to view details</span>
      </div>

      {/* VIEW pop-up: application details + downloadable documents */}
      {viewing && (
        <div className="ov" onClick={() => setViewing(null)}>
          <div className="modal wide" onClick={e => e.stopPropagation()}>
            <div className="dh">
              <div className="nm"><span className="av lg">{initials(viewing.fullName)}</span>
                <div><h2>{viewing.fullName}</h2>
                  <span className={`pill ${viewing.status}`}>{LABEL[viewing.status]}</span></div></div>
              <button className="x" onClick={() => setViewing(null)} aria-label="Close">×</button>
            </div>
            <small className="muted">Reference: {viewing.referenceCode}</small>

            <div className="grid">
              <section><h3>Personal details</h3>
                <Row k="Full name" v={viewing.fullName} /><Row k="Email" v={viewing.email} />
                <Row k="Phone" v={viewing.phone} /><Row k="ID number" v={maskId(viewing.idNumber)} /></section>
              <section><h3>Application</h3>
                <Row k="Campus" v={viewing.position.campus.name} />
                <Row k="Status" v={LABEL[viewing.status]} /><Row k="Date applied" v={fmtDate(viewing.createdAt)} /></section>
              <section><h3>Studies</h3>
                <Row k="Student number" v={viewing.studentNumber} /><Row k="Institution" v={viewing.institution} />
                <Row k="Qualification" v={viewing.qualification} /><Row k="Year of study" v={viewing.yearOfStudy} /></section>
            </div>

            <h3>Documents</h3>
            <ul className="docs">
              {viewing.documents.map(d => (
                <li key={d.id}>
                  <div><b>{d.fileName}</b><small>{DOC_LABEL[d.type]}{d.sizeBytes ? ` · ${kb(d.sizeBytes)}` : ""} · uploaded {fmtDate(d.uploadedAt)}</small></div>
                  <button className="b view" onClick={() => downloadDoc(d)}>Download</button>
                </li>
              ))}
              {!viewing.documents.length && <li className="muted">No documents uploaded.</li>}
            </ul>
            <div className="mf">
              {viewing.documents.length > 1 && <button className="b view" onClick={() => viewing.documents.forEach(downloadDoc)}>Download all</button>}
              <button className="b solid accept" onClick={() => setViewing(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Interview / Accept / Reject pop-up — email auto-filled, only scheduling fields editable */}
      {action && (
        <div className="ov" onClick={() => setAction(null)}>
          <div className="modal email-modal" onClick={e => e.stopPropagation()}>
            <div className="em-head">
              <div>
                <h2>{action.kind === "interview" ? "Invite for interview" : action.kind === "accept" ? "Accept applicant" : "Reject applicant"}</h2>
                <p className="muted">{action.a.fullName} · {action.a.position.title} · {action.a.email}</p>
              </div>
              <button className="x" onClick={() => setAction(null)} aria-label="Close">×</button>
            </div>

            <div className="em-grid">
              {/* LEFT: the ONLY editable fields — scheduling inputs */}
              <div className="em-left">
                <h3 className="em-sec">{action.kind === "reject" ? "Rejection reason" : "Scheduling"}</h3>
                {action.kind === "interview" && <>
                  <label>Date &amp; time
                    <input className="field" type="datetime-local" value={when} onChange={e => setWhen(e.target.value)} />
                  </label>
                  <label>Venue
                    <input className="field" value={venue} onChange={e => setVenue(e.target.value)} placeholder="e.g. ICEP Arcadia, Room 2" />
                  </label>
                  <small className="muted">An interview invitation email will be sent to {action.a.email}. Pick a date, time and venue — the email on the right updates automatically.</small>
                </>}
                {action.kind === "accept" && <>
                  <label>Start date &amp; time
                    <input className="field" type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} />
                  </label>
                  <label>Reporting venue
                    <input className="field" value={startVenue} onChange={e => setStartVenue(e.target.value)} placeholder="e.g. ICEP Arcadia, Reception" />
                  </label>
                  <small className="muted">An offer-of-internship email will be sent to {action.a.email}. Set the start date and venue — the email on the right updates automatically.</small>
                </>}
                {action.kind === "reject" && <>
                  <label>Reason (optional)
                    <textarea className="field" rows={4} value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Position filled; please reapply next cycle." />
                  </label>
                  <small className="muted">A rejection email will be sent to {action.a.email}. Type a reason and it appears in the email on the right automatically.</small>
                </>}
              </div>

              {/* RIGHT: the email — read-only, pre-filled with the applicant's name & details; dynamic parts highlighted & update live */}
              <div className="em-right">
                <div className="em-prev-meta">
                  <div><span className="muted">To:</span> <b>{action.a.email}</b></div>
                  <div><span className="muted">Subject:</span> <b>{displaySubject}</b></div>
                </div>
                <div className="em-prev-body">{renderedBody}</div>
              </div>
            </div>

            <div className="mf">
              <button className="b view" onClick={() => setAction(null)} disabled={busy}>Cancel</button>
              <button className={`b solid ${action.kind}`}
                disabled={(action.kind === "interview" && (!when || !venue)) || (action.kind === "accept" && (!startDate || !startVenue)) || busy}
                onClick={confirm}>
                {busy ? <span className="spinner" /> : action.kind === "interview" ? "Send invite" : action.kind === "accept" ? "Accept & send" : "Reject & send"}
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
      </div>
    </PageScaffold>
  )
}

export default ApplicantsPage

/* ============================ inline styles ============================ */
const CSS = `
.page-scaffold{min-height:100vh}
.page-scaffold__header{padding:26px 32px 0;background:#f4f6f9}
.page-scaffold__header h1{margin:0;color:#14284b;font-size:28px;line-height:1.2;letter-spacing:-.02em}
@media(max-width:640px){.page-scaffold__header{padding:20px 20px 0}.page-scaffold__header h1{font-size:24px}}
.ap{font-family:Inter,system-ui,sans-serif;color:#14284b;background:#f4f6f9;padding:28px 32px;min-height:100%;--navy:#14284b;--line:#e2e8f0;--muted:#6b7f9e}
.ap *{box-sizing:border-box}
.muted{color:var(--muted);font-size:15px}

/* filter bar */
.bar{display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin-bottom:14px}
.field{height:48px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:0 18px;font:inherit;font-size:16px;color:var(--navy);transition:border-color .15s,box-shadow .15s}
.field:focus,.field:focus-within{outline:0;border-color:var(--navy);box-shadow:0 0 0 3px #14284b1a}
.search{display:flex;align-items:center;gap:12px;width:360px;color:#8a9ab5;padding-right:12px}
.search input{border:0;outline:0;flex:1;font:inherit;color:var(--navy);background:none;min-width:0}
.search input::placeholder{color:#a4b0c5}
.search-clear{border:0;background:none;color:var(--muted);font-size:20px;line-height:1;cursor:pointer;padding:4px;border-radius:6px;transition:background .15s,color .15s}
.search-clear:hover{background:#eef2f7;color:var(--navy)}
.sel,.rpp{appearance:none;cursor:pointer;padding-right:40px;background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2314284b' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m3 6 5 5 5-5'/%3E%3C/svg%3E") no-repeat right 16px center}
.sel{min-width:200px}.rpp{height:44px;min-width:84px;padding-left:14px}
.clear{border:0;background:none;color:var(--muted);font:inherit;font-weight:700;font-size:16px;cursor:pointer;transition:color .15s}
.clear:hover{color:var(--navy)}

/* active filter pills */
.filters{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
.filter-pill{display:inline-flex;align-items:center;gap:8px;background:#eef2fb;color:var(--navy);border:0;border-radius:999px;padding:6px 12px;font:inherit;font-size:13px;font-weight:600;cursor:pointer;transition:background .15s,transform .1s}
.filter-pill:hover{background:#dde5f5;transform:translateY(-1px)}
.filter-pill:active{transform:translateY(0)}
.filter-x{font-size:16px;line-height:1;opacity:.6}
.filter-pill:hover .filter-x{opacity:1}

/* bulk action bar */
.bulk{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;background:var(--navy);color:#fff;border-radius:12px;padding:12px 18px;margin-bottom:16px;animation:slideDown .2s ease}
.bulk-info{display:flex;align-items:center;gap:10px}
.bulk-info b{font-weight:800}
.bulk-clear{background:rgba(255,255,255,.18);border:0;color:#fff;width:24px;height:24px;border-radius:50%;cursor:pointer;font-size:16px;line-height:1;display:inline-flex;align-items:center;justify-content:center;transition:background .15s}
.bulk-clear:hover{background:rgba(255,255,255,.3)}
.bulk-actions{display:flex;gap:8px;flex-wrap:wrap}
.bulk-actions .b{background:#fff;color:var(--navy);border-color:#fff;height:36px;padding:0 14px;font-size:14px}
.bulk-actions .b.interview{color:#1d4ed8;border-color:#fff}
.bulk-actions .b.reject{color:#b91c1c;border-color:#fff}

/* card + table */
.b:hover,.pb:not(:disabled):hover{filter:brightness(.95)}
.card{background:#fff;border-radius:18px;box-shadow:0 1px 2px #14284b0d;overflow:hidden}
.scroll{overflow-x:auto}
.ap table{width:100%;border-collapse:separate;border-spacing:0;font-size:16px;min-width:1040px}
.ap th{text-align:left;padding:20px 12px;font-size:14px;font-weight:700;letter-spacing:.02em;text-transform:uppercase;color:#5d7499;border-bottom:1px solid var(--line);white-space:nowrap}
.ap th:first-child,.ap td:first-child{padding-left:24px}
.ap td{padding:14px 12px;border-bottom:1px solid var(--line);white-space:nowrap}
.ap td small{display:block;color:var(--muted);font-size:15px}
.sortable{cursor:pointer;user-select:none;transition:color .15s}
.sortable:hover{color:var(--navy)}
.cb-col{width:48px;text-align:center}
.ap tbody tr{cursor:pointer;transition:background-color .25s ease,color .25s ease,transform .3s cubic-bezier(.2,.8,.2,1),filter .3s ease}
.ap tbody tr.sel{background:#eef2fb}
/* Hover: the row pops out in ICEP navy (same as the dashboard preview) */
.ap tbody tr:hover,.ap tbody tr.sel:hover{position:relative;z-index:1;background:#1B3A5C;color:#fff;transform:scale(1.006,1.04);filter:drop-shadow(0 8px 14px rgba(27,58,92,.3))}
.ap tbody tr:hover td{border-bottom-color:transparent;box-shadow:1px 0 0 #1B3A5C}
.ap tbody tr:hover td small{color:#C8D5E6}
.ap tbody tr:hover .cb span{border-color:#C8D5E6}
.ap tbody tr:hover .sent{color:#86EFAC}
@media (prefers-reduced-motion:reduce){.ap tbody tr:hover,.ap tbody tr.sel:hover{transform:none}}
.nm{display:flex;align-items:center;gap:14px}
.av{width:40px;height:40px;border-radius:50%;background:#e8edf5;color:var(--navy);font-weight:700;font-size:14px;display:inline-flex;align-items:center;justify-content:center;flex:none;transition:background .15s,color .15s}
.ap tbody tr:hover .av{background:rgba(255,255,255,.16);color:#fff}
.av.lg{width:52px;height:52px;font-size:16px}

/* row entry animation */
.row-anim tr{animation:fadeInUp .25s ease backwards}
@keyframes fadeInUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}

/* custom checkboxes */
.cb{position:relative;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}
.cb input{position:absolute;opacity:0;width:100%;height:100%;margin:0;cursor:pointer}
.cb span{width:18px;height:18px;border-radius:5px;border:1.5px solid #cbd5e1;background:#fff;display:inline-block;position:relative;transition:background .15s,border-color .15s}
.cb input:checked + span{background:var(--navy);border-color:var(--navy)}
.cb input:checked + span::after{content:"";position:absolute;left:5px;top:1px;width:6px;height:11px;border:solid #fff;border-width:0 2px 2px 0;transform:rotate(45deg)}
.cb input:focus + span{box-shadow:0 0 0 3px #14284b1a}

/* status pills */
.pill{display:inline-block;padding:6px 16px;border-radius:999px;font-weight:700;font-size:15px;transition:background .2s,color .2s}
.pill.PENDING{background:#fdf0c8;color:#b4720d}
.pill.INTERVIEWEE{background:#dbe8fd;color:#1d4ed8}
.pill.ACCEPTED{background:#d5f2e0;color:#15803d}
.pill.REJECTED{background:#fde0e0;color:#b91c1c}

/* action buttons */
.acts{display:flex;gap:8px;align-items:center}
.acts-cell{/* marker */}
.b{height:40px;padding:0 16px;border-radius:8px;background:#fff;font:inherit;font-weight:700;font-size:16px;cursor:pointer;border:1.5px solid var(--navy);color:var(--navy);transition:transform .08s,filter .15s,box-shadow .15s}
.b:active{transform:scale(.97)}
.b.view{border-color:var(--line);font-weight:500;color:var(--navy)}
.b.view:hover{border-color:var(--navy)}
.b.reject{border-color:#c53030;color:#b91c1c}
.b.interview{border-color:#1d4ed8;color:#1d4ed8}
.b.solid{color:#fff}
.b.solid.accept{background:var(--navy)}
.b.solid.reject{background:#b91c1c}
.b.solid.interview{background:#1d4ed8}
.b:disabled{opacity:.5;cursor:not-allowed}
.sent{display:inline-flex;align-items:center;gap:6px;color:#15803d;font-size:16px;margin-left:6px}
.empty{text-align:center;color:var(--muted);padding:40px!important}
.empty-state{display:flex;flex-direction:column;align-items:center;gap:8px;padding:30px}
.empty-icon{font-size:40px;margin-bottom:6px}

/* footer + pagination */
.foot{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;padding:20px 24px}
.pg{display:flex;align-items:center;gap:10px}
.pb{min-width:44px;height:44px;padding:0 14px;border-radius:8px;background:#fff;border:1px solid var(--line);font:inherit;font-weight:500;font-size:16px;color:var(--navy);cursor:pointer;transition:background .12s,border-color .12s}
.pb:not(:disabled):hover{background:#fafbfd;border-color:var(--navy)}
.pb.on{background:var(--navy);color:#fff;border-color:var(--navy);font-weight:700}
.pb.next{border:1.5px solid var(--navy);font-weight:700}
.pb:disabled{color:#a4b0c5;cursor:not-allowed}

/* keyboard hint */
.kbd-hint{display:flex;gap:18px;align-items:center;margin-top:18px;color:var(--muted);font-size:13px;flex-wrap:wrap}
.kbd-hint kbd{display:inline-block;background:#fff;border:1px solid var(--line);border-bottom-width:2px;border-radius:4px;padding:1px 6px;font:inherit;font-size:12px;font-weight:600;color:var(--navy);margin-right:4px}

/* modal + overlay */
.ov{position:fixed;inset:0;background:#14284b66;z-index:50;display:flex;justify-content:center;align-items:center;padding:16px;animation:fadeOverlay .15s ease}
@keyframes fadeOverlay{from{background:#14284b00}to{background:#14284b66}}
.modal{background:#fff;border-radius:16px;padding:26px;width:min(440px,100%);max-height:92vh;overflow:auto;display:grid;gap:14px;box-shadow:0 20px 50px #14284b40;animation:popIn .2s cubic-bezier(.16,1,.3,1)}
.modal.wide{width:min(720px,100%);gap:10px}

/* email template modal */
.modal.email-modal{width:min(960px,100%);padding:22px 26px 18px;gap:14px}
.em-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
.em-head h2{margin:0 0 4px;font-size:20px}
.em-head p{margin:0}
.em-grid{display:grid;grid-template-columns:300px 1fr;gap:18px;align-items:flex-start}
@media(max-width:760px){.em-grid{grid-template-columns:1fr}}
.em-sec{font-size:13px;text-transform:uppercase;letter-spacing:.03em;color:#5d7499;margin:0 0 8px}
.em-left{display:flex;flex-direction:column;gap:10px;background:#fafbfd;border:1px solid var(--line);border-radius:12px;padding:14px 16px}
.em-left .field{height:42px;font-size:14px}
.em-left label{display:grid;gap:5px;font-size:13px;font-weight:600;color:var(--navy)}
.em-left small.muted{display:block;font-size:12px;margin-top:2px;line-height:1.4}

.em-right{display:flex;flex-direction:column;gap:10px;min-width:0}
.em-prev-meta{background:#fafbfd;border:1px solid var(--line);border-radius:10px;padding:10px 14px;font-size:13px;display:grid;gap:4px}
.em-prev-meta .muted{font-size:12px;margin-right:6px}
.em-prev-body{background:#fff;border:1px solid var(--line);border-radius:10px;padding:16px 20px;font-family:Inter,system-ui,sans-serif;font-size:14px;line-height:1.65;white-space:pre-wrap;word-break:break-word;max-height:440px;overflow:auto;margin:0;box-shadow:inset 0 1px 2px #14284b08;color:var(--navy)}

/* dynamic parts inside the email body */
.em-var{display:inline}
.em-var.filled{color:#1d4ed8;font-weight:600}
.em-var.empty{color:#94a3b8;font-style:italic}

@keyframes popIn{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:none}}
@keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
.modal h2{margin:0 0 6px;font-size:20px}
.modal p{margin:0}
.modal label{display:grid;gap:6px;font-size:14px;font-weight:600}
.modal .field{font-weight:400;font-size:15px}
.modal textarea.field{height:auto;padding:12px 14px}

.dh{display:flex;justify-content:space-between;align-items:flex-start}
.x{border:0;background:none;font-size:30px;line-height:1;color:var(--muted);cursor:pointer;transition:color .15s;transition:transform .1s}
.x:hover{color:var(--navy)}
.x:active{transform:scale(.9)}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 28px;margin-top:6px}
@media(max-width:640px){.grid{grid-template-columns:1fr}}
.modal h3{font-size:13px;text-transform:uppercase;letter-spacing:.03em;color:#5d7499;margin:12px 0 6px}
.kv{display:flex;justify-content:space-between;gap:14px;padding:7px 0;border-bottom:1px solid #eef2f7;font-size:14px}
.kv span{color:var(--muted)}
.kv b{font-weight:600;text-align:right;word-break:break-word}
.chips{display:flex;gap:6px;flex-wrap:wrap}
.chips span{background:#eef2fb;color:var(--navy);padding:4px 12px;border-radius:999px;font-size:13px}
.docs{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.docs li{display:flex;justify-content:space-between;align-items:center;gap:12px;border:1px solid var(--line);border-radius:12px;padding:10px 14px;font-size:14px;transition:border-color .15s,background .12s}
.docs li:hover{border-color:var(--navy);background:#fafbfd}
.docs small{display:block;color:var(--muted);font-size:12px}
.docs .b{height:36px;font-size:14px}
.mf{display:flex;justify-content:flex-end;gap:10px;margin-top:6px}

/* spinner */
.spinner{display:inline-block;width:16px;height:16px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:spin .6s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}

.toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:var(--navy);color:#fff;padding:13px 22px;border-radius:10px;font-size:15px;z-index:80;box-shadow:0 8px 24px #14284b44;animation:toastIn .25s cubic-bezier(.16,1,.3,1)}
@keyframes toastIn{from{opacity:0;transform:translate(-50%,12px)}to{opacity:1;transform:translateX(-50%)}}
`
