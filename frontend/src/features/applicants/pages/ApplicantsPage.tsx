import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/* ---------- types (mirror the Prisma schema) ---------- */
type Status = "PENDING" | "INTERVIEWEE" | "ACCEPTED" | "REJECTED"
type DocType = "CV" | "ID_COPY" | "ACADEMIC_RECORD" | "MOTIVATION_LETTER" | "WIL_LETTER" | "CERTIFICATE" | "OTHER"
type Doc = { id: string; type: DocType; fileName: string; fileUrl: string; sizeBytes?: number; uploadedAt: string }
type App = {
  id: string; referenceCode: string; status: Status; fullName: string; email: string; phone?: string; idNumber?: string
  studentNumber: string; institution: string; qualification: string; yearOfStudy?: number
  interviewAt?: string; interviewVenue?: string; startDate?: string; startVenue?: string
  reviewedBy?: { fullName: string }; reviewedAt?: string; rejectionReason?: string; emailSubject?: string; emailBody?: string
  createdAt: string; position: { title: string; campus: { name: string } }; documents: Doc[]
}
type Kind = "interview" | "accept" | "reject"
type SortField = "fullName" | "studentNumber" | "campus" | "createdAt" | "status"

/* ---------- ICEP style guide: status colours (c = main, t = tint, x = text) ---------- */
const ST: Record<Status, { l: string; c: string; t: string; x: string }> = {
  PENDING: { l: "Pending", c: "#F59E0B", t: "#FEF3C7", x: "#92400E" },
  INTERVIEWEE: { l: "Interview", c: "#3B82F6", t: "#DBEAFE", x: "#1E40AF" }, // "Completed" blue
  ACCEPTED: { l: "Accepted", c: "#16A34A", t: "#DCFCE7", x: "#166534" }, // "Active" green
  REJECTED: { l: "Rejected", c: "#DC2626", t: "#FEE2E2", x: "#991B1B" },
}
const TONE: Record<Kind, Status> = { interview: "INTERVIEWEE", accept: "ACCEPTED", reject: "REJECTED" }
const DOC_LABEL: Record<DocType, string> = { CV: "CV", ID_COPY: "ID copy", ACADEMIC_RECORD: "Academic record", MOTIVATION_LETTER: "Motivation letter", WIL_LETTER: "WIL letter", CERTIFICATE: "Certificate", OTHER: "Other" }
const ADMIN = "Alex Williamson" // current reviewer (use your auth user)

/* ---------- email templates ({{static}} filled on open, dynamic parts update live) ---------- */
const SIGN = "\n\nKind regards\nTUT Internship Recruitment Team"
const TPL: Record<Kind, { subject: string; body: string }> = {
  interview: {
    subject: "Interview Invitation — {{position}} at TUT",
    body: `Dear {{fullName}},

Thank you for applying for the {{position}} role at Tshwane University of Technology ({{campus}} campus). We are pleased to invite you to an interview.

Interview details
  Date & time: {{interviewDate}}
  Venue: {{interviewVenue}}

Please arrive 10 minutes early with your ID, CV and academic record. If you cannot attend, reply within 48 hours so we can arrange another slot.

Reference: {{reference}}${SIGN}`,
  },
  accept: {
    subject: "Offer of Internship — {{position}} at TUT",
    body: `Dear {{fullName}},

Congratulations! We are delighted to offer you the {{position}} internship at Tshwane University of Technology ({{campus}} campus). Your application, reference {{reference}}, was successful.

Start details
  Start date & time: {{startDate}}
  Reporting venue: {{startVenue}}

What happens next
  1. Your user account and intern profile have been created.
  2. A separate email will explain how to set your password.
  3. Please report on the start date with your signed letter of appointment and a certified copy of your ID.${SIGN}`,
  },
  reject: {
    subject: "Update on your application — {{position}} at TUT",
    body: `Dear {{fullName}},

Thank you for applying for the {{position}} role at Tshwane University of Technology ({{campus}} campus). After careful consideration, we are unable to proceed with your application at this time.{{rejectionReason}}

We encourage you to apply for future opportunities. Wishing you every success in your studies and career.

Reference: {{reference}}${SIGN}`,
  },
}
const CFG: Record<Kind, { title: string; a: string; b: string; ph: string; btn: string }> = {
  interview: { title: "Invite for interview", a: "Date & time", b: "Venue", ph: "e.g. ICEP Arcadia, Room 2", btn: "Send invite" },
  accept: { title: "Accept applicant", a: "Start date & time", b: "Reporting venue", ph: "e.g. ICEP Arcadia, Reception", btn: "Accept & send" },
  reject: { title: "Reject applicant", a: "", b: "", ph: "", btn: "Reject & send" },
}
const DYN: Record<Kind, [string, string][]> = {
  interview: [["interviewDate", "[date & time]"], ["interviewVenue", "[venue]"]],
  accept: [["startDate", "[start date & time]"], ["startVenue", "[reporting venue]"]],
  reject: [["rejectionReason", ""]],
}
const fill = (t: string, v: Record<string, string>) => t.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in v ? v[k] : m))
const reasonText = (r: string) => { const s = r.trim(); return s ? ` Reason: ${s[0].toUpperCase() + s.slice(1)}${/[.!?]$/.test(s) ? "" : "."}` : "" }

