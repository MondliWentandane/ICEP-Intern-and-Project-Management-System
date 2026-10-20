import { useEffect, useState, type ChangeEvent, type CSSProperties, type FormEvent, type ReactNode } from 'react'

/** frontend/src/features/applicants/pages/ApplicantsPage.tsx — page content only (no sidebar / top bar); styles are included below. */

const CSS = `
.ap{--nv:#132845;--nv2:#1d3862;--pr:#1a3358;--bg:#f4f6f9;--ln:#e6eaf0;--mu:#6b7a90;--tx:#0f1a2b;color:var(--tx);font-family:inherit;font-size:13.5px}
.ap *{box-sizing:border-box}
.ap button,.ap input,.ap select{font:inherit}
.ap-b,.ap-pg{color:var(--tx)}
.ap-av{width:30px;height:30px;border-radius:50%;background:#e9eef6;color:var(--nv);font-weight:700;font-size:11px;display:grid;place-items:center;flex:none}
.ap-body{padding:21px}
.ap-bar{display:flex;align-items:center;gap:10px;margin-bottom:14px}
.ap-in,.ap-sel{height:37px;background:#fff;border:1px solid var(--ln);border-radius:9px;display:flex;align-items:center;gap:10px;padding:0 12px;color:var(--mu)}
.ap-in{width:270px}.ap-in input{border:0;outline:0;width:100%;background:none;color:var(--tx)}
.ap-sel{width:148px;position:relative}.ap-sel select{appearance:none;border:0;outline:0;background:none;width:100%;height:100%;cursor:pointer;color:var(--tx);padding-right:18px}
.ap-sel svg{position:absolute;right:10px;pointer-events:none}
.ap-clr{height:37px;padding:0 14px;background:#fff;border:1px solid var(--ln);border-radius:9px;color:var(--mu);font-weight:600;cursor:pointer}.ap-clr.on{color:var(--pr);border-color:var(--pr)}.ap-clr:hover{background:var(--bg)}
.ap-add{margin-left:auto;height:37px;padding:0 16px;border:0;border-radius:9px;background:var(--pr);color:#fff;font-weight:600;display:flex;align-items:center;gap:8px;cursor:pointer}
.ap-card{background:#fff;border-radius:14px;box-shadow:0 1px 3px rgba(16,24,40,.06);overflow:hidden}
.ap table{width:100%;min-width:1120px;border-collapse:collapse;table-layout:fixed}
.ap-tw{overflow-x:auto}
.ap th{height:40px;text-align:left;font-size:11.5px;font-weight:600;color:var(--mu);letter-spacing:.02em;padding:0 0 0 0;text-transform:uppercase;border-bottom:1px solid var(--ln)}
.ap td{height:54px;border-bottom:1px solid var(--ln);padding:0;vertical-align:middle}
.ap th:first-child,.ap td:first-child{padding-left:20px}
.ap-nm{display:flex;align-items:center;gap:10px}
.ap-sub{display:block;color:var(--mu);font-size:12px}
.ap-pill{display:inline-block;white-space:nowrap;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:600}
.s-Pending{background:#fdf0c4;color:#a15c07}.s-Interview{background:#dbe8fe;color:#1d4ed8}.s-Accepted{background:#d3f5de;color:#15803d}.s-Rejected{background:#fcd9d9;color:#b42318}
.ap-act{display:flex;align-items:center;gap:6px;white-space:nowrap}
.ap-b{height:27px;padding:0 12px;border-radius:7px;border:1px solid var(--ln);background:#fff;cursor:pointer}
.ap-b.a{border-color:var(--pr);color:var(--pr);font-weight:600}.ap-b.r{border-color:#c0392b;color:#b42318;font-weight:600}
.ap-ok{color:#15803d;display:flex;align-items:center;gap:6px;margin-left:6px;white-space:nowrap}
.ap-ft{display:flex;align-items:center;padding:14px 20px;color:var(--mu);gap:8px}
.ap-ft .ap-sel{width:70px;height:30px;color:var(--tx);margin-right:8px}
.ap-pg{min-width:30px;height:30px;padding:0 10px;border-radius:7px;border:1px solid var(--ln);background:#fff;cursor:pointer}
.ap-pg.on{background:var(--pr);border-color:var(--pr);color:#fff;font-weight:700}
.ap-pg.n{border-color:var(--pr);color:var(--pr);font-weight:600}.ap-pg:disabled{color:#a9b4c4;cursor:default}
.ap-empty{text-align:center;color:var(--mu);height:90px}
.ap-ov{position:fixed;inset:0;background:rgba(15,26,43,.55);display:grid;place-items:center;z-index:50;padding:16px}
.ap-dl{background:#fff;border-radius:14px;width:min(403px,100%);max-height:100%;overflow:auto;box-shadow:0 20px 50px rgba(16,24,40,.25)}
.ap-dh{display:flex;align-items:center;min-height:66px;padding:12px 27px;border-bottom:1px solid var(--ln)}
.ap-dh h2{margin:0;font-size:19.5px;font-weight:700}.ap-dh p{margin:2px 0 0;color:var(--mu);font-size:14px}
.ap-x{margin-left:auto;border:0;background:none;color:var(--mu);cursor:pointer;display:flex}
.ap-bd{padding:19px 27px 18px}
.ap-df{display:flex;justify-content:flex-end;gap:9px;padding:16px 27px 14px;border-top:1px solid var(--ln)}
.ap-dd{display:grid;gap:11px;margin:0}.ap-dd>div{display:flex;align-items:center;min-height:23px}.ap-dd dt{width:134px;color:var(--mu);font-size:14px}.ap-dd dd{margin:0;font-size:14.5px}
.ap-q{margin:0 0 14px;font-size:14.5px}.ap-hint{margin:-8px 0 16px;color:var(--mu);font-size:14px}
.ap-mail{display:flex;gap:12px;align-items:center;background:#f3f5f8;border-radius:10px;padding:14px;color:var(--mu);font-size:14px;line-height:1.5}.ap-mail svg{flex:none}
.ap-rl{display:grid;gap:8px;font-size:14.5px}.ap-rl span{color:var(--mu)}
.ap-fm{display:grid;gap:8px}.ap-fm label{display:grid;gap:8px;font-size:14.5px}.ap-fm small{color:#b42318;font-size:12.5px}.ap-fm small:empty{display:none}
.ap-fi{height:33px;border:1px solid #e2e7ef;border-radius:8px;padding:0 12px;background:#fff;font-weight:400;font-size:14.5px;color:var(--tx);width:100%}.ap-fi::placeholder{color:#9aa7b8}
.ap-fi:focus{outline:2px solid var(--pr);border-color:transparent}
.ap-ta{height:68px;padding:10px 12px;resize:none;font-size:14px}
.ap-dl .ap-b{height:33px;padding:0 16px;border-radius:8px;font-size:14px}
.ap-dl .ap-add{margin-left:0;height:33px;border-radius:8px;font-size:14px;font-weight:700}
.ap-bt{font-weight:700}.ap-bl{font-weight:500}
.ap-bp{background:var(--pr);border-color:var(--pr);color:#fff;font-weight:700}
.ap-br{background:#9b1c1c;border-color:#9b1c1c;color:#fff;font-weight:700}
.ap-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--nv);color:#fff;padding:10px 16px;border-radius:10px;z-index:60;box-shadow:0 8px 24px rgba(16,24,40,.25)}
.ap-fsel{position:relative;display:flex}.ap-fsel select{appearance:none;padding-right:34px;cursor:pointer}.ap-fsel svg{position:absolute;right:12px;top:50%;transform:translateY(-50%);pointer-events:none}
.ap-note{margin-right:auto;color:var(--mu);font-size:12.5px;line-height:1.4}
.ap-vp{display:inline-flex;align-items:center;gap:6px;background:#d9f5e3;color:#15803d;font-weight:700;font-size:12.5px;padding:3px 10px;border-radius:999px;white-space:nowrap}
.ap-vp i{width:7px;height:7px;border-radius:50%;background:#16a34a}
.ap-ar{display:flex;align-items:center;gap:0;margin-bottom:10px;min-height:27px}
.ap-ar .l{width:49px;flex:none;color:var(--mu);font-size:14px}.ap-ar .v{flex:1;padding-left:8px;font-size:14.5px}
.ap-ar .ap-i2{height:27px}
.ap-row2{display:flex;align-items:center;height:40px;border-bottom:1px solid #eef1f5}.ap-row2:last-child{border-bottom:0}
.ap-row2>span:first-child{width:67px;flex:none;color:var(--mu);font-size:14px}.ap-row2 b{font-weight:400;font-size:14.5px}.ap-row2 .ap-vp{margin-left:20px}
.ap-msg{background:#f4f6f9;border:1px solid var(--ln);border-radius:12px;padding:16px 17px;font-size:14px;line-height:1.2;margin-top:14px}
.ap-ar+.ap-msg{margin-top:14px}.ap-row2+.ap-msg{margin-top:16px}
.ap-msg p{margin:0 0 7px}.ap-msg b{font-weight:700}
.ap-msg .btn{display:inline-block;background:var(--pr);color:#fff;font-weight:700;padding:8px 13px;border-radius:7px;margin:3px 0 14px}
.ap-msg.big{font-size:15px;line-height:1.25;min-height:257px;padding:18px 20px}.ap-msg.big p{margin:0 0 12px}
.ap-b.sl{border-color:#2563eb;color:#1d4ed8;font-weight:600}
`

