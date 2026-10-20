import { useEffect, useRef, useState } from "react";

/* ------------------------------ Styles ------------------------------ */

const CSS = `
.np{--bg:#f4f6f8;--card:#fff;--text:#12263f;--muted:#6b7a90;--border:#e5e9ef;--navy:#16345a;--navy-d:#12263f;--navy-soft:#e8edf4;--green:#17713a;--green-bg:#dcf7e6;--red:#c2300a;--red-bg:#fde4dc;--blue:#1d4fd8;--blue-bg:#dbe8fd;--amber:#8a4b08;--amber-bg:#fdf0c2;
 background:var(--bg);color:var(--text);font-family:Inter,system-ui,sans-serif;font-size:15px;padding:24px;min-height:100%}
@media (prefers-color-scheme: dark){.np{--bg:#0e1a2b;--card:#15253b;--text:#e9eef5;--muted:#93a3ba;--border:#24364f;--navy:#3b6aa8;--navy-d:#2f5a94;--navy-soft:#1f3350;--green-bg:#17402b;--green:#7ee0a3;--red-bg:#4a2018;--red:#ff9c80;--blue-bg:#1d3560;--blue:#9dbcff;--amber-bg:#4a3a12;--amber:#f2c66b}}
.np,.np *{box-sizing:border-box}
.np button{font-family:inherit}
.np-head{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;align-items:flex-start;margin-bottom:28px}
.np-head h1{margin:0 0 6px;font-size:26px}.np-head p{margin:0;color:var(--muted)}
.np-card{background:var(--card);border:1px solid var(--border);border-radius:14px}
.np-outlook{display:flex;align-items:center;gap:28px;padding:18px 20px}
.np-outlook b{display:block}.np-outlook small{color:var(--muted)}
.np-btn{height:40px;padding:0 16px;border-radius:10px;border:1px solid var(--border);background:var(--card);color:var(--text);font-weight:600;font-size:14px;cursor:pointer;white-space:nowrap}
.np-btn:hover{background:var(--bg)}.np-btn:disabled{opacity:.6;cursor:default}
.np-btn.sm{height:36px;padding:0 14px}
.np-btn.dark{background:var(--navy-d);color:#fff;border-color:var(--navy-d)}.np-btn.dark:hover{background:var(--navy)}
.np-btn.line{border:1.5px solid var(--navy-d)}
.np-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;max-width:1000px;margin-bottom:28px}
.np-stat{padding:18px 20px}.np-stat b{display:block;font-size:30px}.np-stat span{color:var(--muted)}
.np-tabs{display:flex;gap:22px;border-bottom:1px solid var(--border);margin-bottom:24px}
.np-tab{background:none;border:0;padding:10px 2px;font-size:17px;color:var(--muted);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px}
.np-tab.on{color:var(--text);font-weight:700;border-color:var(--navy-d)}
.np-split{display:grid;grid-template-columns:minmax(280px,380px) 1fr;gap:24px;align-items:start}
.np-bar{display:flex;gap:12px;margin-bottom:16px}
.np-input,.np-select,.np-text{width:100%;border:1px solid var(--border);background:var(--card);color:var(--text);border-radius:10px;padding:0 14px;font:inherit;height:44px}
.np-text{height:auto;padding:12px 14px;resize:vertical;line-height:1.6;min-height:170px}
.np-list{display:flex;flex-direction:column;gap:12px}
.np-item{text-align:left;width:100%;padding:16px 18px;border-radius:14px;border:1px solid var(--border);background:var(--card);color:var(--text);cursor:pointer;display:grid;grid-template-columns:1fr auto;gap:2px 10px}
.np-item:hover{border-color:var(--navy)}.np-item.on{border:2px solid var(--navy-d);padding:15px 17px}
.np-item b{grid-column:1/-1}.np-item small{color:var(--muted)}
.np-item .np-pill{grid-row:2/4;grid-column:2;align-self:end}
.np-pill{display:inline-block;padding:4px 12px;border-radius:999px;font-size:13px;font-weight:700}
.np-pill.Active,.np-pill.Sent.ok{background:var(--green-bg);color:var(--green)}
.np-pill.Draft{background:var(--amber-bg);color:var(--amber)}
.np-pill.Sent{background:var(--blue-bg);color:var(--blue)}
.np-pill.Failed{background:var(--red-bg);color:var(--red)}
.np-editor{padding:24px}
.np-editor h2{margin:0 0 2px;font-size:20px}.np-editor .sub{color:var(--muted);margin-bottom:18px}
.np-editor label{display:block;margin:14px 0 6px;color:var(--muted);font-size:14px}
.np-edit-grid{display:grid;grid-template-columns:1fr minmax(240px,340px);gap:24px}
.np-preview{border:1px solid var(--border);border-radius:12px;padding:16px;font-size:14px;align-self:start;margin-top:14px;overflow-wrap:anywhere}
.np-preview h4{margin:0 0 14px;font-size:13px;color:var(--muted)}
.np-preview p{margin:0 0 14px;white-space:pre-wrap}.np-preview a{color:var(--blue);text-decoration:none}
.np-actions{display:flex;justify-content:flex-end;gap:12px;margin-top:24px}
.np-filters{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px}.np-filters .np-select{width:200px}
.np-group{margin:0 0 10px;font-size:13px;letter-spacing:.04em;font-weight:700;color:var(--muted);text-transform:uppercase}
.np-row{display:flex;align-items:center;gap:20px;padding:16px 20px;margin-bottom:12px}
.np-row .info{flex:1;min-width:0}.np-row b{display:block}.np-row small{color:var(--muted);overflow-wrap:anywhere}
.np-empty{padding:40px;text-align:center;color:var(--muted)}
.np-overlay{position:fixed;inset:0;background:rgba(10,20,35,.55);display:grid;place-items:center;padding:20px;z-index:50}
.np-modal{width:min(560px,100%);padding:24px}.np-modal h3{margin:0 0 4px}
.np-modal dl{display:grid;grid-template-columns:110px 1fr;gap:10px 12px;margin:18px 0}.np-modal dt{color:var(--muted)}.np-modal dd{margin:0;overflow-wrap:anywhere}
.np-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--navy-d);color:#fff;padding:12px 20px;border-radius:10px;font-weight:600;z-index:60;box-shadow:0 6px 20px rgba(0,0,0,.25)}
@media(max-width:900px){.np-split,.np-edit-grid{grid-template-columns:1fr}.np-stats{grid-template-columns:repeat(2,1fr)}}
.np-stats.three{grid-template-columns:repeat(3,minmax(0,1fr));max-width:760px}
@media(max-width:900px){.np-stats.three{grid-template-columns:1fr}}
`;

