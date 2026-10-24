import { useEffect, useMemo, useState } from "react";
import { apiErrorMessage, downloadApplicationDocument, fetchApplications, yearLabel, type ApiApplication } from "@/features/applicants/data/applicationsApi";

/* ------------------------------ Styles ------------------------------ */

const CSS = `
/* ICEP style guide tokens (styles/tokens.css). Light only: no dark theme on this page. */
.interns-page{
  --text:var(--icep-heading);--muted:var(--icep-secondary);--border:var(--icep-border);--line:#E6EAF0;
  --navy:var(--icep-primary);--navy-soft:#E8EEF5;--card:var(--icep-card);--page:var(--icep-page);
  --ease:cubic-bezier(.2,.8,.2,1);
}
.interns-page,.interns-page *{box-sizing:border-box}
.interns-page{color:var(--text);font-family:Inter,Arial,sans-serif;font-size:14px}
.interns-page .wrap{width:100%}

/* Filters */
.interns-page .filters{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:18px;padding:12px;background:var(--card);border:1px solid var(--border);border-radius:var(--icep-radius-lg)}
.interns-page .field{background:var(--card);border:1px solid var(--border);border-radius:var(--icep-radius-md);height:40px;padding:0 12px;color:var(--text);font:inherit;transition:border-color .2s,box-shadow .2s}
.interns-page .field:focus{outline:0;border-color:var(--navy);box-shadow:0 0 0 3px rgba(27,58,92,.12)}
.interns-page input.field{flex:1;min-width:220px}
.interns-page .clear{height:40px;background:var(--card);color:var(--navy);border:1px solid var(--border);border-radius:var(--icep-radius-md);padding:0 16px;font:600 14px Inter,Arial,sans-serif;cursor:pointer;white-space:nowrap;transition:background-color .2s,border-color .2s}
.interns-page .clear:hover{background:var(--page);border-color:var(--navy)}
.interns-page .clear:focus-visible{outline:2px solid var(--navy);outline-offset:2px}

/* Table */
.interns-page .card{background:var(--card);border:1px solid var(--border);border-radius:var(--icep-radius-lg);box-shadow:0 2px 10px rgba(26,32,44,.05);overflow:hidden}
.interns-page .scroll{overflow-x:auto}
.interns-page table{width:100%;border-collapse:separate;border-spacing:0;min-width:820px}
.interns-page th{text-align:left;font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:var(--muted);padding:14px 20px;background:#F8FAFC;border-bottom:1px solid var(--line);font-weight:700}
.interns-page td{padding:14px 20px;border-bottom:1px solid var(--line);color:var(--text)}
/* Rows rise in one by one, and pop out in ICEP navy on hover (as on Applicants) */
.interns-page tbody tr.trow{animation:intern-rise .4s var(--ease) backwards;transition:background-color .25s ease,color .25s ease,transform .3s var(--ease),filter .3s ease}
.interns-page tbody tr.trow:hover{position:relative;z-index:1;background:var(--navy);transform:scale(1.006,1.04);filter:drop-shadow(0 8px 14px rgba(27,58,92,.3))}
.interns-page tbody tr.trow:hover td{color:#fff;border-bottom-color:transparent;box-shadow:1px 0 0 var(--navy)}
.interns-page tbody tr.trow:hover td.muted{color:#C8D5E6}
.interns-page tbody tr.trow:hover .av{background:rgba(255,255,255,.16);color:#fff}
.interns-page tbody tr.trow:hover .btn{border-color:#fff}
.interns-page tr:last-child td{border-bottom:0}
.interns-page .who{display:flex;align-items:center;gap:12px;font-weight:600}
.interns-page .av{width:36px;height:36px;border-radius:50%;background:var(--navy-soft);color:var(--navy);font-size:12px;font-weight:700;display:grid;place-items:center;flex:none}
.interns-page .muted{color:var(--muted)}

/* Status pills: style guide colours */
.interns-page .pill{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:600;white-space:nowrap}
.interns-page .pill::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}
.interns-page .Intern{background:var(--icep-active-tint);color:#166534}
.interns-page .Interviewee{background:var(--icep-completed-tint);color:#1E40AF}
.interns-page .Applicant{background:var(--icep-pending-tint);color:#92400E}
.interns-page .PastIntern{background:#EDF0F4;color:#4A5568}

.interns-page .btn{display:inline-flex;align-items:center;gap:6px;background:var(--card);color:var(--navy);border:1px solid var(--border);border-radius:var(--icep-radius-md);padding:8px 14px;font:600 13px Inter,Arial,sans-serif;cursor:pointer;white-space:nowrap;transition:background-color .2s,color .2s,border-color .2s}
.interns-page .btn:hover{background:var(--navy);color:#fff;border-color:var(--navy)}
.interns-page .btn:focus-visible{outline:2px solid var(--navy);outline-offset:2px}

/* Footer / pagination */
.interns-page .foot{display:flex;justify-content:space-between;align-items:center;padding:14px 20px;border-top:1px solid var(--line);color:var(--muted);flex-wrap:wrap;gap:12px}
.interns-page .pager{display:flex;gap:6px;align-items:center}
.interns-page .pg{min-width:34px;height:34px;border-radius:var(--icep-radius-md);border:1px solid var(--border);background:var(--card);color:var(--text);font:600 13px Inter,Arial,sans-serif;cursor:pointer;padding:0 10px}
.interns-page .pg:hover:not(:disabled){border-color:var(--navy)}
.interns-page .pg.on{background:var(--navy);color:#fff;border-color:var(--navy)}
.interns-page .pg:disabled{color:#A0AEC0;cursor:default}

/* Profile view */
.interns-page .back{display:inline-flex;gap:8px;align-items:center;background:none;border:0;color:var(--navy);padding:6px 0;font:600 14px Inter,Arial,sans-serif;cursor:pointer;margin-bottom:16px}
.interns-page .back:hover{text-decoration:underline}
.interns-page .grid{display:grid;grid-template-columns:320px 1fr;gap:20px;align-items:start}
@media(max-width:900px){.interns-page .grid{grid-template-columns:1fr}}
.interns-page .side{padding:28px 24px;text-align:center}
.interns-page .big{width:96px;height:96px;border-radius:50%;background:var(--navy-soft);color:var(--navy);font-size:32px;font-weight:700;display:grid;place-items:center;margin:0 auto 14px;border:3px solid #fff;box-shadow:0 0 0 2px var(--navy-soft)}
.interns-page .side h2{margin:0;font-size:20px;font-weight:700;color:var(--text)}
.interns-page .sid{color:var(--muted);margin:4px 0 12px;font-size:13px}
.interns-page .info{text-align:left;border-top:1px solid var(--line);margin-top:22px;padding-top:6px}
.interns-page .row{display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-bottom:1px solid var(--line)}
.interns-page .row:last-child{border-bottom:0}
.interns-page .row svg{flex:none;color:var(--muted);margin-top:2px}
.interns-page .lbl{font-size:12px;color:var(--muted);font-weight:500}
.interns-page .val{margin-top:2px;font-weight:600;overflow-wrap:anywhere}
.interns-page .dl{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin-top:20px;background:var(--navy);border:1px solid var(--navy);color:#fff;border-radius:var(--icep-radius-md);padding:11px;font:600 14px Inter,Arial,sans-serif;cursor:pointer;transition:background-color .2s}
.interns-page .dl:hover{background:#12283F}
.interns-page .dl:disabled{opacity:.7;cursor:default}
.interns-page .dl.ok{background:var(--icep-active-tint);border-color:var(--icep-active);color:#166534}
.interns-page .dl-msg{font-size:13px;color:var(--icep-rejected);margin-top:8px;min-height:18px}
.interns-page .sec{margin-bottom:20px}
.interns-page .sec h3{display:flex;align-items:center;gap:10px;margin:0;padding:16px 22px;font-size:16px;font-weight:700;border-bottom:1px solid var(--line)}
.interns-page .sec h3 .ic{width:32px;height:32px;border-radius:var(--icep-radius-md);background:var(--navy-soft);color:var(--navy);display:grid;place-items:center}
.interns-page .kv{display:grid;grid-template-columns:1fr 1fr;gap:18px 24px;padding:20px 22px}
.interns-page .kv small{display:block;color:var(--muted);font-size:12px;margin-bottom:4px}
.interns-page .kv b{font-weight:600}
.interns-page .chips{display:flex;flex-wrap:wrap;gap:6px}
.interns-page .chip{padding:3px 10px;border-radius:999px;background:var(--navy-soft);color:var(--navy);font-size:12px;font-weight:600}
/* Recent activity as a small timeline */
.interns-page .act{list-style:none;margin:0;padding:18px 22px}
.interns-page .act li{position:relative;display:flex;align-items:center;gap:14px;padding:0 0 18px 0}
.interns-page .act li:last-child{padding-bottom:0}
.interns-page .act li:not(:last-child)::after{content:"";position:absolute;left:5px;top:16px;bottom:2px;width:2px;background:var(--line)}
.interns-page .act i{width:12px;height:12px;border-radius:50%;background:var(--navy);flex:none;box-shadow:0 0 0 3px var(--navy-soft)}
.interns-page .act i.ok{background:var(--icep-active);box-shadow:0 0 0 3px var(--icep-active-tint)}
.interns-page .act i.iv{background:var(--icep-completed);box-shadow:0 0 0 3px var(--icep-completed-tint)}
.interns-page .act span{margin-left:auto;color:var(--muted);font-size:13px;white-space:nowrap}
.interns-page .reveal{animation:intern-rise .45s var(--ease) both}
@keyframes intern-rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media(max-width:560px){.interns-page .kv{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){.interns-page .reveal,.interns-page tbody tr.trow{animation:none}.interns-page tbody tr.trow:hover{transform:none}}
`;