type Status = 'Pending' | 'Interview' | 'Accepted' | 'Rejected'
export interface Applicant {
  id: number; name: string; studentNo: string; campus: string; course: string; level: string; date: string; status: Status
  note?: string
  /** true once the interview invitation email has been sent */
  interviewEmailSent?: boolean
}

const BASE: Applicant[] = [
  { id: 1, name: 'Thabo Molefe', studentNo: '210000000', campus: 'Soshanguve South', course: 'Computer Science', level: 'Diploma', date: '30 Sep 2026', status: 'Pending' },
  { id: 2, name: 'Lerato Dlamini', studentNo: '217919317', campus: 'Arcadia', course: 'Information Technology', level: 'Diploma', date: '30 Sep 2026', status: 'Pending' },
  { id: 3, name: 'Sipho Nkosi', studentNo: '225838634', campus: 'Mbombela', course: 'Computer Systems Eng.', level: 'Diploma', date: '29 Sep 2026', status: 'Interview' },
  { id: 4, name: 'Naledi Khumalo', studentNo: '233757951', campus: 'Soshanguve North', course: 'Multimedia Computing', level: 'Diploma', date: '29 Sep 2026', status: 'Pending' },
  { id: 5, name: 'Kabelo Sithole', studentNo: '241677268', campus: 'Ga-Rankuwa', course: 'Information Technology', level: 'Diploma', date: '28 Sep 2026', status: 'Accepted' },
  { id: 6, name: 'Zanele Mokoena', studentNo: '249596585', campus: 'Polokwane', course: 'Informatics', level: 'Diploma', date: '27 Sep 2026', status: 'Pending' },
  { id: 7, name: 'Tshepo Mahlangu', studentNo: '257515902', campus: 'Arcadia', course: 'Multimedia Computing', level: 'Diploma', date: '26 Sep 2026', status: 'Rejected' },
  { id: 8, name: 'Palesa Radebe', studentNo: '265435219', campus: 'eMalahleni', course: 'Computer Science', level: 'Diploma', date: '26 Sep 2026', status: 'Pending' },
]