/* ---------- mock data (replace with GET /api/applications incl. position.campus, documents) ---------- */
const BASE: [string, string, string, string, string, Status][] = [
  ["Thabo Molefe", "210000000", "Soshanguve South", "Computer Science", "2026-09-30", "PENDING"],
  ["Lerato Dlamini", "217919317", "Arcadia", "Information Technology", "2026-09-30", "PENDING"],
  ["Sipho Nkosi", "225838634", "Mbombela", "Computer Systems Eng.", "2026-09-29", "INTERVIEWEE"],
  ["Naledi Khumalo", "233757951", "Soshanguve North", "Multimedia Computing", "2026-09-29", "PENDING"],
  ["Kabelo Sithole", "241677268", "Ga-Rankuwa", "Information Technology", "2026-09-28", "ACCEPTED"],
  ["Zanele Mokoena", "249596585", "Polokwane", "Informatics", "2026-09-27", "PENDING"],
  ["Tshepo Mahlangu", "257515902", "Arcadia", "Multimedia Computing", "2026-09-26", "REJECTED"],
  ["Palesa Radebe", "265435219", "eMalahleni", "Computer Science", "2026-09-26", "PENDING"],
]
const FIRST = ["Karabo", "Mpho", "Lindiwe", "Themba", "Nomsa", "Bongani", "Refilwe", "Sandile", "Dineo", "Katlego"]
const LAST = ["Mthembu", "Ndlovu", "Maseko", "Mabaso", "Phiri", "Baloyi", "Chauke", "Sebola", "Moloi", "Zulu"]
const CAMP = ["Soshanguve South", "Arcadia", "Mbombela", "Soshanguve North", "Ga-Rankuwa", "Polokwane", "eMalahleni"]
const CRS = ["Computer Science", "Information Technology", "Computer Systems Eng.", "Multimedia Computing", "Informatics"]
const POS = ["Frontend Developer Intern", "Backend Developer Intern", "UI/UX Intern", "QA Tester Intern", "Systems Support Intern"]
const STS: Status[] = ["PENDING", "PENDING", "INTERVIEWEE", "ACCEPTED", "REJECTED", "PENDING"]
const DOCS: [string, DocType, string, number][] = [["a", "CV", "CV", 182000], ["b", "ACADEMIC_RECORD", "Academic_Record", 244000], ["c", "ID_COPY", "ID", 96000], ["d", "MOTIVATION_LETTER", "Motivation_Letter", 158000], ["e", "WIL_LETTER", "WIL_Letter", 132000]]