/* ------------------------------- Types ------------------------------- */

type LogStatus = "Sent" | "Failed";

interface LogEntry {
  id: number;
  template: string;
  email: string;
  campus: string;
  group: string;
  time: string;
  status: LogStatus;
}

/* ---------------------------- Sample data ---------------------------- */

// Subjects shown in the "View" popup (keyed by template name).
const SUBJECTS: Record<string, string> = {
  "Application Received": "We received your ICEP application, {{first_name}}",
  "Interview Invitation": "Interview invitation - ICEP WIL placement",
  "Application Accepted + Set Password": "Welcome to ICEP, {{first_name}} - set your password",
  "Application Rejected": "Update on your ICEP application",
  "Intern Welcome": "Welcome aboard, {{first_name}}",
  "Intake Reminder": "Intake opens soon",
};
const TEMPLATE_NAMES = Object.keys(SUBJECTS);

const INITIAL_LOG: LogEntry[] = [
  { id: 1, template: "Application Received", email: "thabo.mokoena@tut.ac.za", campus: "Soshanguve", group: "Today", time: "09:15", status: "Sent" },
  { id: 2, template: "Application Accepted + Set Password", email: "lerato.s@tut.ac.za", campus: "Pretoria", group: "Today", time: "08:30", status: "Sent" },
  { id: 3, template: "Interview Invitation", email: "sipho.nkosi@tut.ac.za", campus: "Polokwane", group: "Yesterday", time: "16:50", status: "Failed" },
  { id: 4, template: "Application Rejected", email: "n.khoza@tut.ac.za", campus: "Arcadia", group: "Yesterday", time: "15:15", status: "Sent" },
  { id: 5, template: "Application Accepted + Set Password", email: "sipho.n@tut.ac.za", campus: "Die Bult", group: "10 Oct 2026", time: "11:45", status: "Sent" },
  { id: 6, template: "Interview Invitation", email: "a.dube@tut.ac.za", campus: "Soshanguve", group: "10 Oct 2026", time: "09:05", status: "Failed" },
];

const SAMPLE: Record<string, string> = { first_name: "Thabo", last_name: "Mokoena", campus: "Soshanguve" };
const fill = (s: string) => s.replace(/\{\{\s*(first_name|last_name|campus)\s*\}\}/g, (_, k: string) => SAMPLE[k]);

/* ------------------------------ Main page ----------------------------- */