const FIRST = ['Lindiwe', 'Mpho', 'Themba', 'Nomsa', 'Bongani', 'Refilwe', 'Sizwe', 'Karabo', 'Ayanda', 'Lesedi', 'Given', 'Precious', 'Katlego', 'Thandi']
const LAST = ['Ndlovu', 'Mokwena', 'Zulu', 'Baloyi', 'Maseko', 'Ngwenya', 'Molefe', 'Mthembu', 'Sebola', 'Tau', 'Dube', 'Shabalala', 'Mabasa', 'Letsoalo']
const CAMPUSES = ['Soshanguve South', 'Arcadia', 'Mbombela', 'Soshanguve North', 'Ga-Rankuwa', 'Polokwane', 'eMalahleni']
const COURSES = ['Computer Science', 'Information Technology', 'Computer Systems Eng.', 'Multimedia Computing', 'Informatics']
const STATUSES: Status[] = ['Pending', 'Pending', 'Interview', 'Pending', 'Accepted', 'Rejected', 'Pending']
// Sample data: the 8 rows from the design plus 28 generated ones (36 in total). Pass real data with the `applicants` prop.
const SAMPLE: Applicant[] = [
  ...BASE,
  ...Array.from({ length: 28 }, (_, i): Applicant => ({
    id: i + 9, name: `${FIRST[i % 14]} ${LAST[(i * 5 + 3) % 14]}`, studentNo: String(273354536 + i * 7919317),
    campus: CAMPUSES[i % 7], course: COURSES[(i * 3) % 5], level: 'Diploma',
    date: `${String(25 - (i >> 1)).padStart(2, '0')} Sep 2026`, status: STATUSES[i % 7],
  })),
]