const SEED: App[] = [
  ...BASE,
  ...Array.from({ length: 28 }, (_, i): typeof BASE[number] => [
    `${FIRST[i % 10]} ${LAST[(i * 3) % 10]}`, String(270000000 + (i * 7919317) % 99999999), CAMP[i % 7], CRS[i % 5],
    `2026-09-${String(25 - Math.floor(i / 3)).padStart(2, "0")}`, STS[i % 6]]),
].map(([fullName, studentNumber, campus, course, createdAt, status], i): App => ({
  id: String(i + 1), referenceCode: `3f2a91c${i}-7b1e-4c1d-9a55-0d2e6b8f${String(i).padStart(4, "0")}`, status, fullName,
  email: `${fullName.split(" ")[0].toLowerCase()}@student.tut.ac.za`, phone: "072 345 6789",
  idNumber: `0${3 + (i % 6)}0${1 + (i % 9)}1260${String(10 + i).padStart(2, "0")}083`,
  studentNumber, institution: "Tshwane University of Technology", qualification: `Diploma in ${course}`, yearOfStudy: 2 + (i % 2),
  interviewAt: status === "INTERVIEWEE" ? "2026-10-28T10:00" : undefined,
  interviewVenue: status === "INTERVIEWEE" ? `ICEP ${campus}, Room 2` : undefined,
  reviewedBy: status !== "PENDING" ? { fullName: ADMIN } : undefined, reviewedAt: status !== "PENDING" ? "2026-10-01" : undefined,
  rejectionReason: status === "REJECTED" ? "Position filled" : undefined,
  createdAt, position: { title: POS[i % 5], campus: { name: campus } },
  documents: DOCS.map(([s, type, n, sizeBytes]) => ({ id: `${i}${s}`, type, fileName: `${fullName.replace(" ", "_")}_${n}.pdf`, fileUrl: "", sizeBytes, uploadedAt: createdAt })), // fileUrl = Supabase Storage URL
}))

/* ---------- helpers ---------- */
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const fmtD = (iso?: string) => { if (!iso) return "—"; const d = new Date(iso); return `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}` }
const fmtDT = (iso?: string) => { if (!iso) return ""; const d = new Date(iso); return `${fmtD(iso)}, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` }
const initials = (n: string) => n.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
const course = (q: string) => { const [l, ...r] = q.split(" in "); return r.length ? { level: l, name: r.join(" in ") } : { level: "", name: q } }
const maskId = (id?: string) => (id ? id.slice(0, 6) + "•".repeat(Math.max(id.length - 6, 0)) : "—") // POPIA: show DOB part only

async function download(d: Doc) {
  try {
    const blob = d.fileUrl ? await (await fetch(d.fileUrl)).blob() : new Blob([`Demo file: ${d.fileName}`], { type: "text/plain" })
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: d.fileName })
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(a.href)
  } catch { if (d.fileUrl) window.open(d.fileUrl, "_blank") }
}

const Pill = ({ s }: { s: Status }) => <span className="pill" style={{ background: ST[s].t, color: ST[s].x }}>{ST[s].l}</span>
const Kv = ({ k, v }: { k: string; v?: string | number }) => <div className="kv"><span>{k}</span><b>{v || "—"}</b></div>
// Pop-ups render on <body> so the sidebar / top bar can never cover them
const Layer = ({ onClose, tone, wide, children }: { onClose: () => void; tone: string; wide?: boolean; children: ReactNode }) =>
  createPortal(
    <div className="ap-layer ov" onClick={onClose}>
      <div className={`modal ${wide ? "wide" : ""}`} style={{ borderTopColor: tone }} role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>{children}</div>
    </div>, document.body)