type Status = "Intern" | "Interviewee" | "Applicant" | "Past Intern";

interface Intern {
  id: string;
  name: string;
  studentNo: string;
  campus: string;
  status: Status;
  /** The full application from the database (details, position, skills, documents). */
  application: ApiApplication;
}

const STATUSES: Status[] = ["Intern", "Interviewee", "Applicant", "Past Intern"];
const STATUS_FROM_API: Partial<Record<ApiApplication["status"], Status>> = {
  PENDING: "Applicant",
  INTERVIEWEE: "Interviewee",
  ACCEPTED: "Intern",
};

/** Everyone who applied through the careers page (rejected applications are left out). */
function toInterns(applications: ApiApplication[]): Intern[] {
  return applications.flatMap((a) => {
    const status = STATUS_FROM_API[a.status];
    return status ? [{ id: a.id, name: a.fullName, studentNo: a.studentNumber, campus: a.position.campus.name, status, application: a }] : [];
  });
}

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("");

const pillClass = (s: Status) => `pill ${s.replace(" ", "")}`;
const fmt = (date?: string | null) =>
  date ? new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const ago = (date: string) => {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  return days <= 0 ? "Today" : days === 1 ? "1 day ago" : `${days} days ago`;
};

// Downloads the CV the applicant uploaded with their application.
function downloadCv(p: Intern) {
  return downloadApplicationDocument(p.application, "CV");
}