const P = {
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  down: 'm6 9 6 6 6-6',
  plus: 'M12 5v14M5 12h14',
  check: 'm5 12 5 5 9-10',
  x: 'M18 6 6 18M6 6l12 12',
  mail: 'M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM2 7l10 7 10-7',
}
const Ic = ({ d, s = 20 }: { d: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
)

const HEAD = ['Name', 'Student no.', 'Campus', 'Course', 'Date applied', 'Status', 'Actions']
// Actions column is wide enough for View + Shortlist + Accept + Reject.
const WIDTH = ['17%', '10%', '11%', '15%', '9%', '8%', '30%']
const initials = (n: string) => n.split(' ').map((w) => w[0]).join('')

const today = () => new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
type Dlg = null | { kind: 'add' } | { kind: 'view' | 'accept' | 'reject' | 'mailA' | 'mailR' | 'mailI'; a: Applicant }
const prog = (a: Applicant) => `${a.level} in ${a.course}`
type NewApplicant = Pick<Applicant, 'name' | 'studentNo' | 'campus' | 'course' | 'level'>

function Select({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: ReactNode }) {
  return (
    <label className="ap-sel">
      <select value={value} onChange={(e) => onChange(e.target.value)}>{children}</select>
      <Ic d={P.down} s={16} />
    </label>
  )
}

function Modal({ title, subtitle, width = 403, bodyStyle, onClose, children, footer }: {
  title: string; subtitle?: string; width?: number; bodyStyle?: CSSProperties; onClose: () => void; children: ReactNode; footer: ReactNode
}) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    addEventListener('keydown', k)
    return () => removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div className="ap-ov" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ap-dl" style={{ width: `min(${width}px, 100%)` }} role="dialog" aria-modal="true" aria-label={title}>
        <div className="ap-dh">
          <div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
          <button className="ap-x" onClick={onClose} aria-label="Close"><Ic d={P.x} s={18} /></button>
        </div>
        <div className="ap-bd" style={bodyStyle}>{children}</div>
        <div className="ap-df">{footer}</div>
      </div>
    </div>
  )
}