export function NotificationsPage() {
  const [log, setLog] = useState<LogEntry[]>(INITIAL_LOG);
  const [fTemplate, setFTemplate] = useState("");
  const [fCampus, setFCampus] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [viewing, setViewing] = useState<LogEntry | null>(null);
  const [outlook, setOutlook] = useState<"connected" | "connecting">("connected");
  const [toast, setToast] = useState("");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const notify = (msg: string) => {
    setToast(msg);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(""), 2200);
  };

  const visible = log.filter(
    (l) => (!fTemplate || l.template === fTemplate) && (!fCampus || l.campus === fCampus) && (!fStatus || l.status === fStatus)
  );
  const groups = Array.from(new Set(visible.map((l) => l.group)));
  const campuses = Array.from(new Set(log.map((l) => l.campus)));

  const stats: [number, string][] = [
    [log.filter((l) => l.status === "Sent").length, "Sent this month"],
    [log.filter((l) => l.status === "Failed").length, "Failed to send"],
    [log.filter((l) => l.group === "Today").length, "Sent today"],
  ];

  const reconnect = () => {
    setOutlook("connecting");
    window.setTimeout(() => {
      setOutlook("connected");
      notify("Outlook reconnected");
    }, 1200);
  };

  const clearFilters = () => {
    setFTemplate("");
    setFCampus("");
    setFStatus("");
  };

  const resend = (id: number) => {
    notify("Resending…");
    window.setTimeout(() => {
      setLog((all) => all.map((l) => (l.id === id ? { ...l, status: "Sent" } : l)));
      notify("Email sent");
    }, 900);
  };

  return (
    <div className="np">
      <style>{CSS}</style>

      <div className="np-head">
        <div>
          <h1>Notifications</h1>
          <p>Track every email sent to applicants and interns.</p>
        </div>
        <div className="np-card np-outlook">
          <div>
            <b>Outlook: {outlook === "connected" ? "Connected" : "Connecting…"}</b>
            <small>wi.williamson@tut.ac.za</small>
          </div>
          <button type="button" className="np-btn line sm" disabled={outlook === "connecting"} onClick={reconnect}>
            Reconnect
          </button>
        </div>
      </div>

      <div className="np-stats three">
        {stats.map(([n, label]) => (
          <div key={label} className="np-card np-stat">
            <b>{n}</b>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="np-filters">
        <select className="np-select" value={fTemplate} onChange={(e) => setFTemplate(e.target.value)}>
          <option value="">All templates</option>
          {TEMPLATE_NAMES.map((n) => <option key={n}>{n}</option>)}
        </select>
        <select className="np-select" value={fCampus} onChange={(e) => setFCampus(e.target.value)}>
          <option value="">All campuses</option>
          {campuses.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="np-select" value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option>Sent</option>
          <option>Failed</option>
        </select>
        <button type="button" className="np-btn" style={{ height: 44 }} onClick={clearFilters}>
          Clear filters
        </button>
      </div>

      {groups.length === 0 && <div className="np-card np-empty">No emails match these filters.</div>}
      {groups.map((g) => (
        <section key={g} style={{ marginBottom: 24 }}>
          <h3 className="np-group">{g}</h3>
          {visible.filter((l) => l.group === g).map((l) => (
            <div key={l.id} className="np-card np-row">
              <span className={`np-pill ${l.status}`}>{l.status}</span>
              <div className="info">
                <b>{l.template}</b>
                <small>{l.email} • {l.campus} - {l.time}</small>
              </div>
              {l.status === "Failed" ? (
                <button type="button" className="np-btn" onClick={() => resend(l.id)}>Resend</button>
              ) : (
                <button type="button" className="np-btn" onClick={() => setViewing(l)}>View</button>
              )}
            </div>
          ))}
        </section>
      ))}

      {viewing && (
        <div className="np-overlay" onClick={() => setViewing(null)}>
          <div className="np-card np-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3>{viewing.template}</h3>
            <span className={`np-pill ${viewing.status}`}>{viewing.status}</span>
            <dl>
              <dt>To</dt><dd>{viewing.email}</dd>
              <dt>Campus</dt><dd>{viewing.campus}</dd>
              <dt>Sent</dt><dd>{viewing.group} at {viewing.time}</dd>
              <dt>Subject</dt><dd>{fill(SUBJECTS[viewing.template] ?? "")}</dd>
              <dt>Sent from</dt><dd>wi.williamson@tut.ac.za (Outlook)</dd>
            </dl>
            <div className="np-actions" style={{ marginTop: 0 }}>
              <button type="button" className="np-btn dark" onClick={() => setViewing(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="np-toast" role="status">{toast}</div>}
    </div>
  );
}

export default NotificationsPage;