/* ---------------------------- Profile view ---------------------------- */

const Icon = ({ d, size = 16 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
const ICONS = {
  mail: "M4 6h16v12H4zM4 7l8 6 8-6",
  phone: "M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2",
  pin: "M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4",
  cap: "M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5",
  brief: "M4 8h16v11H4zM9 8V5h6v3",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  download: "M12 4v11M7 10l5 5 5-5M5 20h14",
  back: "M15 18l-6-6 6-6",
};

interface ProfileProps {
  intern: Intern;
  onBack: () => void;
}

function InternProfile({ intern, onBack }: ProfileProps) {
  const [downloaded, setDownloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const a = intern.application;
  const activity = [
    { text: "Application submitted", at: a.createdAt, tone: "" },
    ...(a.interviewAt ? [{ text: `Interview scheduled for ${fmt(a.interviewAt)}`, at: a.reviewedAt ?? a.updatedAt, tone: "iv" }] : []),
    ...(a.status === "ACCEPTED" ? [{ text: "Application accepted", at: a.reviewedAt ?? a.updatedAt, tone: "ok" }] : []),
  ].reverse();

  const handleDownload = async () => {
    setDownloadError("");
    setDownloading(true);
    try {
      await downloadCv(intern);
      setDownloaded(true);
      window.setTimeout(() => setDownloaded(false), 2500);
    } catch (error) {
      setDownloadError(apiErrorMessage(error, "The CV could not be downloaded."));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section>
      <button type="button" className="back" onClick={onBack}>
        <Icon d={ICONS.back} /> Back to interns
      </button>

      <div className="grid">
        <div className="card side reveal">
          <div className="big">{initials(intern.name)}</div>
          <h2>{intern.name}</h2>
          <div className="sid">{intern.studentNo}</div>
          <span className={pillClass(intern.status)}>{intern.status}</span>

          <div className="info">
            <div className="row"><Icon d={ICONS.mail} /><div><div className="lbl">Email address</div><div className="val">{a.email}</div></div></div>
            <div className="row"><Icon d={ICONS.phone} /><div><div className="lbl">Phone number</div><div className="val">{a.phone || "—"}</div></div></div>
            <div className="row"><Icon d={ICONS.pin} /><div><div className="lbl">Campus</div><div className="val">{intern.campus}</div></div></div>
          </div>

          <button type="button" className={`dl${downloaded ? " ok" : ""}`} onClick={() => void handleDownload()} disabled={downloading}>
            {downloaded ? "✓ CV downloaded" : downloading ? "Downloading…" : <><Icon d={ICONS.download} /> Download CV</>}
          </button>
          <div className="dl-msg">{downloadError}</div>
        </div>

        <div>
          <div className="card sec reveal" style={{ animationDelay: "80ms" }}>
            <h3><span className="ic"><Icon d={ICONS.cap} /></span>Academic background</h3>
            <div className="kv">
              <div><small>Qualification</small><b>{a.qualification}</b></div>
              <div><small>Year of Study</small><b>{yearLabel(a.yearOfStudy) || "—"}</b></div>
              <div><small>Institution</small><b>{a.institution}</b></div>
              <div><small>Skills</small>{a.skills.length ? <div className="chips">{a.skills.map((s) => <span key={s.skill.name} className="chip">{s.skill.name}</span>)}</div> : <b>—</b>}</div>
            </div>
          </div>

          <div className="card sec reveal" style={{ animationDelay: "160ms" }}>
            <h3><span className="ic"><Icon d={ICONS.brief} /></span>Internship details</h3>
            <div className="kv">
              <div><small>Position</small><b>{a.position.title}</b></div>
              <div><small>Department</small><b>{a.position.department.name}</b></div>
              <div><small>Start Date</small><b>{fmt(a.position.intake.startDate)}</b></div>
              <div><small>Expected End Date</small><b>{fmt(a.position.intake.endDate)}</b></div>
            </div>
          </div>

          <div className="card sec reveal" style={{ animationDelay: "240ms" }}>
            <h3><span className="ic"><Icon d={ICONS.clock} /></span>Recent activity</h3>
            <ul className="act">
              {activity.map((item) => (
                <li key={item.text}><i className={item.tone} />{item.text}<span>{ago(item.at)}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- List view ------------------------------ */

export function InternsPage() {
  const [query, setQuery] = useState("");
  const [campus, setCampus] = useState("");
  const [status, setStatus] = useState<"" | Status>("");
  const [perPage, setPerPage] = useState(8);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Applicants and interns from the database (everyone who applied on the careers page).
  const [INTERNS, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  useEffect(() => {
    let active = true;
    fetchApplications()
      .then((data) => { if (active) setInterns(toInterns(data)); })
      .catch((error: unknown) => { if (active) setLoadError(apiErrorMessage(error, "Could not load interns.")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const CAMPUSES = useMemo(() => Array.from(new Set(INTERNS.map((p) => p.campus))), [INTERNS]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return INTERNS.filter(
      (p) =>
        (!q || p.name.toLowerCase().includes(q) || p.studentNo.includes(q)) &&
        (!campus || p.campus === campus) &&
        (!status || p.status === status)
    );
  }, [INTERNS, query, campus, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * perPage;
  const rows = filtered.slice(start, start + perPage);

  const clearFilters = () => {
    setQuery("");
    setCampus("");
    setStatus("");
    setPage(1);
  };

  const selected = INTERNS.find((p) => p.id === selectedId);

  return (
    <div className="interns-page">
      <style>{CSS}</style>
      <div className="wrap">
        {selected ? (
          <InternProfile intern={selected} onBack={() => setSelectedId(null)} />
        ) : (
          <section>
            <div className="filters">
              <input
                className="field"
                placeholder="Search name or student number"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
              />
              <select
                className="field"
                value={campus}
                onChange={(e) => {
                  setCampus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All campuses</option>
                {CAMPUSES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                className="field"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as "" | Status);
                  setPage(1);
                }}
              >
                <option value="">All statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button type="button" className="clear" onClick={clearFilters}>
                Clear filters
              </button>
            </div>

            <div className="card">
              <div className="scroll">
                <table>
                  <thead>
                    <tr>
                      <th>NAME</th>
                      <th>STUDENT NO.</th>
                      <th>EMAIL</th>
                      <th>CAMPUS</th>
                      <th>STATUS</th>
                      <th>PROFILE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ color: "var(--muted)" }}>{loading ? "Loading interns…" : loadError || "No interns found."}</td>
                      </tr>
                    )}
                    {rows.map((p, i) => (
                      <tr key={p.id} className="trow" style={{ animationDelay: `${i * 45}ms` }}>
                        <td>
                          <div className="who">
                            <span className="av">{initials(p.name)}</span>
                            {p.name}
                          </div>
                        </td>
                        <td className="muted">{p.studentNo}</td>
                        <td className="muted">{p.application.email}</td>
                        <td>{p.campus}</td>
                        <td><span className={pillClass(p.status)}>{p.status}</span></td>
                        <td>
                          <button type="button" className="btn" onClick={() => setSelectedId(p.id)}>
                            View profile
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="foot">
                <span>
                  {filtered.length
                    ? `Showing ${start + 1}–${start + rows.length} of ${filtered.length} interns`
                    : "Showing 0 interns"}
                </span>
                <div className="pager">
                  <span>Rows per page</span>
                  <select
                    className="field"
                    style={{ height: 38 }}
                    value={perPage}
                    onChange={(e) => {
                      setPerPage(Number(e.target.value));
                      setPage(1);
                    }}
                  >
                    <option value={4}>4</option>
                    <option value={8}>8</option>
                  </select>
                  <button type="button" className="pg" disabled={current <= 1} onClick={() => setPage(current - 1)}>
                    Previous
                  </button>
                  {Array.from(
                    { length: Math.min(pageCount, 3) },
                    (_, i) => Math.min(Math.max(current - 1, 1), Math.max(pageCount - 2, 1)) + i
                  ).map((n) => (
                    <button
                      type="button"
                      key={n}
                      className={`pg${n === current ? " on" : ""}`}
                      onClick={() => setPage(n)}
                    >
                      {n}
                    </button>
                  ))}
                  <button type="button" className="pg" disabled={current >= pageCount} onClick={() => setPage(current + 1)}>
                    Next
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default InternsPage;