/* ---------- page ---------- */
export function ApplicantsPage() {
  const [rows, setRows] = useState<App[]>(SEED)
  const [q, setQ] = useState(""), [campus, setCampus] = useState(""), [status, setStatus] = useState("")
  const [page, setPage] = useState(1), [size, setSize] = useState(8)
  const [sort, setSort] = useState<{ f: SortField; dir: 1 | -1 }>({ f: "createdAt", dir: -1 })
  const [viewing, setViewing] = useState<App | null>(null)
  const [act, setAct] = useState<{ kind: Kind; a: App } | null>(null)
  const [f, setF] = useState({ a: "", b: "", reason: "" }) // a = date/time, b = venue
  const [busy, setBusy] = useState(false), [toast, setToast] = useState("")

  useEffect(() => { // Esc closes pop-ups; page doesn't scroll behind them
    if (!act && !viewing) return
    const key = (e: KeyboardEvent) => e.key === "Escape" && (act ? setAct(null) : setViewing(null))
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"; window.addEventListener("keydown", key)
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", key) }
  }, [act, viewing])

  const filtered = useMemo(() => {
    const val = (r: App) => sort.f === "campus" ? r.position.campus.name : (r[sort.f as keyof App] as string)
    return rows
      .filter(r => (r.fullName + r.studentNumber).toLowerCase().includes(q.toLowerCase()) && (!campus || r.position.campus.name === campus) && (!status || r.status === status))
      .sort((x, y) => val(x).localeCompare(val(y)) * sort.dir)
  }, [rows, q, campus, status, sort])

  const pages = Math.max(1, Math.ceil(filtered.length / size)), cur = Math.min(page, pages), start = (cur - 1) * size
  const shown = filtered.slice(start, start + size)
  const first = Math.max(1, Math.min(cur - 1, pages - 2))
  const nums = Array.from({ length: Math.min(3, pages) }, (_, i) => first + i)
  const resetFilters = () => { setQ(""); setCampus(""); setStatus(""); setPage(1) }
  const sortBy = (field: SortField) => setSort(s => ({ f: field, dir: s.f === field ? (-s.dir as 1 | -1) : 1 }))
  const th = (label: string, field: SortField) => <th className="sortable" onClick={() => sortBy(field)}>{label}{sort.f === field && (sort.dir === 1 ? " ↑" : " ↓")}</th>

  // email: static parts filled on open; only the scheduling inputs (dynamic parts) are editable
  const email = useMemo(() => {
    if (!act) return null
    const { kind, a } = act
    const stat = { fullName: a.fullName, position: a.position.title, campus: a.position.campus.name, reference: a.referenceCode }
    const vals = kind === "reject" ? [reasonText(f.reason)] : [fmtDT(f.a), f.b]
    const dyn = Object.fromEntries(DYN[kind].map(([k, ph], i) => [k, { v: vals[i], ph }]))
    const parts = fill(TPL[kind].body, stat).split(/\{\{(\w+)\}\}/g)
    return {
      subject: fill(TPL[kind].subject, stat),
      text: parts.map((s, i) => (i % 2 ? dyn[s].v || dyn[s].ph : s)).join(""),
      node: parts.map((s, i) => i % 2 ? <span key={i} className={dyn[s].v ? "hv" : "hv e"}>{dyn[s].v || dyn[s].ph}</span> : s),
    }
  }, [act, f])

  const openAct = (kind: Kind, a: App) => { setF({ a: "", b: "", reason: "" }); setAct({ kind, a }) }
  const ready = !!act && (act.kind === "reject" || (f.a && f.b))
  const say = (m: string) => { setToast(m); setTimeout(() => setToast(""), 3000) }

  const confirm = () => {
    if (!act || !email || !ready) return
    const { kind, a } = act
    setBusy(true)
    setTimeout(() => {
      const base = { reviewedBy: { fullName: ADMIN }, reviewedAt: new Date().toISOString(), emailSubject: email.subject, emailBody: email.text, status: TONE[kind] }
      const patch: Partial<App> = kind === "interview" ? { ...base, interviewAt: f.a, interviewVenue: f.b }
        : kind === "accept" ? { ...base, startDate: f.a, startVenue: f.b } : { ...base, rejectionReason: f.reason || undefined }
      // TODO: PATCH /api/applications/:id/{interview|accept|reject} — backend sends the email
      setRows(rs => rs.map(r => (r.id === a.id ? { ...r, ...patch } : r)))
      say(kind === "interview" ? `Interview invite sent to ${a.fullName}` : kind === "accept" ? `${a.fullName} accepted — email sent` : `${a.fullName} rejected`)
      setAct(null); setBusy(false)
    }, 600)
  }

  const rowClick = (e: MouseEvent, a: App) => { if (!(e.target as HTMLElement).closest("button")) setViewing(a) }

  return (
    <main className="page">
      <style>{CSS}</style>
      <h1>Applicants</h1>

      <div className="bar">
        <label className="field search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input placeholder="Search name or student number" value={q} onChange={e => { setQ(e.target.value); setPage(1) }} />
        </label>
        <select className="field sel" value={campus} onChange={e => { setCampus(e.target.value); setPage(1) }}>
          <option value="">All campuses</option>{CAMP.map(c => <option key={c}>{c}</option>)}</select>
        <select className="field sel" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All statuses</option>{(Object.keys(ST) as Status[]).map(s => <option key={s} value={s}>{ST[s].l}</option>)}</select>
        <button className="clear" onClick={resetFilters}>Clear filters</button>
      </div>

      <div className="card">
        <div className="scroll">
          <table>
            <thead><tr>{th("Name", "fullName")}{th("Student No.", "studentNumber")}{th("Campus", "campus")}<th>Course</th>{th("Date applied", "createdAt")}{th("Status", "status")}<th>Actions</th></tr></thead>
            <tbody>
              {shown.map(a => {
                const c = course(a.qualification)
                return (
                  <tr key={a.id} onClick={e => rowClick(e, a)}>
                    <td><div className="nm"><span className="av">{initials(a.fullName)}</span>{a.fullName}</div></td>
                    <td>{a.studentNumber}</td><td>{a.position.campus.name}</td>
                    <td>{c.name}{c.level && <small>{c.level}</small>}</td>
                    <td>{fmtD(a.createdAt)}</td><td><Pill s={a.status} /></td>
                    <td><div className="acts">
                      <button className="b" onClick={() => setViewing(a)}>View</button>
                      {a.status === "PENDING" && <button className="b interview" onClick={() => openAct("interview", a)}>Interview</button>}
                      {(a.status === "PENDING" || a.status === "INTERVIEWEE") && <>
                        <button className="b accept" onClick={() => openAct("accept", a)}>Accept</button>
                        <button className="b reject" onClick={() => openAct("reject", a)}>Reject</button></>}
                      {a.status === "ACCEPTED" && <span className="sent">✓ Email sent</span>}
                    </div></td>
                  </tr>)
              })}
              {!shown.length && <tr><td colSpan={7} className="empty">No applicants found. <button className="clear" onClick={resetFilters}>Reset filters</button></td></tr>}
            </tbody>
          </table>
        </div>
        <div className="foot">
          <span className="sm">{filtered.length ? `Showing ${start + 1}–${start + shown.length} of ${filtered.length} applicants` : "Showing 0 applicants"}</span>
          <div className="pg">
            <span className="sm">Rows per page</span>
            <select className="field rpp" value={size} onChange={e => { setSize(+e.target.value); setPage(1) }}>{[8, 16, 24].map(n => <option key={n}>{n}</option>)}</select>
            <button className="pb" disabled={cur === 1} onClick={() => setPage(cur - 1)}>Previous</button>
            {nums.map(n => <button key={n} className={n === cur ? "pb on" : "pb"} onClick={() => setPage(n)}>{n}</button>)}
            <button className="pb next" disabled={cur === pages} onClick={() => setPage(cur + 1)}>Next</button>
          </div>
        </div>
      </div>

      {/* VIEW pop-up: details + downloadable documents */}
      {viewing && (
        <Layer onClose={() => setViewing(null)} tone="#1B3A5C" wide>
          <div className="mh">
            <div className="nm"><span className="av lg">{initials(viewing.fullName)}</span>
              <div><h2>{viewing.fullName}</h2><Pill s={viewing.status} /></div></div>
            <button className="x" onClick={() => setViewing(null)} aria-label="Close">×</button>
          </div>
          <div className="mb">
            <span className="sm">Reference: {viewing.referenceCode}</span>
            <div className="grid">
              <section><h3>Personal details</h3><Kv k="Full name" v={viewing.fullName} /><Kv k="Email" v={viewing.email} /><Kv k="Phone" v={viewing.phone} /><Kv k="ID number" v={maskId(viewing.idNumber)} /></section>
              <section><h3>Application</h3><Kv k="Campus" v={viewing.position.campus.name} /><Kv k="Status" v={ST[viewing.status].l} /><Kv k="Date applied" v={fmtD(viewing.createdAt)} /></section>
              <section><h3>Studies</h3><Kv k="Student number" v={viewing.studentNumber} /><Kv k="Institution" v={viewing.institution} /><Kv k="Qualification" v={viewing.qualification} /><Kv k="Year of study" v={viewing.yearOfStudy} /></section>
            </div>
            <h3>Documents</h3>
            <ul className="docs">
              {viewing.documents.map(d => (
                <li key={d.id}>
                  <div><b>{d.fileName}</b><span className="sm">{DOC_LABEL[d.type]}{d.sizeBytes ? ` · ${Math.round(d.sizeBytes / 1024)} KB` : ""} · uploaded {fmtD(d.uploadedAt)}</span></div>
                  <button className="b" onClick={() => download(d)}>Download</button>
                </li>))}
              {!viewing.documents.length && <li className="sm">No documents uploaded.</li>}
            </ul>
          </div>
          <div className="mf">
            {viewing.documents.length > 1 && <button className="b" onClick={() => viewing.documents.forEach(download)}>Download all</button>}
            <button className="b solid accept" onClick={() => setViewing(null)}>Close</button>
          </div>
        </Layer>
      )}

      {/* Interview / Accept / Reject pop-up */}
      {act && email && (
        <Layer onClose={() => setAct(null)} tone={ST[TONE[act.kind]].c} wide>
          <div className="mh">
            <div><h2>{CFG[act.kind].title}</h2><span className="sm">{act.a.fullName} · {act.a.position.title} · {act.a.email}</span></div>
            <button className="x" onClick={() => setAct(null)} aria-label="Close">×</button>
          </div>
          <div className="mb em-grid">
            <div className="em-left">
              <h3>{act.kind === "reject" ? "Rejection reason" : "Scheduling"}</h3>
              {act.kind === "reject"
                ? <label>Reason (optional)<textarea className="field" rows={4} value={f.reason} onChange={e => setF({ ...f, reason: e.target.value })} placeholder="e.g. Position filled; please reapply next cycle." /></label>
                : <>
                  <label>{CFG[act.kind].a}<input className="field" type="datetime-local" value={f.a} onChange={e => setF({ ...f, a: e.target.value })} /></label>
                  <label>{CFG[act.kind].b}<input className="field" value={f.b} onChange={e => setF({ ...f, b: e.target.value })} placeholder={CFG[act.kind].ph} /></label></>}
              <span className="sm">The email to {act.a.email} updates as you type.</span>
            </div>
            <div className="em-right">
              <div className="meta"><div><span className="sm">To:</span> <b>{act.a.email}</b></div><div><span className="sm">Subject:</span> <b>{email.subject}</b></div></div>
              <div className="em-body">{email.node}</div>
            </div>
          </div>
          <div className="mf">
            <button className="b" onClick={() => setAct(null)} disabled={busy}>Cancel</button>
            <button className={`b solid ${act.kind}`} disabled={!ready || busy} onClick={confirm}>{busy ? "Sending…" : CFG[act.kind].btn}</button>
          </div>
        </Layer>
      )}
      {toast && <div className="toast">{toast}</div>}
    </main>
  )
}