function AddForm({ onAdd }: { onAdd: (v: NewApplicant) => void }) {
  const [v, setV] = useState({ name: '', studentNo: '', campus: CAMPUSES[0], course: COURSES[0] })
  const [err, setErr] = useState<{ name?: string; studentNo?: string }>({})
  const on = (k: keyof typeof v) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV((o) => ({ ...o, [k]: e.target.value }))
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const bad: typeof err = {}
    if (!v.name.trim()) bad.name = 'Enter a name'
    if (!/^\d{9}$/.test(v.studentNo)) bad.studentNo = 'Student number must be 9 digits'
    setErr(bad)
    if (!Object.keys(bad).length) onAdd({ ...v, name: v.name.trim(), level: 'Diploma' })
  }
  return (
    <form id="add-form" className="ap-fm" onSubmit={submit} noValidate>
      <label>Full name<input className="ap-fi" value={v.name} onChange={on('name')} placeholder="e.g. Thabo Molefe" />{err.name && <small>{err.name}</small>}</label>
      <label>Student number<input className="ap-fi" value={v.studentNo} onChange={on('studentNo')} placeholder="9 digits" inputMode="numeric" />{err.studentNo && <small>{err.studentNo}</small>}</label>
      <label>Campus
        <span className="ap-fsel"><select className="ap-fi" value={v.campus} onChange={on('campus')}>{CAMPUSES.map((c) => <option key={c}>{c}</option>)}</select><Ic d={P.down} s={16} /></span>
      </label>
      <label>Course applied for
        <span className="ap-fsel"><select className="ap-fi" value={v.course} onChange={on('course')}>{COURSES.map((c) => <option key={c} value={c}>Diploma in {c}</option>)}</select><Ic d={P.down} s={16} /></span>
      </label>
    </form>
  )
}

const first = (a: Applicant) => a.name.split(' ')[0]

function AcceptMail({ a, onClose, onSend }: { a: Applicant; onClose: () => void; onSend: (to: string) => void }) {
  const [to, setTo] = useState(a.name)
  const [subject, setSubject] = useState('Application accepted – ICEP Internship Programme')
  return (
    <Modal title="Send acceptance email" width={470} bodyStyle={{ padding: '14px 27px 18px' }} onClose={onClose} footer={<>
      <span className="ap-note">Template: Application accepted</span>
      <button className="ap-b ap-bt" onClick={onClose}>Cancel</button>
      <button className="ap-b ap-bp" onClick={() => onSend(to.trim() || a.name)}>Send email</button>
    </>}>
      <div className="ap-ar"><span className="l">From</span><span className="v">Alex Williamson (Admin)</span><span className="ap-vp">Outlook connected</span></div>
      <div className="ap-ar"><label className="l" htmlFor="mail-to">To</label><input id="mail-to" className="ap-fi ap-i2" value={to} onChange={(e) => setTo(e.target.value)} /></div>
      <div className="ap-ar"><label className="l" htmlFor="mail-subject">Subject</label><input id="mail-subject" className="ap-fi ap-i2" value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
      <div className="ap-msg">
        <p>Dear {first(a)},</p>
        <p>Congratulations! Your application for the {prog(a)} ({a.campus}) has been accepted.</p>
        <p>Regards,<br /><b>ICEP WIL Office</b></p>
      </div>
    </Modal>
  )
}

function RejectMail({ a, onClose, onSend }: { a: Applicant; onClose: () => void; onSend: () => void }) {
  return (
    <Modal title="Send rejection email" subtitle="Review the message before it is sent to the applicant." width={537}
      bodyStyle={{ padding: '0 27px 20px' }} onClose={onClose} footer={<>
      <span className="ap-note">Template: Application Rejection</span>
      <button className="ap-b ap-bt" onClick={onClose}>Cancel</button>
      <button className="ap-b ap-bp" onClick={onSend}>Send email</button>
    </>}>
      <div className="ap-row2"><span>From</span><b>Amy Tomlinson (Chairman)</b><span className="ap-vp"><i />Verified</span></div>
      <div className="ap-row2"><span>To</span><b>{a.name}</b></div>
      <div className="ap-row2"><span>Subject</span><b>Update on your ICEP application</b></div>
      <div className="ap-msg big">
        <p>Dear {first(a)},</p>
        <p>Thank you for applying for the Intern in {a.course} internship at {a.campus}.</p>
        <p>After careful consideration, we are unable to offer you a placement at this time. We encourage you to apply again in a future intake.</p>
        <p>Regards,<br /><b>ICEP SPL Office</b></p>
      </div>
    </Modal>
  )
}