export default ApplicantsPage

/* ---------- styles: ICEP style guide only (Inter · card radius 12 · button radius 8) ---------- */
const CSS = `
.page,.ap-layer{--navy:#1B3A5C;--dark:#12283F;--bg:#F5F6F8;--card:#FFFFFF;--h:#1A202C;--s:#718096;--line:rgba(27,58,92,.14);
  font:400 14px/1.5 Inter,system-ui,sans-serif;color:var(--h)}
.page *,.ap-layer *{box-sizing:border-box}
.page{background:var(--bg);min-height:100vh;padding:26px 32px}
.page h1{margin:0 0 20px;font-size:28px;font-weight:700;line-height:1.2}
.sm{font-size:12px;color:var(--s)}
.bar{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:16px}
.field{height:44px;background:var(--card);border:1px solid var(--line);border-radius:8px;padding:0 14px;font:inherit;color:var(--h)}
.field:focus,.field:focus-within{outline:0;border-color:var(--navy);box-shadow:0 0 0 3px rgba(27,58,92,.15)}
.search{display:flex;align-items:center;gap:10px;width:340px;color:var(--s)}
.search input{border:0;outline:0;flex:1;font:inherit;color:var(--h);background:none;min-width:0}
.search input::placeholder,.field::placeholder{color:var(--s)}
.sel,.rpp{appearance:none;cursor:pointer;padding-right:36px;min-width:190px;background:var(--card) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%231B3A5C' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m3 6 5 5 5-5'/%3E%3C/svg%3E") no-repeat right 14px center}
.rpp{min-width:76px;height:40px}
.clear{border:0;background:none;color:var(--s);font:600 14px Inter,sans-serif;cursor:pointer}.clear:hover{color:var(--navy)}
.card{background:var(--card);border-radius:12px;box-shadow:0 1px 3px rgba(18,40,63,.08);overflow:hidden}
.scroll{overflow-x:auto}
table{width:100%;border-collapse:collapse;min-width:960px}
th{text-align:left;padding:16px 12px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.03em;color:var(--s);border-bottom:1px solid var(--line);white-space:nowrap}
th.sortable{cursor:pointer;user-select:none}th.sortable:hover{color:var(--navy)}
td{padding:12px;border-bottom:1px solid var(--line);white-space:nowrap}
th:first-child,td:first-child{padding-left:24px}
td small{display:block;font-size:12px;color:var(--s)}
tbody tr{cursor:pointer}tbody tr:hover{background:rgba(27,58,92,.035)}
.nm{display:flex;align-items:center;gap:12px}
.av{width:36px;height:36px;border-radius:50%;background:rgba(27,58,92,.1);color:var(--navy);font-weight:600;font-size:12px;display:inline-flex;align-items:center;justify-content:center;flex:none}
.av.lg{width:48px;height:48px;font-size:14px}
.pill{display:inline-block;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600}
.acts{display:flex;gap:8px;align-items:center}
.b{height:36px;padding:0 14px;border-radius:8px;background:var(--card);border:1.5px solid var(--line);color:var(--navy);font:600 14px Inter,sans-serif;cursor:pointer}
.b:hover:not(:disabled){background:rgba(27,58,92,.05)}.b:disabled{opacity:.5;cursor:not-allowed}
.b:focus-visible,.pb:focus-visible,.x:focus-visible{outline:2px solid #3B82F6;outline-offset:2px}
.b.accept{border-color:var(--navy)}.b.interview{border-color:#3B82F6;color:#1E40AF}.b.reject{border-color:#DC2626;color:#991B1B}
.b.solid{color:#fff}.b.solid.accept{background:var(--navy)}.b.solid.interview{background:#3B82F6;border-color:#3B82F6}.b.solid.reject{background:#DC2626;border-color:#DC2626}
.sent{color:#166534;font-weight:600;margin-left:4px}
.empty{text-align:center;color:var(--s);padding:40px!important;cursor:default}
.foot{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;padding:16px 24px}
.pg{display:flex;align-items:center;gap:8px}
.pb{min-width:40px;height:40px;padding:0 12px;border-radius:8px;background:var(--card);border:1px solid var(--line);font:500 14px Inter,sans-serif;color:var(--navy);cursor:pointer}
.pb.on{background:var(--navy);border-color:var(--navy);color:#fff;font-weight:600}.pb.next{border:1.5px solid var(--navy);font-weight:600}
.pb:disabled{color:var(--s);cursor:not-allowed}

/* pop-ups */
.ov{position:fixed;inset:0;z-index:2147483000;display:flex;justify-content:center;align-items:center;padding:20px;background:rgba(18,40,63,.72);backdrop-filter:blur(4px)}
.modal{display:flex;flex-direction:column;background:var(--card);border-radius:12px;border-top:5px solid var(--navy);width:min(480px,100%);max-height:calc(100vh - 40px);overflow:hidden;box-shadow:0 0 0 1px var(--line),0 28px 70px rgba(18,40,63,.5)}
.modal.wide{width:min(960px,100%)}
.mh{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:20px 24px 12px}
.mb{padding:0 24px 18px;overflow:auto;flex:1;min-height:0;display:grid;gap:10px;align-content:start}
.mf{display:flex;justify-content:flex-end;gap:10px;padding:14px 24px;border-top:1px solid var(--line);background:var(--bg)}
.modal h2{margin:0 0 4px;font-size:20px;font-weight:600}
.modal h3{margin:8px 0 4px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.03em;color:var(--s)}
.modal label{display:grid;gap:6px;font-weight:600}
.modal .field{font-weight:400}.modal textarea.field{height:auto;padding:10px 14px;resize:vertical}
.x{border:0;background:var(--bg);width:34px;height:34px;border-radius:50%;font-size:22px;line-height:1;color:var(--s);cursor:pointer}.x:hover{color:var(--navy)}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:4px 28px}
.kv{display:flex;justify-content:space-between;gap:14px;padding:7px 0;border-bottom:1px solid var(--line)}
.kv span{color:var(--s)}.kv b{font-weight:600;text-align:right;word-break:break-word}
.docs{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.docs li{display:flex;justify-content:space-between;align-items:center;gap:12px;border:1px solid var(--line);border-radius:8px;padding:8px 12px}
.docs li b{display:block;font-weight:600}
.em-grid{grid-template-columns:290px 1fr;gap:18px;align-items:start}
.em-left{display:grid;gap:10px;background:var(--bg);border:1px solid var(--line);border-radius:12px;padding:14px}
.em-right{display:grid;gap:10px;min-width:0}
.meta{background:var(--bg);border:1px solid var(--line);border-radius:8px;padding:10px 12px;display:grid;gap:2px}
.em-body{border:1px solid var(--line);border-radius:8px;padding:16px 18px;white-space:pre-wrap;word-break:break-word;max-height:380px;overflow:auto;line-height:1.65}
.hv{color:#1E40AF;font-weight:600}.hv.e{color:var(--s);font-weight:400;font-style:italic}
.toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:var(--navy);color:#fff;padding:12px 20px;border-radius:8px;z-index:2147483100;box-shadow:0 8px 24px rgba(18,40,63,.35)}
@media(max-width:760px){.grid,.em-grid{grid-template-columns:1fr}.page{padding:20px}}
`