function InterviewMail({ a, onClose, onSend }: { a: Applicant; onClose: () => void; onSend: (to: string) => void }) {
  const [to, setTo] = useState(a.name)
  const [subject, setSubject] = useState('Interview invitation – ICEP Internship Programme')
  return (
    <Modal title="Send interview email" width={470} bodyStyle={{ padding: '14px 27px 18px' }} onClose={onClose} footer={<>
      <span className="ap-note">Template: Interview invitation</span>
      <button className="ap-b ap-bt" onClick={onClose}>Cancel</button>
      <button className="ap-b ap-bp" onClick={() => onSend(to.trim() || a.name)}>Send email</button>
    </>}>
      <div className="ap-ar"><span className="l">From</span><span className="v">Alex Williamson (Admin)</span><span className="ap-vp">Outlook connected</span></div>
      <div className="ap-ar"><label className="l" htmlFor="mail-to">To</label><input id="mail-to" className="ap-fi ap-i2" value={to} onChange={(e) => setTo(e.target.value)} /></div>
      <div className="ap-ar"><label className="l" htmlFor="mail-subject">Subject</label><input id="mail-subject" className="ap-fi ap-i2" value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
      <div className="ap-msg">
        <p>Dear {first(a)},</p>
        <p>Thank you for applying for the {prog(a)} ({a.campus}).</p>
        <p>We are pleased to let you know that you have been shortlisted. We would like to invite you to an interview.</p>
        <p>Please reply to this email to confirm your availability.</p>
        <p>Regards,<br /><b>ICEP WIL Office</b></p>
      </div>
    </Modal>
  )
}

export function ApplicantsPage({ applicants = SAMPLE }: { applicants?: Applicant[] }) {
  const [rows, setRows] = useState(applicants)
  const [q, setQ] = useState('')
  const [campus, setCampus] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [rpp, setRpp] = useState(8)
  const [dlg, setDlg] = useState<Dlg>(null)
  const [note, setNote] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const campuses = [...new Set(rows.map((a) => a.campus))]
  const list = rows.filter((a) =>
    (!q || `${a.name} ${a.studentNo}`.toLowerCase().includes(q.toLowerCase())) && (!campus || a.campus === campus) && (!status || a.status === status))
  const pages = Math.max(1, Math.ceil(list.length / rpp))
  const cur = Math.min(page, pages)
  const shown = list.slice((cur - 1) * rpp, cur * rpp)
  const from = Math.min(Math.max(1, cur - 1), Math.max(1, pages - 2))
  const nums = Array.from({ length: Math.min(3, pages) }, (_, i) => from + i)
  const filter = (fn: (v: string) => void) => (v: string) => { fn(v); setPage(1) }

  const clearFilters = () => { setQ(''); setCampus(''); setStatus(''); setPage(1) }

  const close = () => setDlg(null)
  const setStatusOf = (a: Applicant, s: Status, n?: string) =>
    setRows((r) => r.map((x) => (x.id === a.id ? { ...x, status: s, ...(n ? { note: n } : {}) } : x)))
  // Accept: confirm -> review email -> Send email marks the applicant Accepted.
  const sendAccept = (a: Applicant, to: string) => { setStatusOf(a, 'Accepted'); setToast(`Email sent to ${to}.`); close() }
  // Shortlist: click Shortlist -> review the interview email -> Send email moves the applicant to Interview.
  // Cancelling the email leaves the status as Pending.
  const sendInterview = (a: Applicant, to: string) => {
    setRows((r) => r.map((x) => (x.id === a.id ? { ...x, status: 'Interview', interviewEmailSent: true } : x)))
    setToast(`Interview email sent to ${to}.`)
    close()
  }
  // Reject: confirm marks the applicant Rejected, then the rejection email can be reviewed and sent (or skipped with Cancel).
  const confirmReject = (a: Applicant, n: string) => { setStatusOf(a, 'Rejected', n); setDlg({ kind: 'mailR', a }) }
  const add = (v: NewApplicant) => {
    setRows((r) => [{ id: Date.now(), ...v, date: today(), status: 'Pending' }, ...r])
    close(); setPage(1); setToast('Applicant added.')
  }
  const open = (s: Status) => s === 'Pending' || s === 'Interview'

  return (
    <div className="ap">
      <style>{CSS}</style>

        <div className="ap-body">
          <div className="ap-bar">
            <label className="ap-in"><Ic d={P.search} /><input placeholder="Search name or student number" value={q} onChange={(e) => filter(setQ)(e.target.value)} /></label>
            <Select value={campus} onChange={filter(setCampus)}>
              <option value="">All campuses</option>
              {campuses.map((c) => <option key={c}>{c}</option>)}
            </Select>
            <Select value={status} onChange={filter(setStatus)}>
              <option value="">All statuses</option>
              {['Pending', 'Interview', 'Accepted', 'Rejected'].map((s) => <option key={s}>{s}</option>)}
            </Select>
            <button type="button" className={`ap-clr${q || campus || status ? ' on' : ''}`} onClick={clearFilters}>Clear filters</button>
            <button className="ap-add" onClick={() => setDlg({ kind: 'add' })}><Ic d={P.plus} />Add applicant</button>
          </div>

          <div className="ap-card">
            <div className="ap-tw"><table>
              <colgroup>{WIDTH.map((w, i) => <col key={i} style={{ width: w }} />)}</colgroup>
              <thead><tr>{HEAD.map((h) => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {shown.map((a) => (
                  <tr key={a.id}>
                    <td><div className="ap-nm"><div className="ap-av">{initials(a.name)}</div>{a.name}</div></td>
                    <td>{a.studentNo}</td>
                    <td>{a.campus}</td>
                    <td>{a.course}<span className="ap-sub">{a.level}</span></td>
                    <td>{a.date}</td>
                    <td><span className={`ap-pill s-${a.status}`}>{a.status}</span></td>
                    <td>
                      <div className="ap-act">
                        <button className="ap-b" onClick={() => setDlg({ kind: 'view', a })}>View</button>
                        {a.status === 'Pending' && <button className="ap-b sl" onClick={() => setDlg({ kind: 'mailI', a })}>Shortlist</button>}
                        {open(a.status) && (
                          <>
                            <button className="ap-b a" onClick={() => setDlg({ kind: 'accept', a })}>Accept</button>
                            <button className="ap-b r" onClick={() => { setNote(''); setDlg({ kind: 'reject', a }) }}>Reject</button>
                          </>
                        )}
                        {a.status === 'Interview' && a.interviewEmailSent && <span className="ap-ok"><Ic d={P.check} s={16} />Interview email sent</span>}
                        {a.status === 'Accepted' && <span className="ap-ok"><Ic d={P.check} s={16} />Email sent</span>}
                      </div>
                    </td>
                  </tr>
                ))}
                {!shown.length && <tr><td colSpan={7} className="ap-empty">No applicants found</td></tr>}
              </tbody>
            </table></div>
            <div className="ap-ft">
              <span>{shown.length ? `Showing ${(cur - 1) * rpp + 1}–${(cur - 1) * rpp + shown.length} of ${list.length} applicants` : 'No applicants'}</span>
              <span style={{ marginLeft: 'auto' }}>Rows per page</span>
              <Select value={String(rpp)} onChange={(v) => { setRpp(+v); setPage(1) }}>
                {[8, 16, 24].map((n) => <option key={n}>{n}</option>)}
              </Select>
              <button className="ap-pg" disabled={cur === 1} onClick={() => setPage(cur - 1)}>Previous</button>
              {nums.map((n) => <button key={n} className={`ap-pg${n === cur ? ' on' : ''}`} onClick={() => setPage(n)}>{n}</button>)}
              <button className="ap-pg n" disabled={cur === pages} onClick={() => setPage(cur + 1)}>Next</button>
            </div>
          </div>
        </div>

      {dlg?.kind === 'add' && (
        <Modal title="Add applicant" bodyStyle={{ padding: '14px 27px 27px' }} onClose={close} footer={<>
          <button className="ap-b ap-bt" onClick={close}>Cancel</button>
          <button type="submit" form="add-form" className="ap-add">Add applicant</button>
        </>}>
          <AddForm onAdd={add} />
        </Modal>
      )}

      {dlg?.kind === 'view' && (
        <Modal title="Applicant details" onClose={close} footer={<>
          <button className="ap-b ap-bt" onClick={close}>Close</button>
          {open(dlg.a.status) && <button className="ap-b ap-bp" onClick={() => setDlg({ kind: 'accept', a: dlg.a })}>Accept</button>}
        </>}>
          <dl className="ap-dd">
            {([['Name', dlg.a.name], ['Student number', dlg.a.studentNo], ['Campus', dlg.a.campus], ['Course applied for', prog(dlg.a)], ['Submitted', dlg.a.date],
              ['Status', <span className={`ap-pill s-${dlg.a.status}`}>{dlg.a.status}</span>]] as [string, ReactNode][]).map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
        </Modal>
      )}

      {dlg?.kind === 'accept' && (
        <Modal title="Accept applicant" onClose={close} footer={<>
          <button className="ap-b ap-bl" onClick={close}>Cancel</button>
          <button className="ap-b ap-bp" onClick={() => setDlg({ kind: 'mailA', a: dlg.a })}>Accept and send email</button>
        </>}>
          <p className="ap-q">Accept <b>{dlg.a.name}</b> for {prog(dlg.a)}?</p>
          <div className="ap-mail"><Ic d={P.mail} s={22} /><span>An acceptance email will be sent to the applicant through Outlook.</span></div>
        </Modal>
      )}

      {dlg?.kind === 'reject' && (
        <Modal title="Reject applicant" onClose={close} footer={<>
          <button className="ap-b ap-bt" onClick={close}>Cancel</button>
          <button className="ap-b ap-br" onClick={() => confirmReject(dlg.a, note.trim())}>Reject applicant</button>
        </>}>
          <p className="ap-q">Reject <b>{dlg.a.name}</b> ({dlg.a.studentNo})?</p>
          <p className="ap-hint">Their status will change to Rejected.</p>
          <label className="ap-rl">
            <span style={{ color: 'inherit' }}>Reason <span>(optional)</span></span>
            <textarea className="ap-fi ap-ta" placeholder="Add a note for this decision..." value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
        </Modal>
      )}
      {dlg?.kind === 'mailA' && <AcceptMail a={dlg.a} onClose={close} onSend={(to) => sendAccept(dlg.a, to)} />}
      {dlg?.kind === 'mailR' && <RejectMail a={dlg.a} onClose={close} onSend={() => { setToast(`Rejection email sent to ${dlg.a.name}.`); close() }} />}

      {dlg?.kind === 'mailI' && <InterviewMail a={dlg.a} onClose={close} onSend={(to) => sendInterview(dlg.a, to)} />}

      {toast && <div className="ap-toast" role="status">{toast}</div>}
    </div>
  )
}

export default ApplicantsPage